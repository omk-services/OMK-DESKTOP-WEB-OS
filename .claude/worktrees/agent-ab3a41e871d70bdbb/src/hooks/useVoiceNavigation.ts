/** useVoiceNavigation — Web Speech API control for the Coach OS window manager.
 *  Recognizes app open/close/minimize commands plus section + item drill-down
 *  ("ouvre Clients sur Ava Chen"), driving the exact same shellStore /
 *  voiceIntent bridge a mouse click already drives. FR-first grammar lives in
 *  voiceCommands.ts. Chrome/Edge only (webkitSpeechRecognition) — `supported`
 *  tells the caller whether to render the mic control at all. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useShellStore } from '../stores/shell.store';
import { getAllApps } from '../lib/app-registry';
import { useVoiceIntentStore } from '../lib/voiceIntent';
import { parseVoiceCommand } from '../lib/voiceCommands';

interface MinimalSpeechRecognitionResult {
  0: { transcript: string };
  length: number;
}
interface MinimalSpeechRecognitionEvent extends Event {
  results: ArrayLike<MinimalSpeechRecognitionResult>;
}
interface MinimalSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: MinimalSpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => MinimalSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceNavigation() {
  const [listening, setListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const listeningRef = useRef(false);

  const openApp = useShellStore(s => s.openApp);
  const closeApp = useShellStore(s => s.closeApp);
  const minimizeApp = useShellStore(s => s.minimizeApp);
  const addToast = useShellStore(s => s.addToast);
  const setIntent = useVoiceIntentStore(s => s.setIntent);

  const supported = typeof window !== 'undefined' && getSpeechRecognitionCtor() !== null;

  const runCommand = useCallback((transcript: string) => {
    const command = parseVoiceCommand(transcript);
    if (!command) {
      addToast({ message: `Commande vocale non reconnue : "${transcript}"`, source: 'Voice', type: 'warning' });
      return;
    }

    if (command.type === 'showDesktop' || command.type === 'minimizeAll') {
      useShellStore.getState().windows
        .filter(w => w.isOpen && !w.isMinimized)
        .forEach(w => minimizeApp(w.id));
      addToast({ message: 'Bureau affiché', source: 'Voice', type: 'info' });
      return;
    }

    const app = getAllApps().find(a => a.id === command.appId);
    const label = app?.name ?? command.appId;

    if (command.type === 'close') {
      closeApp(command.appId);
      addToast({ message: `${label} fermé`, source: 'Voice', type: 'info' });
      return;
    }
    if (command.type === 'minimize') {
      minimizeApp(command.appId);
      addToast({ message: `${label} réduit`, source: 'Voice', type: 'info' });
      return;
    }

    openApp(command.appId, label);
    if (command.section || command.itemId) {
      setIntent(command.appId, { section: command.section, itemId: command.itemId });
    }
    addToast({
      message: command.itemId
        ? `${label} → ${command.section} → ouvert`
        : command.section
          ? `${label} → ${command.section}`
          : `${label} ouvert`,
      source: 'Voice',
      type: 'success',
    });
  }, [addToast, closeApp, minimizeApp, openApp, setIntent]);

  // Keep a ref to the latest closure so the SpeechRecognition instance (created
  // once, below) never calls a stale runCommand referencing stale store slices.
  const runCommandRef = useRef(runCommand);
  runCommandRef.current = runCommand;

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result?.[0]?.transcript ?? '';
      if (!transcript) return;
      setLastTranscript(transcript);
      runCommandRef.current(transcript);
    };

    recognition.onerror = () => {
      // no-speech / aborted — onend below restarts while listeningRef is true.
    };

    recognition.onend = () => {
      if (listeningRef.current) {
        try { recognition.start(); } catch { /* already starting */ }
      }
    };

    recognitionRef.current = recognition;
    return () => {
      listeningRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, []);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listeningRef.current) {
      listeningRef.current = false;
      setListening(false);
      recognition.stop();
    } else {
      listeningRef.current = true;
      setListening(true);
      try { recognition.start(); } catch { /* already started */ }
    }
  }, []);

  return { listening, toggle, lastTranscript, supported };
}
