import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '../globals.css';

export const metadata: Metadata = {
  title: 'BrainTrain Admin',
  description: 'BrainTrain admin dashboard.',
};

// Self-hosted — see app/[locale]/layout.tsx for why (Google Fonts fetch
// during compilation was intermittently crashing the dev/build worker).
const display = localFont({
  src: '../../fonts/baloo2/Baloo2-Variable.woff2',
  weight: '600 800',
  variable: '--font-display',
  display: 'swap',
});

const comfortaa = localFont({
  src: '../../fonts/comfortaa/Comfortaa-Variable.woff2',
  weight: '600 700',
  variable: '--font-comfortaa',
  display: 'swap',
});

const body = localFont({
  src: '../../fonts/space-grotesk/SpaceGrotesk-Variable.woff2',
  weight: '500 700',
  variable: '--font-body',
  display: 'swap',
});

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${comfortaa.variable}`}>
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
