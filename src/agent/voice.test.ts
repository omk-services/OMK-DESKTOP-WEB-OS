/**
 * voice.test.ts — tests du service vocal (cote service, pas DOM).
 *
 * Le DOM est moque partiellement via jsdom. SpeechRecognition et
 * SpeechSynthesis sont des API navigateur : on les simule pour verifier
 * les transitions d'etat, le sanitizer, la liberte du singleton de
 * speaker. Les tests integration (bouton micro, indicateur) passent par
 * Playwright dans outils/captures/.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasRecognition,
  hasSynthesis,
  sanitizeForSpeech,
  claimSpeaker,
  preemptSpeaker,
  pickDefaultVoice,
} from './voice';

describe('detectabilite des API navigateur', () => {
  it('hasRecognition rend false si rien n\'est pose', () => {
    // jsdom ne pose ni SpeechRecognition ni webkitSpeechRecognition.
    expect(hasRecognition()).toBe(false);
  });

  it('hasSynthesis rend false si window.speechSynthesis manque', () => {
    expect(hasSynthesis()).toBe(false);
  });
});

describe('sanitizeForSpeech', () => {
  it('mode "none" ne change rien', () => {
    const txt = 'Carte 4242 4242 4242 4242, email jean@omk.fr, +33 6 12 34 56 78';
    expect(sanitizeForSpeech(txt, 'none')).toBe(txt);
  });

  it('mode "safe" masque les coordonnees personnelles evidentes', () => {
    const out = sanitizeForSpeech(
      'Carte 4242 4242 4242 4242, email jean@omk.fr, +33 6 12 34 56 78',
      'safe',
    );
    expect(out).toContain('[numero masque]');
    expect(out).toContain('[email masque]');
    expect(out).toContain('[telephone masque]');
    // Pas de chiffres bruts qui passent.
    expect(out).not.toMatch(/\b4242\b/);
    expect(out).not.toMatch(/jean@omk\.fr/);
    expect(out).not.toMatch(/\+33 6 12 34 56 78/);
  });

  it('mode "strict" masque aussi montants et dates', () => {
    const out = sanitizeForSpeech(
      'Le client doit 1800 EUR le 12/04/2026',
      'strict',
    );
    expect(out).toContain('[montant masque]');
    expect(out).toContain('[date masquee]');
  });

  it('mode "safe" ne masque PAS les montants (volontaire)', () => {
    const out = sanitizeForSpeech('Le client doit 1800 EUR', 'safe');
    expect(out).toBe('Le client doit 1800 EUR');
  });

  it('masque un IBAN', () => {
    const out = sanitizeForSpeech('Virement FR76 3000 6000 0112 3456 7890 189', 'safe');
    expect(out).toContain('[IBAN masque]');
  });

  it('masque un SSN', () => {
    const out = sanitizeForSpeech('Mon SSN est 123-45-6789', 'safe');
    expect(out).toContain('[identifiant masque]');
  });

  it('texte vide reste vide', () => {
    expect(sanitizeForSpeech('', 'safe')).toBe('');
    expect(sanitizeForSpeech('', 'strict')).toBe('');
  });

  it('ne casse pas un texte qui ne contient aucun motif', () => {
    expect(sanitizeForSpeech('Bonjour, comment ça va ?', 'safe'))
      .toBe('Bonjour, comment ça va ?');
  });
});

describe('singleton de speaker : un seul a la fois', () => {
  beforeEach(() => {
    // On reinitialise : claimSpeaker/preemptSpeaker touchent un let module-scope.
    // Pas de cleanup expose, mais l'ordre des tests est lineaire.
    const id = `reset-${Math.random()}`;
    preemptSpeaker(id);
  });

  it('claimSpeaker coupe le precedent si un autre agent parle', () => {
    let aCancelled = false;
    const releaseA = claimSpeaker('agent-a', () => { aCancelled = true; });
    expect(typeof releaseA).toBe('function');
    // claimSpeaker('agent-b') appelle preemptSpeaker('agent-b') qui coupe
    // l'agent courant (agent-a) en appellant son cancel.
    claimSpeaker('agent-b', () => {});
    expect(aCancelled).toBe(true);
    // L'ancienne release est obsolete (currentSpeaker est agent-b).
    releaseA();
  });

  it('claimSpeaker par le meme agent ne se coupe pas lui-meme', () => {
    let a1canceled = false;
    const release = claimSpeaker('agent-a', () => { a1canceled = true; });
    claimSpeaker('agent-a', () => {});
    expect(a1canceled).toBe(false);
    release();
  });

  it('preemptSpeaker coupe l\'autre agent', () => {
    let cut = false;
    claimSpeaker('agent-a', () => { cut = true; });
    expect(preemptSpeaker('agent-b')).toBe(true);
    expect(cut).toBe(true);
  });

  it('preemptSpeaker par le meme agent est un no-op', () => {
    let cut = false;
    claimSpeaker('agent-a', () => { cut = true; });
    expect(preemptSpeaker('agent-a')).toBe(false);
    expect(cut).toBe(false);
  });
});

describe('pickDefaultVoice', () => {
  it('rend null si aucune voix n\'est disponible', () => {
    expect(pickDefaultVoice()).toBeNull();
  });

  it('choisit la premiere voix francaise si disponible', () => {
    // Pose une voix via window.speechSynthesis.getVoices.
    const fakeVoices: SpeechSynthesisVoice[] = [
      { name: 'Alex', lang: 'en-US', localService: true, voiceURI: 'Alex', default: false } as SpeechSynthesisVoice,
      { name: 'Amelie', lang: 'fr-FR', localService: true, voiceURI: 'Amelie', default: false } as SpeechSynthesisVoice,
      { name: 'Thomas', lang: 'fr-CA', localService: true, voiceURI: 'Thomas', default: false } as SpeechSynthesisVoice,
    ];
    (window as unknown as { speechSynthesis: { getVoices: () => SpeechSynthesisVoice[] } }).speechSynthesis = {
      getVoices: () => fakeVoices,
    };
    const v = pickDefaultVoice();
    expect(v?.name).toBe('Amelie');
  });
});