import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from "@/components/theme-provider";
import Notifications from '@/components/Common/Notifications';
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
        <Component {...pageProps} />
        <Notifications />
      </QueryClientProvider>
    </ThemeProvider>
  );
}