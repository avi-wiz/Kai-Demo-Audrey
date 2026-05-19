import type { Metadata } from "next";
import "./token.css";
import "./globals.css";
import { LayoutProvider } from '@/contexts/LayoutContext';
import { PersonaProvider } from '@/contexts/PersonaContext';
import { ResponseModeProvider } from '@/contexts/ResponseModeContext';
import { ConversationProvider } from '@/contexts/ConversationContext';
import { ArtifactProvider } from '@/contexts/ArtifactContext';
import { DashboardBuilderProvider } from '@/contexts/DashboardBuilderContext';
import { AgentStoreProvider } from '@/contexts/AgentStoreContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SharedStoreProvider } from '@/contexts/shared/SharedStoreProvider';
import { PageContextProvider } from '@/contexts/PageContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { GuidedTourProvider } from '@/contexts/GuidedTourContext';
import { NudgeProvider } from '@/contexts/NudgeContext';
import { ChatHistoryProvider } from '@/contexts/ChatHistoryContext';
import { ChatSessionProvider } from '@/contexts/ChatSessionContext';
import ToastStack from '@/components/ui/ToastStack';

export const metadata: Metadata = {
  title: "Kai Assistant",
  description: "AI-powered business assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,600,700,800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex">
        <UserPreferencesProvider>
          <OnboardingProvider>
            <GuidedTourProvider>
              <NudgeProvider>
                <LayoutProvider>
                  <PersonaProvider>
                    <ResponseModeProvider>
                      <ConversationProvider>
                        <ChatHistoryProvider>
                          <ChatSessionProvider>
                            <SharedStoreProvider>
                              <PageContextProvider>
                                <ArtifactProvider>
                                  <DashboardBuilderProvider>
                                    <AgentStoreProvider>
                                      <ToastProvider>
                                        {children}
                                        <ToastStack />
                                      </ToastProvider>
                                    </AgentStoreProvider>
                                  </DashboardBuilderProvider>
                                </ArtifactProvider>
                              </PageContextProvider>
                            </SharedStoreProvider>
                          </ChatSessionProvider>
                        </ChatHistoryProvider>
                      </ConversationProvider>
                    </ResponseModeProvider>
                  </PersonaProvider>
                </LayoutProvider>
              </NudgeProvider>
            </GuidedTourProvider>
          </OnboardingProvider>
        </UserPreferencesProvider>
      </body>
    </html>
  );
}
