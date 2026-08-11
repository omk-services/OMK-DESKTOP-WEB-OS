/* ────────────────────────────────────────────────────────────────────────────
   PageShell — Header + SubNav + children + Footer
   ──────────────────────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react';
import { Header } from './Header';
import { SubNav, type SubNavSection } from './SubNav';
import { Footer } from './Footer';
import { useSectionObserver } from '../effects/useSectionObserver';
import type { PageKey } from '../content';

export interface PageShellProps {
  active: PageKey;
  sections: readonly SubNavSection[];
  children: ReactNode;
}

export function PageShell({ active, sections, children }: PageShellProps) {
  const sectionIds = sections.map((s) => s.id);
  const activeId = useSectionObserver(sectionIds);
  return (
    <>
      <Header active={active} />
      <SubNav sections={sections} activeId={activeId} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
