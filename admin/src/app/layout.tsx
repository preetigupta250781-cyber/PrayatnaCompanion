import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'Prayatna 2026 // Organizer Command Center',
  description:
    'Administrative portal for Prayatna Hackathon operations, scoring, logistics, and participants.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen antialiased selection:bg-accent/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
