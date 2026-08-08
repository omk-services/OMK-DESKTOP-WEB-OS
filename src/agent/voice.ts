/**
 * voice.ts — service vocal du bureau.
 *
 * Toute la logique vit ici : reconnaissance (SpeechRecognition) et synthèse
 * (SpeechSynthesis). On expose une API minimale que AgentTile consomme via
 * deux hooks distincts (`useVoiceRecognition`, `useVoiceSynthesis`).
 *
 * Trois invariants a respecter par tout le code qui s'y branche :
 *
 * 1. Aucun service tiers. Les deux APIs sont natives au navigateur. Si elles
 *    sont absentes, le composant AgentTile ne rend pas le bouton micro.
 *
 * 2. Un seul speaker a la fois. Si un nouvel agent commence a parler pendant
 *    qu'un autre parle, l'ancien est coupe net. Justification : l'API
 *    SpeechSynthesis est mono-voix par systeme, et deux personnages qui
 *    parlent en meme temps sont inaudibles. C'est aussi le geste humain
 *    naturel — on ne coupe pas la parole dans une conversation reelle.
 *
 * 3. Toute reconnaissance ou synthese est nettoyee au demontage. Une
 *    reconnaissance en cours laisse le micro ouvert ; une synthese en cours
 *    continue de parler. Les deux jouent l'animation du personnage apres le
 *    unmount, ce qui est le pire cas : un micro ouvert sans signal visible,
 *    et une voix sans visage. `useVoiceRecognition` / `useVoiceSynthesis`
 *    le font systematiquement.
 *
 * Politique de confidentialite :
 *
 * Avant de synthetiser un texte de l'agent, on le passe par `sanitizeForSpeech`
 * selon le mode choisi (none | safe | strict). Le mode `safe` est le defaut :
 * il remplace les motifs qui ressemblent a des coordonnees personnelles
 * (numero de carte, telephone, email, SSN-like) par des jetons neutres.
 * Sans ca, un agent qui recite "le ticket de Marcus Reyes est 1800 EUR" peut
 * donner a voix haute des chiffres qu'on ne voudrait pas voir traverses dans
 * une piece ouverte.
 *
 * Ce n'est pas une politique de confidentialite complete : un numero de CB est
 * facile a reconnaitre, un nom de client ou un montant de transaction ne
 * l'est pas. La regle posee ici est minimale et honnete — voir le rapport
 * pour ce qui reste a faire.
 */

// ────────────────────────────────────────────────────────────────────────────
// Types Web Speech API. Le DOM lib standard ne declare pas SpeechRecognition
// (ni `webkitSpeechRecognition`) — seulement les evenements. On pose les
// types utilises ici, juste ce qu'il faut pour piloter la lib sans la
// deviner. Source : MDN Web Speech API.
// ────────────────────────────────────────────────────────────────────────────

export type SpeechState = 'idle' | 'listening' | 'speaking' | 'denied' | 'unavailable';

export type PrivacyMode = 'none' | 'safe' | 'strict';

export interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

export interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

/** Detectabilite : Web Speech API est prefixee `webkit` sur Chromium. */
export function getRecognitionCtor(): SpeechRecognitionStatic | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionStatic; webkitSpeechRecognition?: SpeechRecognitionStatic };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function hasRecognition(): boolean {
  return getRecognitionCtor() !== null;
}

export function hasSynthesis(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
}

/** Liste les voix disponibles. */
export function listVoices(): SpeechSynthesisVoice[] {
  if (!hasSynthesis()) return [];
  return window.speechSynthesis.getVoices();
}

/** Selection par defaut : premiere voix francaise, sinon premiere voix tout
 *  court. Renvoie null si la liste est vide (timing : getVoices peut etre
 *  vide au premier appel sur Chrome). */
export function pickDefaultVoice(): SpeechSynthesisVoice | null {
  const voix = listVoices();
  if (voix.length === 0) return null;
  const fr = voix.find((v) => /^fr/i.test(v.lang));
  return fr ?? voix[0];
}

/** Sur Chromium, getVoices() peut renvoyer un tableau vide pendant les
 *  premieres millisecondes du chargement. On attend un tick et on
 *  re-tente. Renvoie la liste des voix quand elle est non vide, ou un
 *  tableau vide apres `ms` (defaut 1 s). */
export function loadVoicesWithTimeout(ms = 1000): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!hasSynthesis()) return resolve([]);
    const initial = window.speechSynthesis.getVoices();
    if (initial.length > 0) return resolve(initial);
    const start = performance.now();
    const tick = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) return resolve(v);
      if (performance.now() - start > ms) return resolve([]);
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Sanitisation pour la parole
// ────────────────────────────────────────────────────────────────────────────

/** Motifs reconnus par le sanitizer `safe`. Un test de plus n'est pas de
 *  trop : une regex trop permissive transforme un devis en charabia. */
const PATTERNS_SAFE: Array<{ re: RegExp; repl: string }> = [
  // IBAN (avant le numero de carte, qui pourrait sinon grignoter la
  // partie numerique d'un IBAN).
  // L'IBAN tolere les espaces en presentation : on accepte `[ ]?` entre
  // chaque groupe.
  { re: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\b/g, repl: '[IBAN masque]' },
  // Numeros de carte (13-19 chiffres, groupes de 4)
  { re: /\b(?:\d[ -]*?){13,19}\b/g, repl: '[numero masque]' },
  // Email
  { re: /\b[\w._-]+@[\w-]+\.[\w.-]+\b/g, repl: '[email masque]' },
  // Telephone francais (+33, 0X XX XX XX XX, formats avec points)
  { re: /(?:\+33\s?|0)\s?[1-9](?:[ .-]?\d{2}){4}/g, repl: '[telephone masque]' },
  // SSN americain (XXX-XX-XXXX)
  { re: /\b\d{3}-\d{2}-\d{4}\b/g, repl: '[identifiant masque]' },
];

const PATTERNS_STRICT: Array<{ re: RegExp; repl: string }> = [
  ...PATTERNS_SAFE,
  // Montants en euros : tolerant aux separateurs, simple "1800 EUR" ou
  // "1 800,50 EUR". La devise avant le nombre est aussi OK ("EUR 1800").
  { re: /\b\d+(?:[ ,.]\d+)*\s*(?:€|EUR)\b|\b(?:€|EUR)\s*\d+(?:[ ,.]\d+)*\b/gi, repl: '[montant masque]' },
  // Montants en dollars
  { re: /\$\s?\d+(?:[,.]\d+)*/g, repl: '[montant masque]' },
  // Dates type "12/04/2026" ou "2026-04-12"
  { re: /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, repl: '[date masquee]' },
];

/** Applique le sanitizer au texte avant la lecture a voix haute.
 *
 *  `mode = 'none'` ne change rien — utile en dev, et pour l'utilisateur qui
 *  veut entendre exactement ce que l'agent a ecrit.
 *
 *  `mode = 'safe'` (defaut) masque les coordonnees personnelles evidentes.
 *
 *  `mode = 'strict'` masque aussi montants et dates.
 */
export function sanitizeForSpeech(text: string, mode: PrivacyMode): string {
  if (mode === 'none' || !text) return text;
  const table = mode === 'strict' ? PATTERNS_STRICT : PATTERNS_SAFE;
  let out = text;
  for (const { re, repl } of table) {
    out = out.replace(re, repl);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Singleton de parole : un seul speaker a la fois
// ────────────────────────────────────────────────────────────────────────────

interface SpeakerClaim {
  id: string;
  cancel: () => void;
}

let currentSpeaker: SpeakerClaim | null = null;

/** Coupe la parole en cours si l'agent n'est pas celui qui parle.
 *  Renvoie true si on a coupe quelqu'un, false sinon. */
export function preemptSpeaker(id: string): boolean {
  if (!currentSpeaker) return false;
  if (currentSpeaker.id === id) return false;
  currentSpeaker.cancel();
  currentSpeaker = null;
  return true;
}

/** Demarre une nouvelle prise de parole. Si une autre est en cours, elle est
 *  coupee avant. Renvoie une fonction qui libere la prise. */
export function claimSpeaker(id: string, cancel: () => void): () => void {
  preemptSpeaker(id);
  const claim: SpeakerClaim = {
    id,
    cancel: () => {
      cancel();
      if (currentSpeaker?.id === id) currentSpeaker = null;
    },
  };
  currentSpeaker = claim;
  return () => {
    if (currentSpeaker?.id === id) {
      cancel();
      currentSpeaker = null;
    }
  };
}

import { useEffect, useRef, useState, useCallback } from 'react';

// ────────────────────────────────────────────────────────────────────────────
// useVoiceRecognition — un hook qui pose le micro, retourne l'etat et la
// transcription progressive.
// ────────────────────────────────────────────────────────────────────────────

export interface RecognitionOpts {
  enabled: boolean;
  lang?: string;
  /** Appele quand une transcription finale est prete. Le parent l'envoie a
   *  l'agent comme un message utilisateur. */
  onFinal?: (text: string) => void;
}

export function useVoiceRecognition(opts: RecognitionOpts) {
  const { enabled, lang = 'fr-FR' } = opts;
  const [state, setState] = useState<SpeechState>('idle');
  const [interim, setInterim] = useState('');
  const [final, setFinal] = useState('');
  const recRef = useRef<SpeechRecognition | null>(null);
  const cbRef = useRef(opts.onFinal);
  cbRef.current = opts.onFinal;

  // Cleanup au unmount — un micro ouvert sans composant est inacceptable.
  useEffect(() => {
    return () => {
      const r = recRef.current;
      if (r) {
        try { r.abort(); } catch { /* ignore */ }
        recRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    const r = recRef.current;
    if (!r) return;
    try { r.stop(); } catch { /* ignore */ }
    recRef.current = null;
    setState('idle');
    setInterim('');
  }, []);

  const start = useCallback(() => {
    if (!enabled) return;
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setState('unavailable');
      return;
    }
    // Si une session est deja en cours, on la coupe avant d'en creer une.
    if (recRef.current) {
      try { recRef.current.stop(); } catch { /* ignore */ }
    }
    const rec: SpeechRecognition = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalAcc = '';
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let interimBuf = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const txt = r[0]?.transcript ?? '';
        if (r.isFinal) {
          finalAcc += txt;
          setFinal(finalAcc);
          cbRef.current?.(finalAcc.trim());
        } else {
          interimBuf += txt;
        }
      }
      setInterim(interimBuf);
    };
    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      // 'no-speech' est un evenement frequent, pas une erreur dure.
      if (ev.error === 'no-speech') {
        setState('idle');
        return;
      }
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        setState('denied');
        return;
      }
      // Toute autre erreur : on remonte l'etat 'idle'. Le micro sera
      // automatiquement ferme par le navigateur.
      setState('idle');
    };
    rec.onend = () => {
      recRef.current = null;
      setInterim('');
      // Si on a ete coupe par un abort explicite, l'etat est deja 'idle'.
      setState((s) => (s === 'listening' ? 'idle' : s));
    };

    recRef.current = rec;
    setState('listening');
    try {
      rec.start();
    } catch {
      // start() peut jeter si on est deja en cours. On remet l'etat a zero.
      setState('idle');
      recRef.current = null;
    }
  }, [enabled, lang]);

  return { state, interim, final, start, stop };
}

// ────────────────────────────────────────────────────────────────────────────
// useVoiceSynthesis — un hook qui joue un texte, gere le stop, et tient
// l'agent en vie le temps que la parole tourne.
//
// Strategie simplifiee : on ne fait PAS de file d'attente. speak() lance
// une nouvelle utterance ; si une autre est en cours, elle est coupee par
// claimSpeaker/preemptSpeaker (un seul speaker a la fois). C'est plus
// simple et plus predictible qu'une file : l'utilisateur demande stop,
// la parole s'arrete ; le prochain message coupe le precedent.
// ────────────────────────────────────────────────────────────────────────────

export interface SynthesisOpts {
  enabled: boolean;
  voiceName?: string | null;
  rate?: number;
  privacy?: PrivacyMode;
  agentId: string;
}

export function useVoiceSynthesis(opts: SynthesisOpts) {
  const { enabled, voiceName, rate = 1.0, privacy = 'safe', agentId } = opts;
  const [state, setState] = useState<SpeechState>(hasSynthesis() ? 'idle' : 'unavailable');
  // Une ref qui pointe sur l'utterance courante, pour pouvoir l'annuler.
  const currentRef = useRef<SpeechSynthesisUtterance | null>(null);
  // release de la prise de parole en cours.
  const releaseRef = useRef<(() => void) | null>(null);

  // Stop immediat — coupe la parole en cours.
  const stop = useCallback(() => {
    if (releaseRef.current) {
      releaseRef.current();
      releaseRef.current = null;
    }
    currentRef.current = null;
    if (hasSynthesis() && window.speechSynthesis.speaking) {
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    }
    setState('idle');
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !hasSynthesis()) return;
      const safe = sanitizeForSpeech(text, privacy);
      if (!safe.trim()) return;
      // Coupe la parole en cours : un seul speaker a la fois.
      stop();

      const utt = new SpeechSynthesisUtterance(safe);
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const v = voiceName
          ? voices.find((x) => x.name === voiceName)
          : voices.find((x) => /^fr/i.test(x.lang)) ?? voices[0];
        if (v) utt.voice = v;
      }
      utt.rate = rate;

      utt.onend = () => {
        if (currentRef.current === utt) {
          currentRef.current = null;
          if (releaseRef.current) {
            releaseRef.current();
            releaseRef.current = null;
          }
          setState('idle');
        }
      };
      utt.onerror = () => {
        if (currentRef.current === utt) {
          currentRef.current = null;
          if (releaseRef.current) {
            releaseRef.current();
            releaseRef.current = null;
          }
          setState('idle');
        }
      };

      // Reserve la parole : si un autre agent parle, on le coupe.
      const release = claimSpeaker(agentId, () => {
        try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      });
      releaseRef.current = release;
      currentRef.current = utt;
      setState('speaking');

      try {
        window.speechSynthesis.speak(utt);
      } catch {
        release();
        releaseRef.current = null;
        currentRef.current = null;
        setState('idle');
      }
    },
    [enabled, privacy, agentId, voiceName, rate, stop],
  );

  // Cleanup au unmount.
  useEffect(() => {
    return () => {
      if (releaseRef.current) {
        releaseRef.current();
        releaseRef.current = null;
      }
      currentRef.current = null;
      if (hasSynthesis() && window.speechSynthesis.speaking) {
        try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      }
    };
  }, []);

  return { state, speak, stop };
}