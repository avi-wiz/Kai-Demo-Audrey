'use client';

import LayoutShell from '@/components/layout/LayoutShell';
import OnboardingFlow from '@/components/gtm/OnboardingFlow';
import GuidedTourOverlay from '@/components/gtm/GuidedTourOverlay';

export default function Page() {
  return (
    <>
      <LayoutShell />
      <OnboardingFlow />
      <GuidedTourOverlay />
    </>
  );
}
