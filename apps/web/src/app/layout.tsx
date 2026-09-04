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
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
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

// Absolute base for canonical and OG URLs. Next treats a relative URL in any
// `metadata` field as a build error unless this is set.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kafei.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Kafei — Restaurant Billing & Floor Operations App",
  description:
    "Kafei runs your entire restaurant floor on one platform: QR ordering at the table, kitchen KDS screens, waiter tablets, and fast cashier POS billing.",
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
        <CookieConsentBanner />
      </body>
    </html>
  );
}
