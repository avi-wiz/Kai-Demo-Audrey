'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function AiModeToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAi = searchParams.get('ai') === 'true';
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref so the keydown handler always reads the current value
  const isAiRef = useRef(isAi);
  isAiRef.current = isAi;

  function showToast(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function toggle(next: boolean) {
    showToast(next ? '⚡ Switched to AI mode' : '🔒 Switched to Demo mode');
    router.push(next ? '/?ai=true' : '/');
  }

  // Cmd+Shift+D — registered here because this component lives in the layout
  // and is always mounted, unlike ChatShell which is inside a Suspense boundary.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        toggle(!isAiRef.current);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // toggle is defined in render scope — use a stable ref pattern to avoid re-registering
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          AI mode
        </span>
        <button
          onClick={() => toggle(!isAi)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--ai-accent-border)] focus:ring-offset-2 ${
            isAi ? 'bg-[var(--primary-80)]' : 'bg-[var(--surface2)]'
          }`}
          role="switch"
          aria-checked={isAi}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isAi ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-[var(--text)] text-[var(--surface)] text-sm rounded-lg shadow-lg pointer-events-none font-sans"
          style={{ animation: 'kai-entrance 200ms ease both', zIndex: 100 }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
