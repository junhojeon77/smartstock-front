import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Stock",
  description: "Accessible supply chain intelligence for small-scale restaurants.",
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
