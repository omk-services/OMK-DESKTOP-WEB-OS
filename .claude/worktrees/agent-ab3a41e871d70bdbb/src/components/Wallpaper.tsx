/** Wallpaper — PostHog-inspired paper-garden backdrop (original CSS/SVG evocation, not their art) */
export function Wallpaper() {
  return (
    <div className="fixed inset-0 z-[-10] overflow-hidden" style={{ background: 'linear-gradient(180deg, #eef1e6 0%, #e4ecd7 45%, #d7e6c3 100%)' }}>
      {/* soft sun glow */}
      <div
        className="absolute -top-40 right-[8%] w-[520px] h-[520px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,225,150,0.55), transparent 62%)' }}
      />
      {/* paper grain */}
      <div
        className="absolute inset-0 opacity-[0.5] mix-blend-multiply"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(120,113,108,0.035) 0 1px, transparent 1px 3px),' +
            'repeating-linear-gradient(0deg, rgba(120,113,108,0.03) 0 1px, transparent 1px 3px)',
        }}
      />
      {/* rolling paper hills */}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 380" preserveAspectRatio="none" style={{ height: '46vh' }}>
        <path d="M0,220 C260,150 480,250 720,210 C980,168 1180,250 1440,190 L1440,380 L0,380 Z" fill="#c7dca6" />
        <path d="M0,280 C300,220 560,300 860,268 C1120,240 1300,300 1440,262 L1440,380 L0,380 Z" fill="#b3ce8c" opacity="0.9" />
        <path d="M0,330 C340,296 620,346 960,322 C1200,306 1320,340 1440,320 L1440,380 L0,380 Z" fill="#9fc074" opacity="0.85" />
      </svg>
      {/* a few paper "crops" rows */}
      <svg className="absolute bottom-[8%] left-[6%] opacity-60" width="220" height="90" viewBox="0 0 220 90">
        {[0, 1, 2, 3, 4].map(r => (
          <g key={r} transform={`translate(${r * 42}, ${r * 4})`}>
            <rect x="0" y="30" width="30" height="48" rx="4" fill="#8a5a2b" opacity="0.35" />
            <path d="M15,30 C6,14 24,10 15,-2 C24,10 34,16 15,30" fill="#6fae52" />
          </g>
        ))}
      </svg>
    </div>
  );
}
