/** WindowContext — lets an app report its active sub-page AND an optional open
 *  "detail" item up to the WindowFrame breadcrumbs, so the trail reads
 *  App > Section > Item and clicking the middle segment returns to the list. */
import { createContext, useContext } from 'react';

export interface DetailCrumb {
  label: string;
  onBack: () => void;
}

interface WindowContextValue {
  activePage: string;
  setActivePage: (page: string) => void;
  detail: DetailCrumb | null;
  setDetail: (detail: DetailCrumb | null) => void;
}

export const WindowContext = createContext<WindowContextValue>({
  activePage: 'Overview',
  setActivePage: () => {},
  detail: null,
  setDetail: () => {},
});

export function useWindowPage() {
  return useContext(WindowContext);
}
