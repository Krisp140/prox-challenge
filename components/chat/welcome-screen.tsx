type WelcomeScreenProps = {
  onSelectQuestion: (question: string) => Promise<void>;
};

type StarterQuestion = {
  category: string;
  question: string;
};

const STARTER_QUESTIONS: StarterQuestion[] = [
  {
    category: "DUTY CYCLE",
    question: "What's the duty cycle for MIG welding at 200A on 240V?",
  },
  {
    category: "POLARITY SETUP",
    question: "What polarity setup do I need for TIG welding, and which socket gets the ground clamp?",
  },
  {
    category: "TROUBLESHOOTING",
    question: "I'm getting porosity in my flux-cored welds. What should I check first?",
  },
  {
    category: "CABLE ROUTING",
    question: "Show me the difference between the MIG and flux-cored cable routing on this machine.",
  },
  {
    category: "FIRST-TIME SETUP",
    question: "Walk me through the first-time stick setup on 120V.",
  },
];

export function WelcomeScreen({ onSelectQuestion }: WelcomeScreenProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">

        {/* ── Hero nameplate ── */}
        <div className="relative mb-6 overflow-hidden" style={{ borderRadius: '2px' }}>
          {/* Background: massive watermark type */}
          <div
            className="pointer-events-none absolute inset-0 flex items-end justify-end overflow-hidden select-none"
            aria-hidden
          >
            <span
              className="font-display leading-none"
              style={{
                fontSize: 'clamp(80px, 18vw, 180px)',
                fontWeight: 800,
                color: 'rgba(232, 132, 10, 0.04)',
                letterSpacing: '-0.04em',
                lineHeight: 0.85,
                marginRight: '-0.04em',
                marginBottom: '-0.05em',
              }}
            >
              220
            </span>
          </div>

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">

            {/* Left: headline + questions */}
            <div className="flex-1">
              {/* Nameplate header */}
              <div className="mb-1 flex items-center gap-2">
                <span className="led led-green" />
                <span
                  className="font-mono-display text-[10px] tracking-[0.22em] uppercase"
                  style={{ color: 'var(--accent)' }}
                >
                  VULCAN / OMNIPRO 220
                </span>
              </div>

              <h2
                className="font-display leading-none mb-1"
                style={{
                  fontSize: 'clamp(28px, 5vw, 48px)',
                  fontWeight: 800,
                  color: 'var(--text)',
                  letterSpacing: '-0.02em',
                }}
              >
                SUPPORT TERMINAL
              </h2>

              <p
                className="font-mono-display text-[11px] tracking-[0.12em] mb-5"
                style={{ color: 'var(--text-muted)' }}
              >
                MIG · FLUX-CORED · TIG · STICK
              </p>

              <p className="text-sm leading-7 mb-6 max-w-lg" style={{ color: 'var(--text-muted)' }}>
                Ask a dense welding-manual question. Get back grounded specs, polarity diagrams,
                duty-cycle calculators, and direct manual references — not guesswork.
              </p>

              {/* Question grid */}
              <div className="section-label mb-4">SELECT QUERY</div>

              <div className="stagger-children grid gap-2.5 sm:grid-cols-2">
                {STARTER_QUESTIONS.map((item) => (
                  <button
                    className="ctrl-btn bracket flex flex-col gap-1.5 px-4 py-3.5"
                    key={item.question}
                    onClick={() => void onSelectQuestion(item.question)}
                    type="button"
                    style={{ borderRadius: '2px' }}
                  >
                    <span
                      className="font-mono-display text-[9px] tracking-[0.2em] uppercase"
                      style={{ color: 'var(--accent)' }}
                    >
                      {item.category}
                    </span>
                    <span className="text-sm leading-5" style={{ color: 'var(--text)' }}>
                      {item.question}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: product images with technical overlay */}
            <div className="flex flex-col gap-3 w-full lg:w-[280px] shrink-0">
              <MachineCard
                src="/product.webp"
                alt="Vulcan OmniPro 220 welder"
                label="MACHINE OVERVIEW"
                spec="MIG / FLUX / TIG / STICK"
              />
              <MachineCard
                src="/product-inside.webp"
                alt="Vulcan OmniPro 220 inside panel"
                label="POLARITY PANEL"
                spec="SOCKET ASSIGNMENT"
              />
            </div>
          </div>
        </div>

        {/* Bottom spec strip */}
        <div
          className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4"
          style={{ borderColor: 'var(--border)' }}
        >
          {[
            ["INPUT", "120V / 240V"],
            ["MAX OUTPUT", "220A"],
            ["WIRE SPEEDS", "50-700 IPM"],
            ["WEIGHT", "~38 LB"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="font-mono-display text-[9px] tracking-[0.18em] uppercase" style={{ color: 'var(--text-muted)' }}>
                {label}
              </span>
              <span className="font-mono-display text-[10px] font-medium" style={{ color: 'var(--text)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function MachineCard({
  src,
  alt,
  label,
  spec,
}: {
  src: string;
  alt: string;
  label: string;
  spec: string;
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        border: '1px solid var(--border-muted)',
        background: 'var(--bg-card)',
        borderRadius: '2px',
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: '160px' }}>
        <img
          alt={alt}
          className="h-full w-full object-cover"
          src={src}
          style={{ opacity: 0.9, filter: 'saturate(0.85) contrast(1.05)' }}
        />
        {/* Bottom gradient fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-16"
          style={{ background: 'linear-gradient(to top, var(--bg-card), transparent)' }}
        />
      </div>

      {/* Labels */}
      <div className="px-3 pb-3 -mt-2 relative z-10">
        <p className="font-mono-display text-[9px] tracking-[0.18em] uppercase mb-0.5" style={{ color: 'var(--accent)' }}>
          {label}
        </p>
        <p className="font-mono-display text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {spec}
        </p>
      </div>
    </div>
  );
}
