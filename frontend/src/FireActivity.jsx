import { useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* Intentionally empty. No fake observations, counts or Fire Events.   */
/* Later, the backend may provide one record per day, e.g.:            */
/* {                                                                   */
/*   date: "YYYY-MM-DD",                                               */
/*   modis: 0,        // MODIS observations on that date                */
/*   viirs: 0,        // VIIRS observations on that date                */
/*   fireEvents: 0    // derived Fire Events on that date               */
/* }                                                                   */
/* ------------------------------------------------------------------ */
const activityData = [];

const FILTERS = [
    { id: "all", label: "All" },
    { id: "modis", label: "MODIS" },
    { id: "viirs", label: "VIIRS" },
    { id: "events", label: "Fire Events" },
];

const LEGEND = [
    { id: "modis", label: "MODIS", color: "var(--fa-modis)" },
    { id: "viirs", label: "VIIRS", color: "var(--fa-viirs)" },
    { id: "event", label: "FIRE EVENT", color: "var(--fa-fire)" },
];

/* Monday-first week */
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTHS = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

/* Returns the count for the active filter on a given record */
function countFor(rec, filter) {
    if (!rec) return 0;
    if (filter === "modis") return rec.modis || 0;
    if (filter === "viirs") return rec.viirs || 0;
    if (filter === "events") return rec.fireEvents || 0;
    return (rec.modis || 0) + (rec.viirs || 0) + (rec.fireEvents || 0);
}

/* Builds the grid cells for a month (Monday-first, leading/trailing blanks) */
function buildMonth(year, month) {
    const first = new Date(year, month, 1);
    const lead = (first.getDay() + 6) % 7; // Monday = 0
    const days = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

export default function FireActivity({ onBack }) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [filter, setFilter] = useState("all");
    const [selected, setSelected] = useState(null); // "YYYY-MM-DD" | null

    const noData = activityData.length === 0;
    const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

    const cells = useMemo(() => buildMonth(year, month), [year, month]);

    /* Index future backend records by date for O(1) lookup */
    const byDate = useMemo(() => {
        const m = new Map();
        activityData.forEach((r) => r && r.date && m.set(r.date, r));
        return m;
    }, []);

    const selectedRecord = selected ? byDate.get(selected) : null;

    const goPrev = () => {
        if (month === 0) {
            setMonth(11);
            setYear((y) => y - 1);
        } else setMonth((m) => m - 1);
    };
    const goNext = () => {
        if (month === 11) {
            setMonth(0);
            setYear((y) => y + 1);
        } else setMonth((m) => m + 1);
    };
    const goToday = () => {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
    };

    const handleBack = () => {
        if (typeof onBack === "function") onBack();
        else window.history.back();
    };

    return (
        <div className="fa">
            <style>{css}</style>

            {/* scientific background */}
            <div className="fa-bg" aria-hidden="true">
                <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
                    <g className="fa-bg__rings">
                        <circle cx="500" cy="500" r="480" />
                        <circle cx="500" cy="500" r="380" className="dash" />
                        <circle cx="500" cy="500" r="260" />
                        <circle cx="500" cy="500" r="170" className="dash" />
                        <circle cx="500" cy="500" r="90" />
                    </g>
                    <g className="fa-bg__meridians">
                        {[80, 170, 270, 380].map((rx) => (
                            <ellipse key={rx} cx="500" cy="500" rx={rx} ry="480" />
                        ))}
                    </g>
                </svg>
            </div>

            {/* TOP BAR */}
            <header className="fa-top">
                <a href="/" className="fa-brand" aria-label="PyroScan home">
                    <span className="fa-brand__dot" />
                    PYROSCAN
                </a>
                <h1 className="fa-title">FIRE ACTIVITY</h1>
                <button type="button" className="fa-back" onClick={handleBack}>
                    ← BACK
                </button>
            </header>

            <main className="fa-main">
                {/* PAGE HEADER */}
                <div className="fa-head">
                    <p className="fa-eyebrow">01 — Calendar</p>
                    <h2>FIRE ACTIVITY</h2>
                    <p className="fa-sub">Satellite observation activity across time</p>
                </div>

                <div className="fa-layout">
                    {/* CALENDAR COLUMN */}
                    <section className="fa-cal" aria-label="Monthly calendar">
                        {/* toolbar */}
                        <div className="fa-toolbar">
                            <div className="fa-nav">
                                <button type="button" className="fa-icon" onClick={goPrev} aria-label="Previous month">
                                    ←
                                </button>
                                <div className="fa-month" aria-live="polite">
                                    <span className="fa-month__name">{MONTHS[month]}</span>
                                    <span className="fa-month__year">{year}</span>
                                </div>
                                <button type="button" className="fa-icon" onClick={goNext} aria-label="Next month">
                                    →
                                </button>
                                <button type="button" className="fa-today" onClick={goToday}>
                                    TODAY
                                </button>
                            </div>

                            <div className="fa-seg" role="group" aria-label="Layer filter">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        className={`fa-seg__btn ${filter === f.id ? "is-active" : ""}`}
                                        aria-pressed={filter === f.id}
                                        onClick={() => setFilter(f.id)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* grid */}
                        <div className="fa-gridwrap">
                            <div className="fa-week" aria-hidden="true">
                                {WEEKDAYS.map((d) => (
                                    <span key={d}>{d}</span>
                                ))}
                            </div>

                            <div className="fa-grid" role="grid" aria-label={`${MONTHS[month]} ${year}`}>
                                {cells.map((day, i) => {
                                    if (day === null) return <div key={`b${i}`} className="fa-cell fa-cell--blank" aria-hidden="true" />;
                                    const key = toKey(year, month, day);
                                    const rec = byDate.get(key);
                                    const n = countFor(rec, filter);
                                    const isToday = key === todayKey;
                                    const isSel = key === selected;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            role="gridcell"
                                            className={`fa-cell ${isToday ? "is-today" : ""} ${isSel ? "is-selected" : ""} ${n > 0 ? "has-data" : ""}`}
                                            aria-pressed={isSel}
                                            aria-label={`${key}${isToday ? ", today" : ""}${n > 0 ? "" : ", no observations"}`}
                                            onClick={() => setSelected(key)}
                                        >
                                            <span className="fa-cell__day">{pad(day)}</span>
                                            {isToday && <span className="fa-cell__tag">TODAY</span>}
                                            {n > 0 && <span className="fa-cell__bar" aria-hidden="true" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* empty state overlay */}
                            {noData && (
                                <div className="fa-empty" role="status">
                                    <div className="fa-empty__box">
                                        <span className="fa-empty__ring" aria-hidden="true" />
                                        <h3>NO ACTIVITY DATA LOADED</h3>
                                        <p>
                                            Satellite fire activity will appear here
                                            <br />
                                            when the data service is connected.
                                        </p>
                                        <span className="fa-empty__status">
                                            <i />
                                            DATA SERVICE NOT CONNECTED
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* legend */}
                        <div className="fa-legend" aria-label="Legend">
                            <p className="fa-label">LEGEND</p>
                            <ul>
                                {LEGEND.map((l) => (
                                    <li key={l.id}>
                                        <i style={{ background: l.color, boxShadow: `0 0 10px ${l.color}` }} />
                                        {l.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* DETAIL PANEL */}
                    <aside className="fa-panel" aria-label="Selected day details">
                        <div className="fa-panel__head">
                            <h3>SELECTED DAY</h3>
                        </div>
                        <div className="fa-panel__body">
                            <p className="fa-label">DATE</p>
                            <p className="fa-date">{selected ?? "— SELECT A DATE —"}</p>

                            {!selected && (
                                <p className="fa-hint">Choose a day on the calendar to inspect its satellite observations.</p>
                            )}

                            {selected && !selectedRecord && (
                                <div className="fa-none">
                                    <h4>NO OBSERVATIONS</h4>
                                    <p>No satellite observations are currently available for this date.</p>
                                </div>
                            )}

                            {/* Ready for future backend data. Renders only when a real record exists. */}
                            {selected && selectedRecord && (
                                <ul className="fa-stats">
                                    <li>
                                        <span>
                                            <i style={{ background: "var(--fa-modis)" }} />
                                            MODIS OBSERVATIONS
                                        </span>
                                        <b>{selectedRecord.modis ?? "—"}</b>
                                    </li>
                                    <li>
                                        <span>
                                            <i style={{ background: "var(--fa-viirs)" }} />
                                            VIIRS OBSERVATIONS
                                        </span>
                                        <b>{selectedRecord.viirs ?? "—"}</b>
                                    </li>
                                    <li>
                                        <span>
                                            <i style={{ background: "var(--fa-fire)" }} />
                                            DERIVED FIRE EVENTS
                                        </span>
                                        <b>{selectedRecord.fireEvents ?? "—"}</b>
                                    </li>
                                </ul>
                            )}

                            <div className="fa-status">
                                <span className={`fa-status__dot ${noData ? "" : "is-live"}`} />
                                <span>{noData ? "DATA SERVICE NOT CONNECTED" : `${activityData.length} DAYS LOADED`}</span>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* TRANSPARENCY NOTE */}
                <p className="fa-note">
                    Fire activity shown by PyroScan is based on satellite active-fire observations. Derived Fire Events are
                    generated by PyroScan's matching logic and should not be interpreted as guaranteed ground confirmation.
                </p>
            </main>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* STYLES (kept in this file so the page stays a single file)          */
/* ------------------------------------------------------------------ */
const css = `
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");

.fa {
  --fa-bg: #02040a;
  --fa-panel: rgba(6, 10, 18, 0.82);
  --fa-text: #eaf0fa;
  --fa-muted: #7d8aa3;
  --fa-dim: #4b566b;
  --fa-line: rgba(160, 200, 255, 0.14);
  --fa-cyan: #38d0ff;
  --fa-modis: #38d0ff;
  --fa-viirs: #8f9dff;
  --fa-fire: #ff5a26;
  --fa-fire-2: #ffa04a;
  --fa-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --fa-sans: "Space Grotesk", "Inter", system-ui, sans-serif;

  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  background: var(--fa-bg);
  color: var(--fa-text);
  font-family: var(--fa-sans);
  overflow: hidden;
}
.fa *, .fa *::before, .fa *::after { box-sizing: border-box; }
.fa h1, .fa h2, .fa h3, .fa h4, .fa p, .fa ul { margin: 0; padding: 0; }
.fa ul { list-style: none; }
.fa button { font: inherit; color: inherit; cursor: pointer; }
.fa a { color: inherit; text-decoration: none; }
.fa :focus-visible { outline: 1px solid var(--fa-cyan); outline-offset: 3px; }

/* background */
.fa-bg {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255, 90, 38, 0.08), transparent 70%),
    radial-gradient(ellipse 50% 50% at 15% 20%, rgba(56, 208, 255, 0.07), transparent 70%),
    linear-gradient(rgba(160, 200, 255, 0.035) 1px, transparent 1px) 0 0 / 56px 56px,
    linear-gradient(90deg, rgba(160, 200, 255, 0.035) 1px, transparent 1px) 0 0 / 56px 56px,
    var(--fa-bg);
}
.fa-bg svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.fa-bg circle, .fa-bg ellipse { fill: none; stroke: var(--fa-cyan); stroke-width: 1; }
.fa-bg__rings circle { stroke-opacity: 0.1; }
.fa-bg__rings .dash { stroke-opacity: 0.16; stroke-dasharray: 2 10; }
.fa-bg__meridians ellipse { stroke-opacity: 0.045; }

/* top bar */
.fa-top {
  position: relative; z-index: 10; flex: 0 0 auto;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  height: 60px; padding: 0 clamp(14px, 3vw, 32px);
  background: rgba(2, 4, 10, 0.92);
  border-bottom: 1px solid var(--fa-line);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  font-family: var(--fa-mono); font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase;
}
.fa-top::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--fa-cyan), var(--fa-fire), transparent);
  opacity: 0.35; pointer-events: none;
}
.fa-brand { display: inline-flex; align-items: center; gap: 12px; font-weight: 500; }
.fa-brand__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--fa-fire); box-shadow: 0 0 12px var(--fa-fire); animation: fa-pulse 2.4s infinite; }
.fa-title { font-family: var(--fa-mono); font-weight: 400; font-size: 0.72rem; letter-spacing: 0.3em; color: var(--fa-cyan); white-space: nowrap; }
.fa-back {
  justify-self: end; padding: 9px 16px; background: transparent;
  border: 1px solid var(--fa-line); border-radius: 2px;
  font-family: var(--fa-mono); font-size: 0.68rem; letter-spacing: 0.2em; color: var(--fa-text);
  transition: border-color 0.25s, background 0.25s;
}
.fa-back:hover { border-color: var(--fa-cyan); background: rgba(56, 208, 255, 0.07); }

/* main scroll area */
.fa-main {
  position: relative; z-index: 2; flex: 1 1 auto; min-height: 0;
  overflow-y: auto; overflow-x: hidden;
  padding: clamp(28px, 5vh, 56px) clamp(14px, 4vw, 56px) 40px;
  max-width: 1320px; width: 100%; margin: 0 auto;
}

.fa-head { margin-bottom: clamp(24px, 4vh, 40px); }
.fa-eyebrow { font-family: var(--fa-mono); font-size: 0.66rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--fa-cyan); margin-bottom: 16px; }
.fa-head h2 { font-weight: 500; text-transform: uppercase; font-size: clamp(1.8rem, 4.4vw, 3.4rem); line-height: 1.03; letter-spacing: -0.025em; }
.fa-sub { margin-top: 14px; color: var(--fa-muted); font-size: clamp(0.9rem, 1.2vw, 1rem); line-height: 1.6; }

/* layout */
.fa-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; align-items: start; }

.fa-label { font-family: var(--fa-mono); font-size: 0.62rem; letter-spacing: 0.26em; color: var(--fa-dim); text-transform: uppercase; margin-bottom: 10px; }

/* calendar card */
.fa-cal {
  position: relative; min-width: 0;
  background: var(--fa-panel); border: 1px solid var(--fa-line); border-radius: 2px;
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.fa-cal::before, .fa-panel::before {
  content: ""; position: absolute; top: -1px; left: -1px; width: 22px; height: 22px;
  border-top: 1px solid var(--fa-cyan); border-left: 1px solid var(--fa-cyan); pointer-events: none;
}

.fa-toolbar {
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 18px 20px; border-bottom: 1px solid var(--fa-line);
}
.fa-nav { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.fa-icon {
  width: 34px; height: 34px; display: grid; place-items: center; background: transparent;
  border: 1px solid var(--fa-line); border-radius: 2px; font-family: var(--fa-mono); line-height: 1;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.fa-icon:hover { border-color: var(--fa-cyan); color: var(--fa-cyan); background: rgba(56, 208, 255, 0.07); }
.fa-month { display: flex; align-items: baseline; gap: 12px; min-width: 190px; justify-content: center; font-family: var(--fa-mono); }
.fa-month__name { font-size: 0.86rem; letter-spacing: 0.28em; font-weight: 500; }
.fa-month__year { font-size: 0.78rem; letter-spacing: 0.2em; color: var(--fa-cyan); }
.fa-today {
  margin-left: 6px; padding: 9px 12px; background: transparent; border: 1px solid var(--fa-line); border-radius: 2px;
  font-family: var(--fa-mono); font-size: 0.6rem; letter-spacing: 0.2em; color: var(--fa-muted);
  transition: color 0.2s, border-color 0.2s;
}
.fa-today:hover { color: var(--fa-text); border-color: rgba(160, 200, 255, 0.35); }

.fa-seg { display: grid; grid-template-columns: repeat(4, auto); gap: 6px; }
.fa-seg__btn {
  padding: 10px 12px; background: transparent; border: 1px solid var(--fa-line); border-radius: 2px;
  font-family: var(--fa-mono); font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--fa-muted);
  white-space: nowrap; transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.fa-seg__btn:hover { color: var(--fa-text); border-color: rgba(160, 200, 255, 0.35); }
.fa-seg__btn.is-active { color: var(--fa-text); border-color: var(--fa-cyan); background: rgba(56, 208, 255, 0.09); box-shadow: inset 0 0 18px rgba(56, 208, 255, 0.08); }
.fa-seg__btn:last-child.is-active { border-color: var(--fa-fire); background: rgba(255, 90, 38, 0.1); box-shadow: inset 0 0 18px rgba(255, 90, 38, 0.1); }

/* grid */
.fa-gridwrap { position: relative; padding: 18px 20px 8px; }
.fa-week, .fa-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.fa-week { margin-bottom: 8px; }
.fa-week span { font-family: var(--fa-mono); font-size: 0.6rem; letter-spacing: 0.24em; color: var(--fa-dim); text-align: left; padding-left: 10px; }
.fa-grid { border-top: 1px solid var(--fa-line); border-left: 1px solid var(--fa-line); }

.fa-cell {
  position: relative; aspect-ratio: 1.25 / 1; min-height: 54px; min-width: 0;
  display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between;
  padding: 10px; text-align: left; background: transparent;
  border: 0; border-right: 1px solid var(--fa-line); border-bottom: 1px solid var(--fa-line); border-radius: 0;
  transition: background 0.25s;
  overflow: hidden;
}
.fa-cell::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
  background: linear-gradient(90deg, var(--fa-cyan), var(--fa-fire));
  transform: scaleX(0); transform-origin: left; transition: transform 0.4s;
}
.fa-cell:hover { background: rgba(56, 208, 255, 0.05); }
.fa-cell:hover::after { transform: scaleX(1); }
.fa-cell--blank { background: rgba(2, 4, 10, 0.35); pointer-events: none; }
.fa-cell__day { font-family: var(--fa-mono); font-size: 0.78rem; letter-spacing: 0.1em; color: var(--fa-muted); }
.fa-cell:hover .fa-cell__day { color: var(--fa-text); }
.fa-cell__tag { font-family: var(--fa-mono); font-size: 0.5rem; letter-spacing: 0.2em; color: var(--fa-fire-2); }
.fa-cell.is-today { box-shadow: inset 0 0 0 1px rgba(255, 160, 74, 0.55), inset 0 0 22px rgba(255, 90, 38, 0.08); }
.fa-cell.is-today .fa-cell__day { color: var(--fa-fire-2); }
.fa-cell.is-selected { background: rgba(56, 208, 255, 0.09); box-shadow: inset 0 0 0 1px var(--fa-cyan), inset 0 0 22px rgba(56, 208, 255, 0.1); }
.fa-cell.is-selected .fa-cell__day { color: var(--fa-text); }
.fa-cell.is-selected.is-today { box-shadow: inset 0 0 0 1px var(--fa-cyan), inset 0 0 0 3px rgba(255, 160, 74, 0.3); }
.fa-cell__bar { position: absolute; left: 10px; right: 10px; bottom: 8px; height: 2px; background: var(--fa-cyan); box-shadow: 0 0 8px var(--fa-cyan); }

/* legend */
.fa-legend { padding: 8px 20px 20px; }
.fa-legend ul { display: flex; flex-wrap: wrap; gap: 10px 26px; }
.fa-legend li { display: flex; align-items: center; gap: 12px; font-family: var(--fa-mono); font-size: 0.66rem; letter-spacing: 0.2em; color: var(--fa-text); }
.fa-legend i { width: 9px; height: 9px; border-radius: 50%; display: block; }

/* empty state */
.fa-empty { position: absolute; left: 20px; right: 20px; top: 46px; bottom: 8px; display: grid; place-items: center; pointer-events: none; padding: 16px; }
.fa-empty__box {
  max-width: 400px; text-align: center; padding: 30px 28px;
  background: rgba(2, 4, 10, 0.78); border: 1px solid var(--fa-line); border-radius: 2px;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.fa-empty__ring { display: block; width: 44px; height: 44px; margin: 0 auto 20px; border-radius: 50%; border: 1px solid rgba(56, 208, 255, 0.5); position: relative; }
.fa-empty__ring::before, .fa-empty__ring::after { content: ""; position: absolute; border-radius: 50%; }
.fa-empty__ring::before { inset: 15px; background: var(--fa-fire); box-shadow: 0 0 14px var(--fa-fire); opacity: 0.85; }
.fa-empty__ring::after { inset: 0; border: 1px solid var(--fa-fire-2); animation: fa-ripple 3.2s ease-out infinite; }
.fa-empty h3 { font-family: var(--fa-mono); font-weight: 500; font-size: 0.78rem; letter-spacing: 0.28em; margin-bottom: 12px; }
.fa-empty p { font-size: 0.86rem; line-height: 1.65; color: var(--fa-muted); }
.fa-empty__status { display: inline-flex; align-items: center; gap: 10px; margin-top: 18px; font-family: var(--fa-mono); font-size: 0.58rem; letter-spacing: 0.2em; color: var(--fa-dim); }
.fa-empty__status i { width: 7px; height: 7px; border-radius: 50%; background: var(--fa-dim); }

/* detail panel */
.fa-panel {
  position: relative; background: var(--fa-panel); border: 1px solid var(--fa-line); border-radius: 2px;
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.fa-panel__head { padding: 16px 18px; border-bottom: 1px solid var(--fa-line); }
.fa-panel h3 { font-family: var(--fa-mono); font-weight: 500; font-size: 0.74rem; letter-spacing: 0.3em; }
.fa-panel__body { padding: 18px; }
.fa-date { font-family: var(--fa-mono); font-size: 1rem; letter-spacing: 0.14em; color: var(--fa-cyan); margin-bottom: 20px; }
.fa-hint { font-size: 0.82rem; line-height: 1.6; color: var(--fa-dim); margin-bottom: 20px; }
.fa-none { padding: 16px 0 20px; border-top: 1px solid var(--fa-line); }
.fa-none h4 { font-family: var(--fa-mono); font-weight: 500; font-size: 0.72rem; letter-spacing: 0.26em; margin-bottom: 10px; }
.fa-none p { font-size: 0.86rem; line-height: 1.65; color: var(--fa-muted); }
.fa-stats { display: grid; gap: 12px; padding: 16px 0 20px; border-top: 1px solid var(--fa-line); }
.fa-stats li { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-family: var(--fa-mono); font-size: 0.62rem; letter-spacing: 0.16em; color: var(--fa-muted); }
.fa-stats li span { display: inline-flex; align-items: center; gap: 10px; }
.fa-stats i { width: 8px; height: 8px; border-radius: 50%; display: block; }
.fa-stats b { font-weight: 500; font-size: 0.9rem; color: var(--fa-text); }

.fa-status { display: flex; align-items: center; gap: 10px; padding-top: 16px; border-top: 1px solid var(--fa-line); font-family: var(--fa-mono); font-size: 0.6rem; letter-spacing: 0.18em; color: var(--fa-muted); }
.fa-status__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--fa-dim); flex-shrink: 0; }
.fa-status__dot.is-live { background: var(--fa-cyan); box-shadow: 0 0 10px var(--fa-cyan); }

/* note */
.fa-note {
  margin-top: 28px; max-width: 760px; padding-left: 20px;
  border-left: 1px solid var(--fa-fire); color: var(--fa-muted); font-size: 0.86rem; line-height: 1.7;
}

@keyframes fa-pulse { 50% { opacity: 0.4; } }
@keyframes fa-ripple { from { transform: scale(1); opacity: 0.8; } to { transform: scale(2.4); opacity: 0; } }

/* responsive */
@media (max-width: 1000px) {
  .fa-layout { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 760px) {
  .fa-top { grid-template-columns: 1fr auto; height: 56px; }
  .fa-title { display: none; }
  .fa-toolbar { padding: 14px; }
  .fa-nav { width: 100%; justify-content: space-between; }
  .fa-month { min-width: 0; flex: 1; flex-direction: column; align-items: center; gap: 2px; }
  .fa-today { margin-left: 0; }
  .fa-seg { width: 100%; grid-template-columns: repeat(2, 1fr); }
  .fa-gridwrap { padding: 14px 10px 6px; }
  .fa-week span { padding-left: 4px; font-size: 0.52rem; letter-spacing: 0.1em; }
  .fa-cell { aspect-ratio: 1 / 1; min-height: 0; padding: 5px; }
  .fa-cell__day { font-size: 0.68rem; letter-spacing: 0.02em; }
  .fa-cell__tag { display: none; }
  .fa-cell__bar { left: 5px; right: 5px; bottom: 5px; }
  .fa-legend { padding: 8px 14px 16px; }
  .fa-empty { left: 10px; right: 10px; top: 36px; }
  .fa-empty__box { padding: 22px 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .fa *, .fa *::before, .fa *::after { animation: none !important; transition: none !important; }
}
`;