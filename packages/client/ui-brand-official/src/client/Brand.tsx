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
 * Render the bilingual Panoptic Super trademark.
 * @param props - Framework-bound brand translations.
 * @returns the product wordmark.
 */
export function OfficialBrandName({ t }: PropsLocale<'panoptic.brand'>) {
  return <span aria-label={t('name')} style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
    <span>{t('name')}</span>
    <span style={{ fontSize: 11, letterSpacing: '0.04em', opacity: 0.75 }}>{t('subtitle')}</span>
  </span>
}
