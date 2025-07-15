import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from "@/components/theme-provider";
import { Notifications } from '@/components/ui/notifications';
import { NotificationsProvider } from '@/components/providers/NotificationsProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import '@/styles/globals.css';

const queryClient = new QueryClient();

const publicPages = ['/login'];

function Auth({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const isPublicPage = publicPages.includes(router.pathname);

  useEffect(() => {
    if (status === 'unauthenticated' && !isPublicPage) {
      router.push('/login');
    }
  }, [status, isPublicPage, router]);

  if (status === 'loading') {
    return <div>Chargement...</div>;
  }

  return <>{children}</>;
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const isPublicPage = publicPages.includes(router.pathname);

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
              {isPublicPage ? (
                <Component {...pageProps} />
              ) : (
                <Auth>
                  <SidebarProvider
                    style={{ "--sidebar-width": "18rem" } as React.CSSProperties}
                  >
                    <AppSidebar variant="sidebar" collapsible="icon" />
                    <SidebarInset>
                      <Component {...pageProps} />
                    </SidebarInset>
                  </SidebarProvider>
                </Auth>
              )}
              <Notifications />
            </NotificationsProvider>
          </SocketProvider>
        </QueryClientProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </SessionProvider>
    </ThemeProvider>
  );
}