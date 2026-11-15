import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from './locales.ts'
import mark from './assets/panoptic-logo.png'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'

/**
 * Render the supplied Panoptic Super orbital mark.
 * @param props - Host-supplied mark size.
 * @returns decorative artwork paired with the visible product name.
 */
export function OfficialBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  return <img src={mark} width={size} height={size} alt="" style={{ objectFit: 'contain' }} />
}

/**
 * Render the Panoptic Super wordmark.
 * @param props - Framework-bound brand translations.
 * @returns the product wordmark.
 */
export function OfficialBrandName({ t }: PropsLocale<'panoptic.brand'>) {
  return <span aria-label={t('name')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontFamily: 'var(--dsw-font-family-brand)', fontSize: 18, letterSpacing: '-0.03em', fontWeight: 500, color: 'var(--panoptic-wordmark-ink)' }}>
    <span>{t('wordmark')}</span>{' '}
    <span style={{ padding: '3px 7px', borderRadius: 6, background: 'var(--panoptic-deep)', color: 'var(--panoptic-badge-ink)', fontSize: 12, lineHeight: '18px', letterSpacing: '0.01em' }}>{t('badge')}</span>
  </span>
}
