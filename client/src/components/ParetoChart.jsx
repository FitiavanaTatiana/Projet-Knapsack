// src/components/ParetoChart.jsx — Frontière de Pareto dynamique

import { useState, useEffect } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { pareto } from "../api/knapsack";

export default function ParetoChart({ products, budget, criteres }) {
  const [data, setData]         = useState(null);
  const [selected, setSelected] = useState(null);
  const [axeX, setAxeX]         = useState(null);
  const [axeY, setAxeY]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (criteres.length >= 1) { setAxeX(criteres[0]); }
    if (criteres.length >= 2) { setAxeY(criteres[1]); }
    else                      { setAxeY(null); }
  }, [criteres.join(",")]);

  useEffect(() => {
    if (!products?.length) return;
    fetchPareto();
  }, [products, budget]);

  const fetchPareto = async () => {
    setLoading(true); setError(null);
    try {
      const res = await pareto({ products, budget, nbPoints: 30 });
      setData(res); setSelected(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (loading) return <Placeholder text="Calcul de la frontière de Pareto..." />;
  if (error)   return <ErrorBox msg={error} />;
  if (!data)   return <Placeholder text="Lance d'abord une optimisation." />;

  // Préparer les points scatter selon les axes choisis
  const toPoint = (sol) => ({
    ...sol,
    x: sol.scores_criteres?.[axeX] ?? 0,
    y: axeY ? sol.scores_criteres?.[axeY] ?? 0 : sol.score_total,
  });

  const paretoPoints   = data.pareto_front.map((s) => ({ ...toPoint(s), type: "pareto" }));
  const dominatedPoints = data.all_solutions
    .filter((s) => !data.pareto_front.some((p) => p.chosen_noms.join() === s.chosen_noms.join()))
    .map((s) => ({ ...toPoint(s), type: "dominated" }));

  const CustomDot = ({ cx, cy, payload }) => {
    const isPareto   = payload.type === "pareto";
    const isSelected = selected?.chosen_noms?.join() === payload.chosen_noms?.join();
    return (
      <circle cx={cx} cy={cy}
        r={isSelected ? 11 : isPareto ? 8 : 5}
        fill={isPareto ? "#1D9E75" : "#B4B2A9"}
        stroke={isSelected ? "#0F6E56" : isPareto ? "#085041" : "#888"}
        strokeWidth={isSelected ? 2.5 : 0.5}
        style={{ cursor: "pointer" }}
        onClick={() => setSelected(payload)}
      />
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={s.tooltip}>
        <p style={{ fontWeight: 500, margin: "0 0 4px", fontSize: 13 }}>
          {d.type === "pareto" ? "Solution Pareto" : "Dominée"}
        </p>
        {criteres.map((c) => (
          <p key={c} style={{ margin: "2px 0", fontSize: 12, color: "var(--color-text-secondary)" }}>
            {c}: {d.scores_criteres?.[c] ?? "—"}
          </p>
        ))}
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#1D9E75" }}>{d.chosen_noms?.join(", ")}</p>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Sélecteur d'axes (si > 2 critères) */}
      {criteres.length > 2 && (
        <div style={s.card}>
          <p style={s.label}>Axes du graphe</p>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <div>
              <span style={s.hint}>Axe X — </span>
              <select value={axeX} onChange={(e) => setAxeX(e.target.value)} style={s.select}>
                {criteres.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <span style={s.hint}>Axe Y — </span>
              <select value={axeY} onChange={(e) => setAxeY(e.target.value)} style={s.select}>
                {criteres.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Légende */}
      <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--color-text-secondary)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#1D9E75" }} />
          Pareto ({data.nb_pareto})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#B4B2A9" }} />
          Dominées
        </span>
      </div>

      {/* Scatter plot */}
      <div style={s.card}>
        <p style={s.sectionTitle}>{axeX} vs {axeY ?? "score total"}</p>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
            <XAxis dataKey="x" name={axeX}
              label={{ value: axeX, position: "insideBottom", offset: -10, fontSize: 12 }}
              tick={{ fontSize: 11 }} />
            <YAxis dataKey="y" name={axeY ?? "score total"}
              label={{ value: axeY ?? "score total", angle: -90, position: "insideLeft", fontSize: 12 }}
              tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={dominatedPoints} shape={<CustomDot />} />
            <Scatter data={paretoPoints}    shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Détail sélection */}
      {selected && (
        <div style={{ ...s.card, borderLeft: "3px solid #1D9E75", borderRadius: "0 12px 12px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={s.sectionTitle}>Solution sélectionnée</p>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-secondary)" }}>×</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 10 }}>
            {criteres.map((c) => (
              <div key={c}>
                <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", margin: 0, textTransform: "uppercase" }}>{c}</p>
                <p style={{ fontSize: 18, fontWeight: 500, margin: "2px 0 0" }}>{selected.scores_criteres?.[c] ?? "—"}</p>
              </div>
            ))}
            <div>
              <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", margin: 0, textTransform: "uppercase" }}>Poids</p>
              <p style={{ fontSize: 18, fontWeight: 500, margin: "2px 0 0" }}>{selected.poids_total}</p>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {selected.chosen_noms?.map((n) => (
              <span key={n} style={{ padding: "4px 10px", borderRadius: 6, background: "#E1F5EE", color: "#085041", fontSize: 13, fontWeight: 500 }}>{n}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tableau Pareto */}
      <div style={s.card}>
        <p style={s.sectionTitle}>Toutes les solutions Pareto ({data.nb_pareto})</p>
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Produits</th>
                {criteres.map((c) => <th key={c} style={s.th}>{c}</th>)}
                <th style={s.th}>Poids</th>
              </tr>
            </thead>
            <tbody>
              {data.pareto_front.map((sol, i) => (
                <tr key={i} onClick={() => setSelected({ ...sol, type: "pareto" })}
                  style={{ cursor: "pointer", background: selected?.chosen_noms?.join() === sol.chosen_noms.join() ? "var(--color-background-success)" : i % 2 === 0 ? "var(--color-background-tertiary)" : "transparent" }}>
                  <td style={s.td}>{sol.chosen_noms.join(", ")}</td>
                  {criteres.map((c) => <td key={c} style={s.td}>{sol.scores_criteres?.[c] ?? "—"}</td>)}
                  <td style={s.td}>{sol.poids_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ text }) { return <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-tertiary)", fontSize: 14 }}>{text}</div>; }
function ErrorBox({ msg })     { return <div style={{ background: "var(--color-background-danger)", color: "var(--color-text-danger)", padding: 12, borderRadius: 8, fontSize: 13 }}>{msg}</div>; }

const s = {
  card: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "14px 18px" },
  sectionTitle: { fontWeight: 500, fontSize: 14, margin: 0 },
  label: { fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 },
  hint: { fontSize: 12, color: "var(--color-text-tertiary)" },
  select: { fontSize: 13, padding: "4px 8px", borderRadius: 6, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "4px 8px", fontSize: 11, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" },
  td: { padding: "6px 8px" },
  tooltip: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, padding: "10px 14px", fontSize: 13 },
};
