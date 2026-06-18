import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Smart Stock",
  description: "Accessible supply chain intelligence for small-scale restaurants.",
};

// Runs before first paint to set the theme class from the stored choice or OS
// preference, preventing a flash of the wrong theme.
const noFlashScript = `(function(){try{var c=localStorage.getItem('theme');var d=c?c==='dark':!window.matchMedia('(prefers-color-scheme: light)').matches;var e=document.documentElement;e.classList.toggle('dark',d);e.classList.toggle('light',!d);}catch(_){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
