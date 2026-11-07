/** Product trademarks in the brand plugin's dictionaries. */
export const en = { name: 'Panoptic Super', subtitle: '万象超级智能体' }
/** Simplified Chinese product name and English trademark. */
export const zh = { name: '万象超级智能体', subtitle: 'Panoptic Super' } satisfies Record<keyof typeof en, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Product name artwork text. */
    'panoptic.brand': keyof typeof en
  }
}
