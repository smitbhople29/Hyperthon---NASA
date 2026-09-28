import "./App.css";

/* Decorative starfield (deterministic, no data) */
const stars = (() => {
  let s = 11;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 110 }, () => ({
    x: r() * 100, y: r() * 100, z: r() * 1.6 + 0.5, d: r() * 6, t: 3 + r() * 5,
  }));
})();

const features = [
  { n: "01", title: "Interactive Fire Map", text: "Explore observations and derived Fire Events spatially." },
  { n: "02", title: "Fire Activity", text: "Understand activity across time." },
  { n: "03", title: "Preventive Measures", text: "Access practical prevention guidance." },
  { n: "04", title: "PyroScan ChatBot", text: "Ask questions about sensors, Fire Events and the dataset." },
];

const sources = [
  { name: "NASA FIRMS", text: "The source of the satellite active-fire observations used by PyroScan." },
  { name: "MODIS", text: "A satellite active-fire product. Coarser spatial resolution, long observational heritage." },
  { name: "VIIRS", text: "A satellite active-fire product. Finer spatial resolution, a complementary view of the same landscape." },
];

function HeroVisual() {
  return (
    <svg className="orbit" viewBox="0 0 1000 1000" aria-label="MODIS and VIIRS observations converging on a derived Fire Event" role="img">
      <defs>
        <radialGradient id="fireGlow">
          <stop offset="0" stopColor="#ff7a3c" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="#ff4d1f" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ff4d1f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="globeFade">
          <stop offset="0.55" stopColor="#38d0ff" stopOpacity="0" />
          <stop offset="1" stopColor="#38d0ff" stopOpacity="0.07" />
        </radialGradient>
        <path id="arcM" d="M230 470 Q 340 400 480 492" />
        <path id="arcV" d="M770 470 Q 660 400 520 492" />
        <path id="arcTop" d="M230 470 A 300 300 0 0 1 770 470" />
      </defs>

      <circle cx="500" cy="500" r="480" fill="url(#globeFade)" />

      {/* faint geographic texture */}
      <g className="geo">
        {[80, 170, 270, 380].map((rx) => (
          <ellipse key={rx} cx="500" cy="500" rx={rx} ry="480" />
        ))}
        {[-320, -200, -90, 0, 90, 200, 320].map((dy) => (
          <ellipse key={dy} cx="500" cy={500 + dy} rx={Math.sqrt(480 * 480 - dy * dy)} ry={Math.abs(dy) * 0.12 + 6} />
        ))}
      </g>

      {/* rings */}
      <g className="rings">
        <circle cx="500" cy="500" r="480" className="r-solid" />
        <circle cx="500" cy="500" r="380" className="r-dash spin" />
        <circle cx="500" cy="500" r="260" className="r-solid" />
        <circle cx="500" cy="500" r="170" className="r-dash spin-rev" />
        <circle cx="500" cy="500" r="90" className="r-solid" />
      </g>

      {/* orbital arcs */}
      <use href="#arcTop" className="arc arc--top" />
      <use href="#arcM" className="arc arc--sat" />
      <use href="#arcV" className="arc arc--sat" />

      {/* particles */}
      <circle r="2.6" className="p p--sat">
        <animateMotion dur="5s" repeatCount="indefinite"><mpath href="#arcM" /></animateMotion>
      </circle>
      <circle r="2.6" className="p p--sat">
        <animateMotion dur="5s" begin="1.8s" repeatCount="indefinite"><mpath href="#arcV" /></animateMotion>
      </circle>
      <circle r="2" className="p p--fire">
        <animateMotion dur="14s" repeatCount="indefinite"><mpath href="#arcTop" /></animateMotion>
      </circle>

      {/* satellite nodes */}
      {[{ x: 230, l: "MODIS · OBSERVATION" }, { x: 770, l: "VIIRS · OBSERVATION" }].map((n) => (
        <g key={n.l} className="sat" transform={`translate(${n.x} 470)`}>
          <circle r="26" className="sat__ring" />
          <path d="M-38 0h-8M38 0h8M0 -38v-8M0 38v8" className="sat__tick" />
          <circle r="6" className="sat__core" />
          <text y="-58" textAnchor="middle" className="t t--sat">{n.l}</text>
        </g>
      ))}

      <text x="330" y="392" textAnchor="middle" className="t">SPATIAL MATCH</text>
      <text x="670" y="392" textAnchor="middle" className="t">TEMPORAL MATCH</text>
      <text x="500" y="222" textAnchor="middle" className="t t--dim">LAT · LON · TIME</text>

      {/* fire event */}
      <g transform="translate(500 500)">
        <circle r="150" fill="url(#fireGlow)" className="breathe" />
        <circle r="14" className="pulse-ring" />
        <circle r="14" className="pulse-ring pulse-ring--2" />
        <circle r="8" className="fire-core" />
        <text y="48" textAnchor="middle" className="t t--fire">FIRE EVENT</text>
        <text y="68" textAnchor="middle" className="t t--dim">DERIVED · NOT GROUND-CONFIRMED</text>
      </g>
    </svg>
  );
}

function Diagram() {
  return (
    <div className="diagram" role="img" aria-label="MODIS and VIIRS feed into Normalize, then Match, then Fire Event">
      <svg viewBox="0 0 900 300">
        <defs>
          <linearGradient id="lineG" x1="0" x2="1">
            <stop offset="0" stopColor="#38d0ff" />
            <stop offset="1" stopColor="#ff6a30" />
          </linearGradient>
        </defs>
        <g className="d-line">
          <path d="M150 90 H230 Q260 90 260 120 V150 H330" />
          <path d="M150 210 H230 Q260 210 260 180 V150 H330" />
          <path d="M470 150 H580" />
          <path d="M700 150 H760" />
        </g>
        <circle r="3" className="p p--sat"><animateMotion dur="4s" repeatCount="indefinite" path="M150 90 H230 Q260 90 260 120 V150 H330" /></circle>
        <circle r="3" className="p p--sat"><animateMotion dur="4s" begin="1s" repeatCount="indefinite" path="M150 210 H230 Q260 210 260 180 V150 H330" /></circle>
        <circle r="3" className="p p--fire"><animateMotion dur="3s" repeatCount="indefinite" path="M470 150 H760" /></circle>

        {[["MODIS", 90], ["VIIRS", 210]].map(([l, y]) => (
          <g key={l}>
            <rect x="30" y={y - 24} width="120" height="48" rx="2" className="d-box" />
            <text x="90" y={y + 5} textAnchor="middle" className="t t--sat">{l}</text>
          </g>
        ))}
        <rect x="330" y="120" width="140" height="60" rx="2" className="d-box" />
        <text x="400" y="156" textAnchor="middle" className="t">NORMALIZE</text>
        <rect x="580" y="120" width="120" height="60" rx="2" className="d-box" />
        <text x="640" y="156" textAnchor="middle" className="t">MATCH</text>
        <text x="640" y="206" textAnchor="middle" className="t t--dim">DISTANCE + TIME</text>
        <circle cx="810" cy="150" r="42" className="d-fire" />
        <circle cx="810" cy="150" r="8" className="fire-core" />
        <text x="810" y="222" textAnchor="middle" className="t t--fire">FIRE EVENT</text>
      </svg>
    </div>
  );
}

export default function App() {
  return (
    <div className="page" id="top">
      <div className="stars" aria-hidden="true">
        {stars.map((s, i) => (
          <span key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.z, height: s.z, animationDelay: `${s.d}s`, animationDuration: `${s.t}s` }} />
        ))}
      </div>

      {/* NAVBAR */}
      <header className="nav">
        <a href="#top" className="nav__brand"><span className="nav__dot" />PYROSCAN</a>
        <nav className="nav__links" aria-label="Primary">
          <a href="#mission">Mission</a>
          <a href="#explore">Explore</a>
          <a href="#methodology">Methodology</a>
        </nav>
        <a href="#explore" className="nav__cta">Explore Fire Map <span>→</span></a>
      </header>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="hero__visual" aria-hidden="false"><HeroVisual /></div>

          <span className="edge edge--tl">NASA FIRMS · ACTIVE FIRE</span>
          <span className="edge edge--ml">MODIS · ~1 KM</span>
          <span className="edge edge--tr">SPATIAL CORRELATION</span>
          <span className="edge edge--mr">VIIRS · ~375 M NADIR</span>
          <span className="edge edge--bl">TRACEABLE SOURCE IDS</span>

          <div className="hero__content">
            <p className="eyebrow">Explainable satellite fire analysis</p>
            <h1>
              <span>Turn satellite signals</span>
              <span>into understandable</span>
              <span className="ember">fire events.</span>
            </h1>
            <p className="lead">
              PyroScan harmonizes MODIS and VIIRS observations into traceable Fire Events —
              making satellite signals easier to explore, understand and act on.
            </p>
            <div className="actions">
              <a href="#explore" className="btn btn--solid">Explore Fire Map <span>→</span></a>
              <a href="#mission" className="btn btn--line">How It Works</a>
            </div>
          </div>

          <a href="#mission" className="scroll" aria-label="Scroll to next section">
            <span>SCROLL</span><i />
          </a>
        </section>

        {/* MISSION */}
        <section id="mission" className="sec sec--center">
          <p className="label">01 — Mission</p>
          <h2>The signal is<br />not the event.</h2>
          <p className="sub">
            MODIS and VIIRS each produce observations. PyroScan normalizes them, finds nearby
            cross-sensor detections, compares spatial distance and time difference, and — when
            prototype matching criteria are satisfied — derives a Fire Event.
          </p>
          <Diagram />
        </section>

        {/* FEATURES */}
        <section id="explore" className="sec">
          <p className="label">02 — Explore</p>
          <div className="grid">
            {features.map((f) => (
              <article key={f.n} className="fcard">
                <span className="fcard__n">{f.n}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <span className="fcard__arrow">→</span>
              </article>
            ))}
          </div>
        </section>

        {/* DATA / TRANSPARENCY */}
        <section id="methodology" className="sec sec--data">
          <p className="label">03 — Data &amp; Transparency</p>
          <div className="data">
            {sources.map((s) => (
              <div key={s.name} className="data__col">
                <h3>{s.name}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
          <p className="note">
            PyroScan uses satellite active-fire observations. Fire Events are derived by
            PyroScan's matching logic and should not be interpreted as guaranteed ground
            confirmation. Satellite observations have inherent limitations.
          </p>
        </section>

        {/* FINAL CTA */}
        <section className="sec sec--center cta">
          <h2>From observation<br />to <span className="ember">understanding.</span></h2>
          <a href="#explore" className="btn btn--solid">EXPLORE PYROSCAN <span>→</span></a>
        </section>
      </main>

      <footer className="footer">
        <span>PYROSCAN</span>
        <span>NASA SPACE APPS CHALLENGE 2026</span>
      </footer>
    </div>
  );
}