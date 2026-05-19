'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ── Module-level audio unlock (singleton across all useVoice instances) ────────
// A single Audio element primed inside a user gesture unlocks HTMLAudioElement
// autoplay for the entire page session in both Chromium and Safari.
// Stored at module scope so unlockAudio() and speak() share the same reference
// regardless of how many useVoice() hook instances exist.

let _primedAudio: HTMLAudioElement | null = null;

export function unlockAudio() {
  if (_primedAudio || typeof window === 'undefined') return;
  const silentWav = new Uint8Array([
    0x52,0x49,0x46,0x46,0x24,0x00,0x00,0x00,0x57,0x41,0x56,0x45,
    0x66,0x6d,0x74,0x20,0x10,0x00,0x00,0x00,0x01,0x00,0x01,0x00,
    0x44,0xac,0x00,0x00,0x88,0x58,0x01,0x00,0x02,0x00,0x10,0x00,
    0x64,0x61,0x74,0x61,0x00,0x00,0x00,0x00,
  ]);
  const blob = new Blob([silentWav], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const el = new Audio(url);
  el.volume = 0;
  el.play().catch(() => {}).finally(() => URL.revokeObjectURL(url));
  _primedAudio = el;
}

const SILENCE_TIMEOUT_MS = 2000;

declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    onerror: (event: any) => void;
    start(): void;
    stop(): void;
    abort(): void;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

function getSpeechRecognition(): { new (): SpeechRecognition } | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

export interface UseVoiceResult {
  startListening: (onResult: (text: string) => void) => void;
  stopListening: () => void;
  isListening: boolean;
  transcript: string;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useVoice(): UseVoiceResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onResultRef = useRef<((text: string) => void) | null>(null);
  const finalTranscriptRef = useRef('');

  const SpeechRecognitionClass = getSpeechRecognition();
  const isSupported = SpeechRecognitionClass !== null && typeof window !== 'undefined' && 'speechSynthesis' in window;

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const commitAndStop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.stop();
  }, []);

  const startListening = useCallback((onResult: (text: string) => void) => {
    if (!SpeechRecognitionClass) return;

    onResultRef.current = onResult;
    finalTranscriptRef.current = '';
    setTranscript('');

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        finalTranscriptRef.current += final;
      }
      const current = finalTranscriptRef.current + interim;
      setTranscript(current);

      // Reset silence timer on any speech activity
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        commitAndStop();
      }, SILENCE_TIMEOUT_MS);
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsListening(false);
      const text = finalTranscriptRef.current.trim();
      if (text && onResultRef.current) {
        onResultRef.current(text);
      }
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      clearSilenceTimer();
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [SpeechRecognitionClass, clearSilenceTimer, commitAndStop]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
  }, [clearSilenceTimer]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      // Only clear src if this is NOT the module-level primed element —
      // resetting src on the primed element would invalidate the unlock.
      if (audioRef.current !== _primedAudio) {
        audioRef.current.src = '';
      }
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakViaBrowserTTS = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) { setIsSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;

    stopSpeaking();
    setIsSpeaking(true);

    // No primed element — unlockAudio() was never called from a user gesture.
    // Fall back to browser TTS to avoid NotAllowedError.
    if (!_primedAudio) {
      speakViaBrowserTTS(text);
      return;
    }

    fetch('/api/kai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`TTS route ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        // Reuse the module-level primed element — the same instance whose
        // .play() was called in the user gesture, so the browser permits
        // subsequent .play() calls on it without a new gesture.
        const audio = _primedAudio!;
        audio.volume = 1;
        audio.src = url;
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          setIsSpeaking(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          speakViaBrowserTTS(text);
        };
        audio.play().catch(() => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          speakViaBrowserTTS(text);
        });
      })
      .catch(() => {
        speakViaBrowserTTS(text);
      });
  }, [stopSpeaking, speakViaBrowserTTS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, [clearSilenceTimer, stopSpeaking]);

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    speak,
    stopSpeaking,
    isSpeaking,
    isSupported,
  };
}
