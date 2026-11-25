import type { Metadata } from "next";
import { Fira_Code, IBM_Plex_Sans_Thai } from "next/font/google";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "rxusage",
  description: "Usage dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      data-theme="dark"
      suppressHydrationWarning
      className={`${plexThai.variable} ${firaCode.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full font-sans">
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
