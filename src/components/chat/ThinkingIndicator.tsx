'use client';

import { useState, useEffect } from 'react';

const MESSAGES = [
  "Pulling up Magnolia's story...",
  "Checking the CRM...",
  "Cross-referencing data...",
  "Almost there...",
  "Analyzing latest reports...",
  "Connecting the dots...",
];

interface ThinkingIndicatorProps {
  overrideMessage?: string;
}

export default function ThinkingIndicator({ overrideMessage }: ThinkingIndicatorProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (overrideMessage) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, [overrideMessage]);

  return (
    <div className="flex justify-start mb-4 message-slide-in-left">
      <div className="bg-transparent px-4 py-3 min-w-[200px]">
        <p className="text-[12px] text-[var(--text3)] mb-2 font-normal italic transition-all duration-300 font-sans">
          {overrideMessage ?? MESSAGES[index]}
        </p>
        <div className="flex gap-1.5 pt-0.5">
          <div className="w-2 h-2 bg-[var(--ai-accent)] rounded-full animate-bounce [animation-delay:0ms]"></div>
          <div className="w-2 h-2 bg-[var(--ai-accent)] rounded-full animate-bounce [animation-delay:150ms]"></div>
          <div className="w-2 h-2 bg-[var(--ai-accent)] rounded-full animate-bounce [animation-delay:300ms]"></div>
        </div>
      </div>
    </div>
  );
}
