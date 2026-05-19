'use client';

import { useEffect, useState } from 'react';
import type { UseVoiceResult } from '@/hooks/useVoice';

interface VoiceButtonProps {
  voice: UseVoiceResult;
  onSend: (text: string) => void;
  onTranscriptChange: (text: string) => void;
  disabled?: boolean;
  autoSend?: boolean;
}

export default function VoiceButton({ voice, onSend, onTranscriptChange, disabled = false, autoSend = true }: VoiceButtonProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Mirror interim transcript into the input field while listening
  useEffect(() => {
    if (voice.isListening) {
      onTranscriptChange(voice.transcript);
    }
  }, [voice.isListening, voice.transcript, onTranscriptChange]);

  if (!mounted || !voice.isSupported) return null;

  const handleClick = () => {
    if (disabled) return;
    if (voice.isListening) {
      voice.stopListening();
      // onend in useVoice calls onResult — which triggers onSend via the startListening callback
    } else {
      voice.startListening((finalText) => {
        if (autoSend) {
          onTranscriptChange('');
          onSend(finalText);
        } else {
          onTranscriptChange(finalText);
        }
      });
    }
  };

  return (
    <>
      {voice.isListening && (
        <style>{`
          @keyframes voice-pulse-ring {
            0%   { transform: scale(1);   opacity: 0.6; }
            100% { transform: scale(2);   opacity: 0; }
          }
          @keyframes voice-mic-scale-pulse {
            0%, 100% { transform: scale(1); }
            50%       { transform: scale(1.05); }
          }
        `}</style>
      )}

      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* Pulse rings — staggered outward expansion */}
        {voice.isListening && (
          <>
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid rgba(215,76,16,0.3)',
                animation: 'voice-pulse-ring 1.2s ease-out infinite',
                pointerEvents: 'none',
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid rgba(215,76,16,0.3)',
                animation: 'voice-pulse-ring 1.2s ease-out infinite',
                animationDelay: '400ms',
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        <button
          onClick={handleClick}
          disabled={disabled && !voice.isListening}
          title={voice.isListening ? 'Stop listening' : 'Speak to Kai'}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: `1.5px solid ${voice.isListening ? 'var(--error-80)' : 'var(--border)'}`,
            background: voice.isListening ? 'rgba(215,76,16,0.1)' : 'var(--surface2)',
            cursor: disabled && !voice.isListening ? 'not-allowed' : 'pointer',
            opacity: disabled && !voice.isListening ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 200ms ease, border-color 200ms ease',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={voice.isListening ? 'var(--error-80)' : 'var(--text3)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              animation: voice.isListening ? 'voice-mic-scale-pulse 1s ease-in-out infinite' : 'none'
            }}
          >
            <rect x="9" y="2" width="6" height="13" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="20" x2="12" y2="24" />
            <line x1="8" y1="24" x2="16" y2="24" />
          </svg>
        </button>
      </div>
    </>
  );
}
