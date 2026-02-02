import type { Metadata } from 'next';
import './globals.css';
import AppShell from '../components/AppShell';

export const metadata: Metadata = {
  title: 'Instagram',
  description: 'Instagram Clone',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('app-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');})();`,
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
