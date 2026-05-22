import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Impact World Cup — Live Impact Scoreboard',
  description:
    'Houston cultural ecosystem initiative. Teams compete to generate community impact, tourism, storytelling, volunteerism, and opportunity.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                IMPACT <span className="text-amber-400">WORLD CUP</span>
              </span>
              <span className="hidden text-xs uppercase tracking-widest text-white/40 sm:inline">
                Live Scoreboard
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/submit"
                className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Log impact
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-white/40">
          <span>One City. One Movement. Limitless Impact.</span>
        </footer>
      </body>
    </html>
  );
}
