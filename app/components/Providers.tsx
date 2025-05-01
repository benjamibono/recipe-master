"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/react-query";
import { LanguageProvider } from "../contexts/LanguageContext";
import { LanguageHandler } from "@/components/i18n/LanguageHandler";
import RootLayoutContent from "./RootLayoutContent";
import { AuthProvider } from "../contexts/AuthContext";
import { RealtimeSubscriptions } from "./RealtimeSubscriptions";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <LanguageHandler />
          <RootLayoutContent>{children}</RootLayoutContent>
          <RealtimeSubscriptions />
        </LanguageProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
