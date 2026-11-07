/** Product trademarks in the brand plugin's dictionaries. */
export const en = { name: 'Panoptic Super' }
/** Product trademark for the Simplified Chinese interface. */
export const zh = { name: 'Panoptic Super' } satisfies Record<keyof typeof en, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Product name artwork text. */
    'panoptic.brand': keyof typeof en
  }
}
