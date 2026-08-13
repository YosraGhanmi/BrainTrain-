import type { Metadata } from 'next';
import { Poppins, Baloo_2, Space_Grotesk } from 'next/font/google';
import SmoothScroll from '@/components/providers/SmoothScroll';
import './globals.css';

const display = Baloo_2({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Space_Grotesk({
  subsets: ['latin'],
  weight: [ '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BrainTrain — Don\'t Just Prepare For The Future. Build It.',
  description: 'BrainTrain is a Tunisian academy where curious kids become creators — robotics, AI, 3D design and entrepreneurship, built through real projects and international competitions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-bg text-ink antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
