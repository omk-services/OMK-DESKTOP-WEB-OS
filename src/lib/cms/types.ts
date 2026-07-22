/** CMS engine types — generic "collection of items, dynamic page renders one" model
 *  inspired by the Wix CMS overview: collections store content separate from the
 *  editor, repeaters render a collection as a list, dynamic pages share one
 *  structure and bind to whichever item is open. */

export type CmsFieldType = 'text' | 'longtext' | 'badge' | 'date' | 'currency' | 'number';

export interface CmsField {
  key: string;
  label: string;
  type: CmsFieldType;
}

export interface CmsItem {
  id: string;
  [key: string]: unknown;
}

export interface CmsCollectionDef {
  id: string;
  name: string;
  singular: string;
  accent: string;
  /** which item field renders as the repeater/page title */
  titleField: string;
  /** optional secondary line under the title */
  subtitleField?: string;
  /** optional field rendered as a colored badge in the repeater */
  badgeField?: string;
  /** ordered fields the dynamic page template renders below the header */
  fields: CmsField[];
}
