/**
 * LevelSelector — le selecteur de niveau d'entree (Architecte / Coach /
 * Decouvrir sans compte). Voir SOCLE.md du brief : trois entrees distinctes,
 * deux branches authentifiees + une branche demonstration sans compte.
 *
 * Apparence : trois tuiles rangees, une seule selectionnee a la fois.
 * La selection met a jour un anneau + un fond colore. Les tuiles ne
 * deplacent jamais le formulaire parent : leur bloc est pose au-dessus
 * du formulaire, dans une zone dediee.
 */

import { motion } from 'motion/react';
import { Building2, UserCircle, Sparkles } from 'lucide-react';
import { TENANT_LEVELS, type TenantLevel } from '../../lib/authProviders';

export interface LevelSelectorProps {
  value: TenantLevel;
  onChange: (v: TenantLevel) => void;
  /** La tuile demo reste-t-elle visible ? Cachee par defaut dans un flux
   *  purement authentifie. */
  showDemo?: boolean;
}

const ICONS: Record<TenantLevel, typeof Building2> = {
  architect: Building2,
  coach: UserCircle,
  demo: Sparkles,
};

export function LevelSelector({ value, onChange, showDemo = true }: LevelSelectorProps): import('react').ReactNode {
  return (
    <div className="flex flex-col gap-2 mt-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 px-1">
        Qui est-ce qui se connecte ?
      </p>
      <div className="grid grid-cols-3 gap-2">
        {TENANT_LEVELS.filter((l) => showDemo || l.id !== 'demo').map((l) => {
          const active = l.id === value;
          const Icon = ICONS[l.id];
          return (
            <motion.button
              key={l.id}
              type="button"
              onClick={() => onChange(l.id)}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-start gap-1 p-3 rounded-xl text-left"
              data-level={l.id}
              style={{
                background: active ? 'rgba(240,129,67,0.12)' : 'rgba(255,255,255,0.5)',
                border: active ? '2px solid #f08143' : '1px solid rgba(15,23,42,0.10)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <Icon
                  className="w-3.5 h-3.5"
                  style={{ color: active ? '#c2410c' : '#78716c' }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: active ? '#7c2d12' : '#292524' }}
                >
                  {l.label}
                </span>
              </div>
              <p
                className="text-[10px] leading-snug"
                style={{ color: active ? '#9a3412' : '#78716c' }}
              >
                {l.helper}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}