/* ────────────────────────────────────────────────────────────────────────────
   SubNav — barre horizontale intra-page, suit le défilement
   ──────────────────────────────────────────────────────────────────────────── */

export interface SubNavSection {
  id: string;
  label: string;
}

export interface SubNavProps {
  sections: readonly SubNavSection[];
  activeId: string | null;
}

export function SubNav({ sections, activeId }: SubNavProps) {
  if (sections.length === 0) return null;
  return (
    <nav className="site-subnav" aria-label="Sections de la page">
      <div className="site-subnav__inner">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={activeId === s.id ? 'true' : undefined}
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
