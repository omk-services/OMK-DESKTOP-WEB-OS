/**
 * voice-types.d.ts — declarations globales pour la Web Speech API.
 *
 * Le DOM lib standard ne declare pas `SpeechRecognition` ni
 * `webkitSpeechRecognition` — seulement les evenements associes. Plutot
 * que de redéclarer ces types dans `src/agent/voice.ts` et de les
 * atteindre via un double cast `window as unknown as {...}`, on pose
 * les types ici, dans un .d.ts adjacent au handle `__coachos`. Le
 * consumer (agent/voice.ts) n'a plus qu'un seul chemin pour lire
 * `window.SpeechRecognition`.
 *
 * Les types sont alignes sur ce qu'attend `agent/voice.ts` — qui les
 * re-exporte depuis ce fichier.
 */

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

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
