/** Persistent project data associated with a Workspace and its primary conversation. */

import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Context } from '@deepseek-ai/cordis'
import { brandString } from '@deepseek-ai/dsh-brand'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { defineDomain, domainTable, type KvTable } from '@deepseek-ai/dsh-storage-domain'
import type { WorkspaceId } from './types.ts'

const sessionId = z.string().transform(value => brandString<SessionId>(value))
const text = z.string().trim().min(1).max(600)
const draftPlan = z.object({
  goal: text,
  constraints: z.array(text).max(12),
  steps: z.array(z.object({ title: text, acceptance: text })).min(2).max(12),
})
const evidence = z.object({ seq: z.int().nonnegative(), tool: z.string(), sha256: z.string() })
const plan = draftPlan.extend({
  revision: z.int().positive(),
  fromSeq: z.int().nonnegative(),
  steps: z.array(draftPlan.shape.steps.element.extend({ evidence: evidence.optional() })).min(2).max(12),
})
const decision = z.object({
  key: z.string().trim().min(1).max(80),
  value: text.nullable(),
  sourceSeq: z.int().nonnegative(),
  recordedAt: z.number(),
})
const operation = z.object({
  id: z.string(),
  tool: z.string(),
  argsHash: z.string(),
  state: z.enum(['pending', 'returned', 'verified-file', 'reviewed']),
  expectedFile: z.object({ path: z.string(), sha256: z.string(), bytes: z.int().nonnegative() }).optional(),
})

/** Project tool execution record. A pending operation can have applied an effect. */
export type ProjectOperation = z.infer<typeof operation>

const project = z.object({
  sessionId,
  createdAt: z.number(),
  plans: z.array(plan).default([]),
  decisions: z.array(decision).default([]),
  operations: z.array(operation).default([]),
})
type Project = z.infer<typeof project>

/** Validates project plan input submitted by the conversation tool. */
export const projectPlanInput = draftPlan

/** Validates explicit user decisions or revocations entered in a project conversation. */
export const projectDecisionInput = decision.pick({ key: true, value: true })

const domainSpec = defineDomain({
  name: 'project',
  version: 1,
  tables: { projects: domainTable<WorkspaceId, Project>(project) },
})

/** Owns one durable primary Session identity per registered Workspace. */
export class ProjectRegistry {
  private readonly reservations = new Map<WorkspaceId, Promise<SessionId>>()
  private records!: KvTable<WorkspaceId, Project>

  /** @param ctx - Workspace registry context and storage lifecycle owner. */
  constructor(private readonly ctx: Context) {}

  /** Open the registry before Workspace consumers can dispatch commands. */
  async initialize(): Promise<void> {
    const domain = await this.ctx.storageDomain.open(domainSpec)
    this.ctx.effect(() => () => domain.close(), 'project.domainClose')
    this.records = domain.table('projects')
  }

  /**
   * Reserve a primary identity before any caller creates its Session. A process
   * interrupted during creation will reopen the reserved identity on retry.
   * @param workspaceId - registered Workspace identity.
   * @returns the existing or freshly persisted primary Session identity.
   */
  async reserve(workspaceId: WorkspaceId): Promise<SessionId> {
    const pending = this.reservations.get(workspaceId)
    if (pending !== undefined) return pending
    const existing = this.records.get(workspaceId)
    if (existing !== undefined) return existing.sessionId
    const id = brandString<SessionId>(`session-${randomUUID()}`)
    const operation = this.records.put(workspaceId, {
      sessionId: id, createdAt: Date.now(), plans: [], decisions: [], operations: [],
    }).then(() => id)
    this.reservations.set(workspaceId, operation)
    try {
      return await operation
    } finally {
      this.reservations.delete(workspaceId)
    }
  }

  /**
   * Locate a project by its exact primary Session identity.
   * @param id - Session identity from the Host Agent registry.
   * @returns its Workspace identity, if it has a primary conversation.
   */
  ownerOf(id: SessionId): WorkspaceId | undefined {
    for (const [workspaceId, record] of this.records.entries()) {
      if (record.sessionId === id) return workspaceId
    }
  }

  /**
   * Load current context from storage. A superseded or revoked decision is excluded.
   * @param id - Workspace identity.
   * @returns the latest plan and currently effective decisions in the project.
   */
  context(id: WorkspaceId): {
    plan: z.infer<typeof plan> | undefined
    decisions: z.infer<typeof decision>[]
    pendingOperations: Pick<ProjectOperation, 'id' | 'tool'>[]
    recentOperations: Pick<ProjectOperation, 'id' | 'tool' | 'state' | 'expectedFile'>[]
  } {
    const project = this.records.get(id)
    const latest = new Map(project?.decisions.map(item => [item.key, item]))
    return {
      plan: project?.plans.at(-1),
      decisions: [...latest.values()].filter(item => item.value !== null),
      pendingOperations: this.pending(id).map(({ id, tool }) => ({ id, tool })),
      recentOperations: (project?.operations ?? []).filter(item => item.state !== 'pending').slice(-5)
        .map(({ id, tool, state, expectedFile }) => ({ id, tool, state, ...(expectedFile === undefined ? {} : { expectedFile }) })),
    }
  }

  /**
   * List calls whose external outcome still needs reconciliation.
   * @param id - Workspace identity.
   * @returns persisted pending operations in invocation order.
   */
  pending(id: WorkspaceId): ProjectOperation[] {
    return this.records.get(id)?.operations.filter(item => item.state === 'pending') ?? []
  }

  /**
   * Check whether cold reconciliation previously verified the same desired file contents.
   * @param id - Workspace identity.
   * @param expected - canonical path and desired content hash.
   * @returns whether a recovery record matches; callers still verify current file state.
   */
  verifiedWrite(id: WorkspaceId, expected: NonNullable<ProjectOperation['expectedFile']>): boolean {
    return this.records.get(id)?.operations.some(item => item.state === 'verified-file'
      && item.expectedFile?.path === expected.path && item.expectedFile.sha256 === expected.sha256) ?? false
  }

  /**
   * Register an intent before dispatch. Block additional effects while one remains unresolved.
   * @param id - Workspace identity.
   * @param intent - effect identity and optional postcondition.
   */
  async begin(id: WorkspaceId, intent: Omit<ProjectOperation, 'state'>): Promise<void> {
    await this.records.update(id, (current) => {
      if (current.operations.some(item => item.state === 'pending')) {
        throw new Error('inspect the unresolved project operation and request human review before writing again')
      }
      return { ...current, operations: [...current.operations, { ...intent, state: 'pending' }] }
    })
  }

  /**
   * Settle the named pending operation after a return, file check, or approved review.
   * @param id - Workspace identity.
   * @param operationId - the pending operation to settle.
   * @param state - the type of evidence that settled it.
   */
  async settle(id: WorkspaceId, operationId: string, state: Exclude<ProjectOperation['state'], 'pending'>): Promise<void> {
    await this.records.update(id, (current) => {
      if (!current.operations.some(item => item.id === operationId && item.state === 'pending')) {
        throw new Error('project operation is no longer pending')
      }
      return { ...current, operations: current.operations.map(item => item.id === operationId ? { ...item, state } : item) }
    })
  }

  /**
   * Save a new plan revision, retaining the previous plan and its evidence.
   * @param id - Workspace identity.
   * @param draft - validated objective, constraints, and ordered tasks.
   * @param fromSeq - the Session position at which the revision was written.
   * @returns the saved plan.
   */
  async plan(id: WorkspaceId, draft: z.infer<typeof draftPlan>, fromSeq: number): Promise<z.infer<typeof plan>> {
    const saved = await this.records.update(id, (current) => {
      const previous = current.plans.at(-1)
      if (previous?.fromSeq === fromSeq) return current
      const next = { ...draft, fromSeq, revision: (previous?.revision ?? 0) + 1 }
      return { ...current, plans: [...current.plans, next] }
    })
    const latest = saved.plans.at(-1)
    if (latest === undefined) throw new Error('project plan did not commit')
    return latest
  }

  /**
   * Attach verified evidence to a task in the current plan revision.
   * @param id - Workspace identity.
   * @param revision - revision selected by the execution turn.
   * @param step - zero-based position in the ordered plan.
   * @param receipt - durable Session result for this task.
   */
  async verify(id: WorkspaceId, revision: number, step: number, receipt: z.infer<typeof evidence>): Promise<void> {
    await this.records.update(id, (current) => {
      const latest = current.plans.at(-1)
      if (latest?.revision !== revision || receipt.seq <= latest.fromSeq) {
        throw new Error('verification must refer to a result produced after the current plan was saved')
      }
      if (latest.steps[step] === undefined || latest.steps.slice(0, step).some(item => item.evidence === undefined)) {
        throw new Error('complete the earlier project tasks before verifying this task')
      }
      if (latest.steps.some((item, index) => index !== step && item.evidence?.seq === receipt.seq)) {
        throw new Error('this verification result is already assigned to another task')
      }
      const steps = latest.steps.map((task, index) => index === step ? { ...task, evidence: receipt } : task)
      return { ...current, plans: [...current.plans.slice(0, -1), { ...latest, steps }] }
    })
  }

  /**
   * Save or revoke an explicitly stated project decision and retain its source.
   * @param id - Workspace identity.
   * @param entry - validated decision key and value, or null for revocation.
   * @param sourceSeq - user Session event that requested the change.
   */
  async remember(id: WorkspaceId, entry: z.infer<typeof projectDecisionInput>, sourceSeq: number): Promise<void> {
    const recordedAt = Date.now()
    await this.records.update(id, (current) => {
      if (current.decisions.some(item => item.key === entry.key && item.sourceSeq === sourceSeq)) return current
      const decisions = [...current.decisions, { ...entry, sourceSeq, recordedAt }]
      const keys = new Map(decisions.map(item => [item.key, item.value]))
      if ([...keys.values()].filter(value => value !== null).length > 12) {
        throw new Error('project decision capacity reached; revoke a superseded decision first')
      }
      return { ...current, decisions }
    })
  }
}
