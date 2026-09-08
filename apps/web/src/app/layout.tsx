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
import { JsonLd } from "@/components/seo/JsonLd";
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
  title: {
    default: "Kafei — Best Restaurant Billing Software, POS & QR Table Ordering System",
    template: "%s | Kafei Restaurant Billing Software",
  },
  description:
    "Kafei is India's leading restaurant billing software and cloud POS system. Fast QR table ordering, real-time Kitchen Display System (KDS), waiter handhelds, recipe-level inventory, UPI payments, and 80mm thermal receipt printing. Start free for 14 days.",
  keywords: [
    "restaurant billing software",
    "restaurant pos system",
    "best restaurant billing app",
    "restaurant point of sale software",
    "cloud pos for restaurants",
    "qr code ordering system for restaurants",
    "table qr ordering",
    "kitchen display system",
    "kds software",
    "waiter ordering app",
    "restaurant inventory management software",
    "80mm thermal receipt billing software",
    "pos billing software india",
    "cafe billing software",
    "bar pos system",
    "multi branch restaurant pos",
    "restaurant table management software",
    "fast restaurant billing software",
    "upi restaurant billing",
    "restaurant kot software",
    "food business pos",
    "kafei pos",
    "kafei restaurant software",
    "kafei billing",
    "restaurant management app",
    "dine in pos software",
  ],
  authors: [{ name: "Kafei Technologies", url: "https://kafei.in" }],
  creator: "Kafei Technologies",
  publisher: "Kafei Technologies",
  applicationName: "Kafei",
  category: "Business & Restaurant Technology",
  classification: "Restaurant Point of Sale & Billing Software",
  alternates: {
    canonical: "https://kafei.in",
    languages: {
      "en-IN": "https://kafei.in",
      "en-US": "https://kafei.in",
      "x-default": "https://kafei.in",
    },
  },
  openGraph: {
    title: "Kafei — Best Restaurant Billing Software, POS & QR Table Ordering System",
    description:
      "Run your entire restaurant floor on one platform: QR ordering at the table, kitchen KDS screens, waiter tablets, recipe inventory, and fast cashier POS billing.",
    url: "https://kafei.in",
    siteName: "Kafei",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Kafei Restaurant Billing Software & POS Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kafei — Modern Restaurant Billing Software & Cloud POS",
    description:
      "Run your entire restaurant floor on one platform: QR ordering, KDS, waiter tablets, recipe inventory, and fast cashier POS billing.",
    images: ["/logo.png"],
    creator: "@kafeiapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
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
        <JsonLd />
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
