import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NotificationsProvider } from '@/components/providers/NotificationsProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";
import { FloatingTokenDisplay } from '@/components/common/FloatingTokenDisplay';
import { FloatingHelpButton } from '@/components/common/FloatingHelpButton';
import { useRouter } from 'next/router';
import { SessionManager } from '@/components/providers/SessionManager';
import '@/styles/globals.css';

const queryClient = new QueryClient();

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(router.pathname);

  const AppLayout = ({ children }: { children: React.ReactNode }) => (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <AppSidebar variant="sidebar" collapsible="icon" />
      <SidebarInset>
        {children}
        <div className="fixed bottom-6 right-6 z-50 flex flex-row items-center gap-4">
          <FloatingTokenDisplay />
          <FloatingHelpButton />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <NotificationsProvider>
              <SessionManager />
              {isAuthPage ? (
                <Component {...pageProps} />
              ) : (
                <AppLayout>
                  <Component {...pageProps} />
                </AppLayout>
              )}
              <Toaster />
            </NotificationsProvider>
          </SocketProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}