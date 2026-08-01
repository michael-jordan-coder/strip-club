import type { Metadata } from "next";
import { Fragment_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Space_Grotesk({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

const mono = Fragment_Mono({
  variable: "--font-app-mono",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Encoder",
  description: "Local, quality-first MP4 encoding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-950 font-sans text-zinc-300">
        {children}
      </body>
    </html>
  );
}
