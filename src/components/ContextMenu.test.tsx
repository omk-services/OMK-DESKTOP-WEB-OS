// src/components/ContextMenu.test.tsx
// Tests du menu contextuel — sans RTL (pas installé) : on monte le composant
// dans une div jsdom et on lit les éléments via les APIs natives du DOM.
// Le contrat est le même, l'écriture est un peu plus verbeuse.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';

const items: ContextMenuItem[] = [
  { id: 'a', label: 'Action A', action: vi.fn() },
  { id: 'b', label: 'Action B (disabled)', disabled: true, action: vi.fn() },
  { id: 'c', label: 'Action C', action: vi.fn(), separatorAfter: true },
  { id: 'd', label: 'Action D', action: vi.fn() },
];

let hote: HTMLDivElement | null = null;
let racine: ReturnType<typeof createRoot> | null = null;

function monter(jsx: import('react').ReactNode): void {
  hote = document.createElement('div');
  document.body.appendChild(hote);
  racine = createRoot(hote);
  act(() => {
    racine!.render(jsx);
  });
}

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1920 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1080 });
});

afterEach(() => {
  act(() => racine?.unmount());
  hote?.remove();
  hote = null;
  racine = null;
  vi.clearAllMocks();
});

describe('ContextMenu — rendu', () => {
  it('expose role="menu" sur le conteneur', () => {
    monter(<ContextMenu x={100} y={100} items={items} onClose={vi.fn()} />);
    expect(hote!.querySelector('[role="menu"]')).not.toBeNull();
  });

  it('affiche le libellé de chaque item', () => {
    monter(<ContextMenu x={100} y={100} items={items} onClose={vi.fn()} />);
    for (const item of items) {
      expect(hote!.textContent).toContain(item.label);
    }
  });

  it('rend les items désactivés avec l\'attribut HTML `disabled`', () => {
    monter(<ContextMenu x={100} y={100} items={items} onClose={vi.fn()} />);
    const btns = Array.from(hote!.querySelectorAll('button[role="menuitem"]'));
    const b = btns.find((b) => b.textContent === 'Action B (disabled)');
    expect(b).toBeDefined();
    expect((b as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('ContextMenu — actions', () => {
  it('appelle l\'action ET ferme le menu au clic sur un item actif', () => {
    const onClose = vi.fn();
    const action = vi.fn();
    monter(
      <ContextMenu
        x={100}
        y={100}
        items={[{ id: 'x', label: 'X', action }]}
        onClose={onClose}
      />,
    );
    const btn = hote!.querySelector('button[role="menuitem"]') as HTMLButtonElement;
    act(() => btn.click());
    expect(action).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('n\'appelle PAS l\'action sur un item désactivé', () => {
    const onClose = vi.fn();
    const action = vi.fn();
    monter(
      <ContextMenu
        x={100}
        y={100}
        items={[{ id: 'x', label: 'X', disabled: true, action }]}
        onClose={onClose}
      />,
    );
    const btn = hote!.querySelector('button[role="menuitem"]') as HTMLButtonElement;
    act(() => btn.click());
    expect(action).not.toHaveBeenCalled();
  });
});

describe('ContextMenu — fermeture', () => {
  it('ferme sur Escape', () => {
    const onClose = vi.fn();
    monter(<ContextMenu x={100} y={100} items={items} onClose={onClose} />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ferme sur mousedown hors menu', () => {
    const onClose = vi.fn();
    monter(<ContextMenu x={100} y={100} items={items} onClose={onClose} />);
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('NE ferme PAS sur mousedown À L\'INTÉRIEUR du menu', () => {
    const onClose = vi.fn();
    monter(<ContextMenu x={100} y={100} items={items} onClose={onClose} />);
    const menu = hote!.querySelector('[role="menu"]') as HTMLElement;
    act(() => {
      menu.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('ContextMenu — clamp viewport', () => {
  it('clampe la position contre le bord droit du viewport', () => {
    // x très grand : sans clamp, le menu dépasserait à droite de 1920px.
    monter(<ContextMenu x={3000} y={100} items={items} onClose={vi.fn()} />);
    const menu = hote!.querySelector('[role="menu"]') as HTMLElement;
    // useLayoutEffect a déjà tourné (synchronous après mount dans act()).
    const left = parseInt(menu.style.left, 10);
    expect(left).toBeLessThanOrEqual(1920);
    expect(left).toBeGreaterThanOrEqual(0);
  });

  it('clampe la position contre le bord bas du viewport', () => {
    monter(<ContextMenu x={100} y={3000} items={items} onClose={vi.fn()} />);
    const menu = hote!.querySelector('[role="menu"]') as HTMLElement;
    const top = parseInt(menu.style.top, 10);
    expect(top).toBeLessThanOrEqual(1080);
    expect(top).toBeGreaterThanOrEqual(0);
  });
});
