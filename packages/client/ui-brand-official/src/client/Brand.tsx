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
    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--panoptic-deep)', color: 'var(--panoptic-badge-ink)', display: 'inline-flex', alignItems: 'center', height: 20 }}>
      <svg width="56.25" height="15" viewBox="0 0 45 12" role="img" aria-label={t('badge')} fill="none">
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="round" transform="translate(1 1)">
          <path d="M6 1H2.5C.5 1 .5 4.5 2.5 4.5H4C6.5 4.5 6.5 8.5 4 8.5H.5" />
          <path d="M9.5 1V6C9.5 9.5 15 9.5 15 6V1" />
          <path d="M19 8.5V1H22C25.5 1 25.5 5 22 5H19" />
          <path d="M33 1H27.5V8.5H33M27.5 4.5H32" />
          <path d="M36.5 8.5V1H39C42 1 42 4.8 39 4.8H36.5M39 4.8L42 8.5" />
        </g>
      </svg>
    </span>
  </span>
}
