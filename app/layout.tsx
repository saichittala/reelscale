import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelScale",
  description: "High-retention reels that grow your brand and bring you clients.",
  icons: {
    icon: [
      { url: "/assets/favicon.ico", sizes: "any" },
      { url: "/assets/favicon.png", type: "image/png" }
    ],
    apple: "/assets/apple-touch-icon.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body>{children}</body>
    </html>
  );
}