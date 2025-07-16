import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from "@/components/theme-provider";
import { Notifications } from '@/components/ui/notifications';
import { NotificationsProvider } from '@/components/providers/NotificationsProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SessionProvider } from "next-auth/react";
import '@/styles/globals.css';

const queryClient = new QueryClient();

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Le middleware gère maintenant la redirection, donc plus de logique ici.
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
              <SidebarProvider
                style={{ "--sidebar-width": "18rem" } as React.CSSProperties}
              >
                <AppSidebar variant="sidebar" collapsible="icon" />
                <SidebarInset>
                  <Component {...pageProps} />
                </SidebarInset>
              </SidebarProvider>
              <Notifications />
            </NotificationsProvider>
          </SocketProvider>
        </QueryClientProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </SessionProvider>
    </ThemeProvider>
  );
}