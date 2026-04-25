import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMM Audit Platform",
  description: "Instagram performance audits powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
