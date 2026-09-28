import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* Standard Leaflet default-icon fix for bundlers (Vite) */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* Intentionally empty. No fake observations or Fire Events.           */
/* Later, the backend may provide objects such as:                     */
/* { event_id, latitude, longitude, timestamp, sensor, source_id }     */
/* ------------------------------------------------------------------ */
const observations = [];

/* Initial viewport only (India-centred). It does not imply any fire. */
const INITIAL_CENTER = [22.5, 79];
const INITIAL_ZOOM = 5;

const FILTERS = [
    { id: "all", label: "All" },
    { id: "modis", label: "MODIS" },
    { id: "viirs", label: "VIIRS" },
    { id: "events", label: "Fire Events" },
];

const LEGEND = [
    { id: "modis", label: "MODIS", color: "var(--fm-modis)" },
    { id: "viirs", label: "VIIRS", color: "var(--fm-viirs)" },
    { id: "event", label: "FIRE EVENT", color: "var(--fm-fire)" },
];

/* Classify a record. Adjust here when the backend schema is final. */
function getKind(o) {
    if (o.kind === "event" || (o.event_id && !o.sensor)) return "event";
    const s = String(o.sensor || "").toLowerCase();
    if (s === "modis") return "modis";
    if (s === "viirs") return "viirs";
    return "other";
}

function makeIcon(kind) {
    return L.divIcon({
        className: "fm-marker-wrap",
        html: `<span class="fm-marker fm-marker--${kind}"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -10],
    });
}

/* Keeps Leaflet sized correctly and fits the view once data exists */
function MapController({ points }) {
    const map = useMap();

    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 150);
        return () => clearTimeout(t);
    }, [map]);

    useEffect(() => {
        if (!points.length) return;
        map.fitBounds(L.latLngBounds(points), { padding: [70, 70], maxZoom: 10 });
    }, [map, points]);

    return null;
}

export default function FireMap({ onBack }) {
    const [filter, setFilter] = useState("all");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [panelOpen, setPanelOpen] = useState(true);

    /* Local filtering of the (currently empty) dataset */
    const visible = useMemo(() => {
        return observations.filter((o) => {
            const kind = getKind(o);
            if (filter === "modis" && kind !== "modis") return false;
            if (filter === "viirs" && kind !== "viirs") return false;
            if (filter === "events" && kind !== "event") return false;

            if (o.timestamp) {
                const t = new Date(o.timestamp).getTime();
                if (from && t < new Date(from).getTime()) return false;
                if (to && t > new Date(to).getTime() + 86399999) return false;
            }
            return Number.isFinite(o.latitude) && Number.isFinite(o.longitude);
        });
    }, [filter, from, to]);

    const points = useMemo(() => visible.map((o) => [o.latitude, o.longitude]), [visible]);
    const noData = observations.length === 0;

    return (
        <div className="fm">
            <style>{css}</style>

            {/* TOP BAR */}
            <header className="fm-top">
                <a href="/" className="fm-brand" aria-label="PyroScan home">
                    <span className="fm-brand__dot" />
                    PYROSCAN
                </a>
                <h1 className="fm-title">INTERACTIVE FIRE MAP</h1>
                <button type="button" className="fm-back" onClick={onBack}>
                    ← BACK
                </button>
            </header>

            <div className="fm-body">
                {/* MAP */}
                <MapContainer
                    className="fm-map"
                    center={INITIAL_CENTER}
                    zoom={INITIAL_ZOOM}
                    minZoom={2}
                    zoomControl={false}
                    worldCopyJump
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ZoomControl position="bottomright" />
                    <MapController points={points} />

                    {visible.map((o, i) => {
                        const kind = getKind(o);
                        return (
                            <Marker
                                key={o.event_id ?? o.source_id ?? i}
                                position={[o.latitude, o.longitude]}
                                icon={makeIcon(kind)}
                            >
                                <Popup>
                                    <div className="fm-pop">
                                        <strong>
                                            {kind === "event"
                                                ? "FIRE EVENT"
                                                : `${String(o.sensor || "OBSERVATION").toUpperCase()} · OBSERVATION`}
                                        </strong>
                                        {o.event_id && <span>Event ID: {o.event_id}</span>}
                                        {o.source_id && <span>Source ID: {o.source_id}</span>}
                                        {o.timestamp && <span>Time: {o.timestamp}</span>}
                                        <span>
                                            {o.latitude.toFixed(4)}, {o.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* atmosphere overlays */}
                <div className="fm-vignette" aria-hidden="true" />

                {/* LEFT CONTROL PANEL */}
                <aside className={`fm-panel ${panelOpen ? "" : "is-collapsed"}`} aria-label="Map controls">
                    <div className="fm-panel__head">
                        <h2>FIRE ACTIVITY</h2>
                        <button
                            type="button"
                            className="fm-collapse"
                            onClick={() => setPanelOpen((v) => !v)}
                            aria-expanded={panelOpen}
                            aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
                        >
                            {panelOpen ? "−" : "+"}
                        </button>
                    </div>

                    {panelOpen && (
                        <div className="fm-panel__body">
                            <p className="fm-label">LAYER</p>
                            <div className="fm-seg" role="group" aria-label="Layer filter">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        className={`fm-seg__btn ${filter === f.id ? "is-active" : ""}`}
                                        aria-pressed={filter === f.id}
                                        onClick={() => setFilter(f.id)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <p className="fm-label">OBSERVATION PERIOD</p>
                            <div className="fm-dates">
                                <label>
                                    <span>FROM</span>
                                    <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
                                </label>
                                <label>
                                    <span>TO</span>
                                    <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
                                </label>
                            </div>

                            <div className="fm-status">
                                <span className={`fm-status__dot ${noData ? "" : "is-live"}`} />
                                <span>
                                    {noData ? "DATA SERVICE NOT CONNECTED" : `${visible.length} OF ${observations.length} RECORDS SHOWN`}
                                </span>
                            </div>
                            <p className="fm-note">
                                Controls are interface previews and will apply to observations once data is loaded.
                            </p>
                        </div>
                    )}
                </aside>

                {/* LEGEND */}
                <div className="fm-legend" aria-label="Legend">
                    <p className="fm-label">LEGEND</p>
                    <ul>
                        {LEGEND.map((l) => (
                            <li key={l.id}>
                                <i style={{ background: l.color, boxShadow: `0 0 10px ${l.color}` }} />
                                {l.label}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* EMPTY STATE */}
                {noData && (
                    <div className="fm-empty" role="status">
                        <div className="fm-empty__box">
                            <span className="fm-empty__ring" aria-hidden="true" />
                            <h3>NO OBSERVATIONS LOADED</h3>
                            <p>Satellite observations will appear here when the data service is connected.</p>
                        </div>
                    </div>
                )}
                {!noData && visible.length === 0 && (
                    <div className="fm-empty" role="status">
                        <div className="fm-empty__box">
                            <span className="fm-empty__ring" aria-hidden="true" />
                            <h3>NO MATCHING OBSERVATIONS</h3>
                            <p>Adjust the layer or observation period to see records.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* STYLES (kept in this file so the page stays a single file)          */
/* ------------------------------------------------------------------ */
const css = `
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");

.fm {
  --fm-bg: #02040a;
  --fm-panel: rgba(6, 10, 18, 0.82);
  --fm-text: #eaf0fa;
  --fm-muted: #7d8aa3;
  --fm-dim: #4b566b;
  --fm-line: rgba(160, 200, 255, 0.14);
  --fm-cyan: #38d0ff;
  --fm-modis: #38d0ff;
  --fm-viirs: #8f9dff;
  --fm-fire: #ff5a26;
  --fm-fire-2: #ffa04a;
  --fm-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --fm-sans: "Space Grotesk", "Inter", system-ui, sans-serif;

  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  background: var(--fm-bg);
  color: var(--fm-text);
  font-family: var(--fm-sans);
}
.fm *, .fm *::before, .fm *::after { box-sizing: border-box; }
.fm h1, .fm h2, .fm h3, .fm p, .fm ul { margin: 0; padding: 0; }
.fm ul { list-style: none; }
.fm button { font: inherit; color: inherit; cursor: pointer; }
.fm a { color: inherit; text-decoration: none; }
.fm :focus-visible { outline: 1px solid var(--fm-cyan); outline-offset: 3px; }

/* top bar */
.fm-top {
  position: relative; z-index: 1000; flex: 0 0 auto;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  height: 60px; padding: 0 clamp(14px, 3vw, 32px);
  background: rgba(2, 4, 10, 0.92);
  border-bottom: 1px solid var(--fm-line);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  font-family: var(--fm-mono); font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase;
}
.fm-top::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--fm-cyan), var(--fm-fire), transparent);
  opacity: 0.35; pointer-events: none;
}
.fm-brand { display: inline-flex; align-items: center; gap: 12px; font-weight: 500; }
.fm-brand__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--fm-fire); box-shadow: 0 0 12px var(--fm-fire); animation: fm-pulse 2.4s infinite; }
.fm-title { font-family: var(--fm-mono); font-weight: 400; font-size: 0.72rem; letter-spacing: 0.3em; color: var(--fm-cyan); white-space: nowrap; }
.fm-back {
  justify-self: end; padding: 9px 16px; background: transparent;
  border: 1px solid var(--fm-line); border-radius: 2px;
  font-family: var(--fm-mono); font-size: 0.68rem; letter-spacing: 0.2em; color: var(--fm-text);
  transition: border-color 0.25s, background 0.25s;
}
.fm-back:hover { border-color: var(--fm-cyan); background: rgba(56, 208, 255, 0.07); }

/* body + map */
.fm-body { position: relative; flex: 1 1 auto; min-height: 0; }
.fm-map { position: absolute; inset: 0; width: 100%; height: 100%; background: var(--fm-bg); z-index: 1; }
.fm-map .leaflet-tile-pane { filter: invert(1) hue-rotate(190deg) brightness(0.78) contrast(0.92) saturate(0.55); }
.fm-vignette {
  position: absolute; inset: 0; z-index: 400; pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(2, 4, 10, 0.65) 100%),
    radial-gradient(ellipse 50% 30% at 50% 100%, rgba(255, 90, 38, 0.06), transparent 70%);
}

/* leaflet chrome */
.fm .leaflet-container { font-family: var(--fm-sans); background: var(--fm-bg); }
.fm .leaflet-bar { border: 1px solid var(--fm-line); border-radius: 2px; box-shadow: none; overflow: hidden; }
.fm .leaflet-bar a {
  background: var(--fm-panel); color: var(--fm-text); border-bottom: 1px solid var(--fm-line);
  width: 34px; height: 34px; line-height: 34px; transition: background 0.2s, color 0.2s;
}
.fm .leaflet-bar a:last-child { border-bottom: 0; }
.fm .leaflet-bar a:hover { background: rgba(56, 208, 255, 0.14); color: var(--fm-cyan); }
.fm .leaflet-control-attribution {
  background: rgba(2, 4, 10, 0.75); color: var(--fm-dim);
  font-family: var(--fm-mono); font-size: 9px; letter-spacing: 0.04em;
}
.fm .leaflet-control-attribution a { color: var(--fm-muted); }
.fm .leaflet-popup-content-wrapper, .fm .leaflet-popup-tip {
  background: rgba(6, 10, 18, 0.95); color: var(--fm-text);
  border: 1px solid var(--fm-line); border-radius: 2px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
}
.fm .leaflet-popup-close-button { color: var(--fm-muted); }
.fm-pop { display: flex; flex-direction: column; gap: 4px; font-family: var(--fm-mono); font-size: 11px; letter-spacing: 0.06em; color: var(--fm-muted); }
.fm-pop strong { color: var(--fm-cyan); font-weight: 500; letter-spacing: 0.16em; margin-bottom: 4px; }

/* markers */
.fm-marker-wrap { background: none; border: 0; }
.fm-marker { display: block; width: 14px; height: 14px; margin: 2px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.6); }
.fm-marker--modis { background: var(--fm-modis); box-shadow: 0 0 12px var(--fm-modis); }
.fm-marker--viirs { background: var(--fm-viirs); box-shadow: 0 0 12px var(--fm-viirs); }
.fm-marker--event { background: var(--fm-fire); box-shadow: 0 0 16px var(--fm-fire), 0 0 32px rgba(255, 90, 38, 0.5); }
.fm-marker--other { background: var(--fm-muted); }

/* shared labels */
.fm-label { font-family: var(--fm-mono); font-size: 0.62rem; letter-spacing: 0.26em; color: var(--fm-dim); text-transform: uppercase; margin-bottom: 10px; }

/* control panel */
.fm-panel {
  position: absolute; z-index: 900; top: 18px; left: 18px; width: 290px;
  background: var(--fm-panel); border: 1px solid var(--fm-line); border-radius: 2px;
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.fm-panel::before { content: ""; position: absolute; top: -1px; left: -1px; width: 22px; height: 22px; border-top: 1px solid var(--fm-cyan); border-left: 1px solid var(--fm-cyan); pointer-events: none; }
.fm-panel__head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; }
.fm-panel.is-collapsed .fm-panel__head { padding: 12px 18px; }
.fm-panel h2 { font-family: var(--fm-mono); font-weight: 500; font-size: 0.74rem; letter-spacing: 0.3em; }
.fm-collapse { width: 26px; height: 26px; display: grid; place-items: center; background: transparent; border: 1px solid var(--fm-line); border-radius: 2px; line-height: 1; transition: border-color 0.2s; }
.fm-collapse:hover { border-color: var(--fm-cyan); }
.fm-panel__body { padding: 4px 18px 18px; border-top: 1px solid var(--fm-line); padding-top: 18px; }

.fm-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 24px; }
.fm-seg__btn {
  padding: 10px 8px; background: transparent; border: 1px solid var(--fm-line); border-radius: 2px;
  font-family: var(--fm-mono); font-size: 0.64rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--fm-muted);
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.fm-seg__btn:hover { color: var(--fm-text); border-color: rgba(160, 200, 255, 0.35); }
.fm-seg__btn.is-active { color: var(--fm-text); border-color: var(--fm-cyan); background: rgba(56, 208, 255, 0.09); box-shadow: inset 0 0 18px rgba(56, 208, 255, 0.08); }
.fm-seg__btn:last-child.is-active { border-color: var(--fm-fire); background: rgba(255, 90, 38, 0.1); box-shadow: inset 0 0 18px rgba(255, 90, 38, 0.1); }

.fm-dates { display: grid; gap: 10px; margin-bottom: 22px; }
.fm-dates label { display: grid; grid-template-columns: 44px 1fr; align-items: center; gap: 10px; }
.fm-dates span { font-family: var(--fm-mono); font-size: 0.6rem; letter-spacing: 0.2em; color: var(--fm-muted); }
.fm-dates input {
  width: 100%; padding: 9px 10px; background: rgba(2, 4, 10, 0.7); color: var(--fm-text);
  border: 1px solid var(--fm-line); border-radius: 2px;
  font-family: var(--fm-mono); font-size: 0.72rem; color-scheme: dark;
}
.fm-dates input:focus { border-color: var(--fm-cyan); outline: none; }

.fm-status { display: flex; align-items: center; gap: 10px; padding-top: 16px; border-top: 1px solid var(--fm-line); font-family: var(--fm-mono); font-size: 0.6rem; letter-spacing: 0.18em; color: var(--fm-muted); }
.fm-status__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--fm-dim); flex-shrink: 0; }
.fm-status__dot.is-live { background: var(--fm-cyan); box-shadow: 0 0 10px var(--fm-cyan); }
.fm-note { margin-top: 10px; font-size: 0.74rem; line-height: 1.55; color: var(--fm-dim); }

/* legend */
.fm-legend {
  position: absolute; z-index: 900; left: 18px; bottom: 30px; padding: 14px 18px;
  background: var(--fm-panel); border: 1px solid var(--fm-line); border-radius: 2px;
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
}
.fm-legend .fm-label { margin-bottom: 12px; }
.fm-legend ul { display: grid; gap: 10px; }
.fm-legend li { display: flex; align-items: center; gap: 12px; font-family: var(--fm-mono); font-size: 0.66rem; letter-spacing: 0.2em; color: var(--fm-text); }
.fm-legend i { width: 9px; height: 9px; border-radius: 50%; display: block; }

/* empty state */
.fm-empty { position: absolute; inset: 0; z-index: 800; display: grid; place-items: center; pointer-events: none; padding: 20px; }
.fm-empty__box {
  position: relative; max-width: 420px; text-align: center; padding: 34px 32px;
  background: rgba(2, 4, 10, 0.72); border: 1px solid var(--fm-line); border-radius: 2px;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
}
.fm-empty__ring {
  display: block; width: 44px; height: 44px; margin: 0 auto 22px; border-radius: 50%;
  border: 1px solid rgba(56, 208, 255, 0.5); position: relative;
}
.fm-empty__ring::before, .fm-empty__ring::after { content: ""; position: absolute; border-radius: 50%; }
.fm-empty__ring::before { inset: 15px; background: var(--fm-fire); box-shadow: 0 0 14px var(--fm-fire); opacity: 0.85; }
.fm-empty__ring::after { inset: 0; border: 1px solid var(--fm-fire-2); animation: fm-ripple 3.2s ease-out infinite; }
.fm-empty h3 { font-family: var(--fm-mono); font-weight: 500; font-size: 0.8rem; letter-spacing: 0.3em; margin-bottom: 12px; }
.fm-empty p { font-size: 0.88rem; line-height: 1.65; color: var(--fm-muted); }

@keyframes fm-pulse { 50% { opacity: 0.4; } }
@keyframes fm-ripple { from { transform: scale(1); opacity: 0.8; } to { transform: scale(2.4); opacity: 0; } }

/* responsive */
@media (max-width: 760px) {
  .fm-top { grid-template-columns: 1fr auto; height: 56px; }
  .fm-title { display: none; }
  .fm-panel { top: 10px; left: 10px; right: 10px; width: auto; max-height: 58%; overflow-y: auto; }
  .fm-legend { left: 10px; bottom: 22px; padding: 12px 14px; }
  .fm-empty { padding-top: 120px; }
}
@media (max-height: 640px) and (min-width: 761px) {
  .fm-panel { max-height: calc(100% - 36px); overflow-y: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .fm *, .fm *::before, .fm *::after { animation: none !important; transition: none !important; }
}
`;