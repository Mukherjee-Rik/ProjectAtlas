import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/hooks/use-auth";
import { TenantProvider } from "@/hooks/use-tenant";
import { RestaurantProvider } from "@/hooks/use-restaurant";
import { BranchProvider } from "@/hooks/use-branch";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Atlas | Enterprise AI OS for Restaurants",
  description: "Enterprise-grade multi-tenant AI Operating System powering modern restaurant chains, POS, KDS, inventory, and automated delivery aggregation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0B0F14] text-[#F5F7FA] font-sans selection:bg-[#2AFEB7] selection:text-[#0B0F14]">
        <AuthProvider>
          <TenantProvider>
            <RestaurantProvider>
              <BranchProvider>{children}</BranchProvider>
            </RestaurantProvider>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
