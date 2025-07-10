import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/components/theme-provider";
import Notifications from '@/components/Common/Notifications';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import '@/styles/globals.css';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <SidebarProvider
          style={{ "--sidebar-width": "18rem" } as React.CSSProperties}
        >
          <AppSidebar variant="sidebar" collapsible="icon" />
          <SidebarInset>
            <Component {...pageProps} />
          </SidebarInset>
        </SidebarProvider>
        <Notifications />
      </QueryClientProvider>
    </ThemeProvider>
  );
}