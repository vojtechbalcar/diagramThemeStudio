import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ModeScript } from "@/components/system/mode-script";
import { AccountProvider } from "@/components/accounts/account-provider";
import { clerkConfigured } from "@/lib/server/accounts";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Linework", template: "%s — Linework" },
  description: "Turn your brand's design tokens into a Mermaid diagram theme.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <ModeScript />
      </head>
      <body><AccountProvider clerkEnabled={clerkConfigured()}>{children}</AccountProvider></body>
    </html>
  );
}
