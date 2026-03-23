import type { Metadata } from "next";
// We're using Geist fonts for a clean, modern look. 
// It comes nicely packaged from next/font/google.
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

// Configure our main sans-serif font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Configure the monospace font for code snippets and technical text
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Global SEO and metadata setup 
export const metadata: Metadata = {
  title: "Self-Correcting Reasoning in LLMs",
  description: "A research project showcasing self-correcting reasoning in large language models without external supervision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Wrap the entire app in the AuthProvider so user context is available everywhere
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
