import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "WL Graph Isomorphism Dashboard",
  description:
    "Interactive dashboard for visualizing the 1-WL graph isomorphism refinement process.",
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} min-h-screen bg-slate-950 font-sans text-slate-100`}>
        {children}
      </body>
    </html>
  );
}
