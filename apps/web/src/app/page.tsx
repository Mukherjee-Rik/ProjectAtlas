import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] px-4 py-16">
      <div className="w-full max-w-2xl text-center">
        {/* Branding & Status Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#26313C] bg-[#111820] px-4 py-1.5 text-xs text-[#9AA6B2]">
          <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span>System Status: <strong className="text-[#F5F7FA]">Operational</strong></span>
        </div>

        <div className="mb-4 inline-flex items-center justify-center gap-3">
          <div className="h-4 w-4 rounded-full bg-[#2AFEB7] shadow-[0_0_16px_#2AFEB7]" />
          <h1 className="text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            Atlas
          </h1>
        </div>

        <p className="mx-auto max-w-lg text-lg text-[#9AA6B2]">
          Enterprise AI Operating System powering modern restaurant chains, POS, KDS, inventory, and automated delivery aggregation.
        </p>

        {/* Navigation Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-[#2AFEB7] px-6 py-3 font-semibold text-[#0B0F14] transition-all hover:bg-[#22E5A4] active:scale-[0.99]"
          >
            Go to Login
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg border border-[#26313C] bg-[#111820] px-6 py-3 font-medium text-[#F5F7FA] transition-all hover:bg-[#18212B] active:scale-[0.99]"
          >
            Open Dashboard
          </Link>
        </div>

        {/* Architecture Info */}
        <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#2AFEB7]">
              App Shell Architecture
            </h3>
            <p className="mt-2 text-sm text-[#9AA6B2]">
              Persistent application shell with sidebar navigation, active state detection, and route guards.
            </p>
          </div>

          <div className="rounded-xl border border-[#26313C] bg-[#111820] p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#2AFEB7]">
              Backend Integration
            </h3>
            <p className="mt-2 text-sm text-[#9AA6B2]">
              NestJS REST API guarded with `JwtAuthGuard` and Prisma PostgreSQL database.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
