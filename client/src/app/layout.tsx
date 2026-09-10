import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Providers } from "./providers";
import HelpWidget from "@/components/ai/HelpWidget";

export const metadata: Metadata = {
  title: "EventOS",
  description: "EventOS — authentication and account dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body>
        <Providers>{children}</Providers>
        <HelpWidget />
      </body>
    </html>
  );
}
