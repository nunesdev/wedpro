import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastRoot } from '@/components/ToastRoot';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'wedi.casa PRO',
  description: 'Gestão operacional de eventos em tempo real',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme') || localStorage.getItem('wedi_theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen transition-colors duration-200`}>
        <ThemeProvider>
          <ToastRoot>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6">{children}</main>
            </div>
          </ToastRoot>
        </ThemeProvider>
      </body>
    </html>
  );
}
