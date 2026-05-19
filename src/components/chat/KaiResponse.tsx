'use client';

import { forwardRef, type ReactNode } from 'react';
import type { TextOnlyActions as TextOnlyActionsType, ClosingText } from '@/lib/types';
import type { ParsedWidget, ConsentHandlers } from '@/components/engine/FrameParser';
import { CompositionEngine } from '@/components/engine/CompositionEngine';
import TextOnlyActions from './TextOnlyActions';
import ShareSnapshotButton from '@/components/gtm/ShareSnapshotButton';

interface KaiResponseProps {
  widgets: ParsedWidget[];
  consentHandlers?: ConsentHandlers;
  textOnlyActions?: TextOnlyActionsType | null;
  /** Closing text from the turn — included in the snapshot */
  closingText?: ClosingText;
  /** Optional toolbar buttons rendered alongside the share button (top-right). */
  extraToolbar?: ReactNode;
}

const KaiResponse = forwardRef<HTMLDivElement, KaiResponseProps>(function KaiResponse(
  { widgets, consentHandlers, textOnlyActions, closingText, extraToolbar },
  ref,
) {
  return (
    <div className="flex justify-start mb-4">
      <div
        ref={ref}
        className="max-w-[85%] w-full bg-gray-50 rounded-xl px-4 py-3 shadow-sm border border-gray-100 border-l-2 border-l-indigo-200"
        style={{ position: 'relative' }}
      >
        {/* Toolbar — top-right corner of the response frame. Excluded from PNG captures via data-snapshot-ignore. */}
        <div data-snapshot-ignore="true" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          {extraToolbar}
          <ShareSnapshotButton widgets={widgets} closingText={closingText} />
        </div>
        <CompositionEngine widgets={widgets} consentHandlers={consentHandlers} />
        {textOnlyActions && <TextOnlyActions actions={textOnlyActions} />}
      </div>
    </div>
  );
});

export default KaiResponse;
