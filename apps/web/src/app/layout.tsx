import type { Metadata } from "next";
import { Geist, Geist_Mono, Funnel_Display } from "next/font/google";
import { AuthProvider } from "@/hooks/use-auth";
import { TenantProvider } from "@/hooks/use-tenant";
import { RestaurantProvider } from "@/hooks/use-restaurant";
import { BranchProvider } from "@/hooks/use-branch";
import { QueryProvider } from "@/lib/query-client";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider, themeInitScript } from "@/hooks/use-theme";
import { LiquidGlassDefs } from "@/components/ui/liquid-glass-defs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for the marketing pages only. App UI stays on Geist.
// Variable font, so no `weight` — the whole axis ships in one file.
const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Atlas — floor software for dine-in restaurants",
  description:
    "One system for the whole floor: QR ordering at the table, a screen for the kitchen, tablets for waiters, and split billing at the counter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `dark` is no longer hardcoded here — the pre-paint script below sets it
    // from storage. suppressHydrationWarning because that script mutates the
    // class before React hydrates, which is the point.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${funnelDisplay.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-background">
        {/* Filter library for .liquid-glass. Must exist in the document for
            `backdrop-filter: url(#atlas-lens)` to resolve. */}
        <LiquidGlassDefs />
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              <AuthProvider>
                <TenantProvider>
                  <RestaurantProvider>
                    <BranchProvider>{children}</BranchProvider>
                  </RestaurantProvider>
                </TenantProvider>
              </AuthProvider>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
