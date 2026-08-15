import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#070A0E] px-4 overflow-hidden text-[#F5F7FA] font-sans">
      
      {/* Background Mesh Gradient Spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#2AFEB7]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#A855F7]/10 blur-[120px] pointer-events-none" />

      {/* Floating particles/bubbles */}
      <div className="absolute top-1/4 left-1/5 w-2 h-2 rounded-full bg-[#2AFEB7]/30 blur-[1px] animate-float pointer-events-none" style={{ animationDelay: '1s', animationDuration: '6s' }} />
      <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-[#A855F7]/30 blur-[2px] animate-float pointer-events-none" style={{ animationDelay: '3s', animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-[#F5F7FA]/20 blur-[0.5px] animate-float pointer-events-none" style={{ animationDelay: '0s', animationDuration: '5s' }} />

      {/* Top Header staff link */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center max-w-7xl mx-auto w-full z-20">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Atlas Logo"
            className="h-10 w-auto object-contain"
          />
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-[#26313C] bg-[#111820]/45 backdrop-blur px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase text-[#9AA6B2] hover:text-[#2AFEB7] hover:border-[#2AFEB7]/40 transition-all duration-300"
        >
          Access Portal
        </Link>
      </header>

      {/* Hero Teaser Section */}
      <div className="w-full max-w-2xl text-center space-y-10 z-10 py-16 flex flex-col items-center">
        
        {/* Animated 3D Glassmorphic Orb Container */}
        <div className="relative w-44 h-44 flex items-center justify-center animate-float">
          {/* Outer glowing rings */}
          <div className="absolute inset-0 rounded-full border border-[#2AFEB7]/30 scale-105 animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute inset-2 rounded-full border border-[#A855F7]/25 scale-100" />
          
          {/* Glass sphere shell */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#111820]/80 to-[#18212B]/40 border border-[#F5F7FA]/10 backdrop-blur shadow-[inset_0_4px_16px_rgba(255,255,255,0.06),0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
            {/* Gloss reflection overlay */}
            <div className="absolute top-[-30%] left-[-20%] w-[120%] h-[60%] bg-white/5 rotate-[-25deg] rounded-full pointer-events-none" />
            
            {/* Pulsing inner 3D energy core */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#2AFEB7] via-[#22E5A4] to-[#A855F7] blur-[15px] opacity-80 animate-pulse" style={{ animationDuration: '2s' }} />
            
            {/* Glowing floating focal node */}
            <div className="absolute w-5 h-5 rounded-full bg-white shadow-[0_0_20px_#2AFEB7] border border-[#2AFEB7] animate-glow" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2AFEB7]/20 bg-[#2AFEB7]/5 px-3 py-1 text-[10px] uppercase tracking-widest text-[#2AFEB7] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2AFEB7] animate-ping" />
            System Launch Phase
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#F5F7FA] to-[#9AA6B2]">
            Something Big <br />
            <span className="bg-clip-text bg-gradient-to-r from-[#2AFEB7] via-[#22E5A4] to-[#A855F7]">Is Coming</span>
          </h1>

          <p className="mx-auto max-w-md text-sm text-[#9AA6B2] leading-relaxed pt-2">
            The next generation of intelligent, multi-tenant operations is landing. Engineered for ultimate speed, real-time state synchronization, and frictionless control.
          </p>
        </div>

        {/* Action button */}
        <div className="flex flex-col items-center gap-3.5 pt-4">
          <Link
            href="/login"
            className="group relative rounded-full bg-[#2AFEB7] px-8 py-3.5 text-xs font-black tracking-wider uppercase text-[#0B0F14] shadow-[0_0_30px_rgba(42,254,183,0.3)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(42,254,183,0.55)] hover:scale-105 active:scale-95"
          >
            Enter Gateway
            <span className="absolute inset-0 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </Link>
          
          <Link 
            href="/signup" 
            className="text-[11px] font-bold tracking-wider text-[#9AA6B2] hover:text-[#2AFEB7] uppercase transition-colors"
          >
            Request Access
          </Link>
        </div>
      </div>

      {/* Styled Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes glow {
          0%, 100% { transform: scale(1); box-shadow: 0 0 16px rgba(42,254,183,0.5); }
          50% { transform: scale(1.1); box-shadow: 0 0 28px rgba(168,85,247,0.7); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
      `}} />
    </main>
  );
}
