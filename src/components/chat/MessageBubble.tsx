'use client';

import { Message } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${isUser ? 'message-slide-in-right' : 'message-slide-in-left'}`}>
      <div
        className={`max-w-[80%] px-4 py-3 ${
          isUser
            ? 'bg-[var(--primary-80)] text-white rounded-[12px_12px_2px_12px] shadow-sm'
            : 'bg-transparent text-[var(--text2)]'
        }`}
      >
        <p className="text-[13.5px] font-normal leading-relaxed whitespace-pre-wrap font-sans">
          {message.content}
        </p>
      </div>
    </div>
  );
}
