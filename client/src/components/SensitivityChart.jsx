// src/components/SensitivityChart.jsx — Sensibilité dynamique sur critère choisi

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { sensitivity } from "../api/knapsack";

const COULEURS = ["#1D9E75", "#378ADD", "#E24B4A", "#BA7517", "#7F77DD", "#D85A30"];

export default function SensitivityChart({ products, budget, criteres }) {
  const [cible, setCible]   = useState(criteres[0]);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!criteres.includes(cible)) setCible(criteres[0]);
  }, [criteres.join(",")]);

  useEffect(() => {
    if (!products?.length || !cible) return;
    fetchSensitivity();
  }, [products, budget, cible]);

  const fetchSensitivity = async () => {
    setLoading(true); setError(null);
    try {
      const res = await sensitivity({ products, budget, critere_cible: cible, nb_points: 20 });
      setData(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Points de rupture (changement de combinaison)
  const ruptures = data?.sensitivity?.reduce((acc, row, i, arr) => {
    if (i === 0) return acc;
    const prev = arr[i-1].chosen_noms.slice().sort().join();
    const curr = row.chosen_noms.slice().sort().join();
    if (prev !== curr) acc.push({ w: row.w_cible, avant: arr[i-1].chosen_noms.join(", "), apres: row.chosen_noms.join(", ") });
    return acc;
  }, []) ?? [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length || !data) return null;
    const row = data.sensitivity.find((r) => r.w_cible === label);
    return (
      <div style={s.tooltip}>
        <p style={{ fontWeight: 500, margin: "0 0 4px", fontSize: 13 }}>
          {cible}: {Math.round(label * 100)}%
        </p>
        {payload.map((p) => (
          <p key={p.name} style={{ margin: "2px 0", fontSize: 12, color: p.stroke }}>{p.name}: {p.value}</p>
        ))}
        {row && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#1D9E75" }}>Choix: {row.chosen_noms.join(", ")}</p>}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Sélecteur critère cible */}
      <div style={s.card}>
        <p style={s.label}>Critère à analyser</p>
        <p style={s.hint}>Son poids varie de 0% à 100%. Les autres critères se partagent le reste équitablement.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {criteres.map((c, i) => (
            <button key={c} onClick={() => setCible(c)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                border: `1.5px solid ${cible === c ? COULEURS[i % COULEURS.length] : "var(--color-border-tertiary)"}`,
                background: cible === c ? COULEURS[i % COULEURS.length] : "transparent",
                color: cible === c ? "#fff" : "var(--color-text-primary)",
                fontWeight: cible === c ? 500 : 400,
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", color: "var(--color-text-secondary)", padding: 20 }}>Calcul...</div>}
      {error   && <div style={{ background: "var(--color-background-danger)", color: "var(--color-text-danger)", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

      {data && !loading && (
        <>
          {/* Graphe */}
          <div style={s.card}>
            <p style={s.sectionTitle}>Évolution des scores quand le poids de "{cible}" varie</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.sensitivity} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                <XAxis dataKey="w_cible" tickFormatter={(v) => `${Math.round(v*100)}%`}
                  label={{ value: `Poids ${cible} →`, position: "insideBottom", offset: -15, fontSize: 12 }}
                  tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="score_total" name="Score total" stroke="#888" strokeWidth={2} dot={false} />
                {criteres.map((c, i) => (
                  <Line key={c} type="monotone"
                    dataKey={`scores_criteres.${c}`}
                    name={c}
                    stroke={COULEURS[i % COULEURS.length]}
                    strokeWidth={1.5} dot={false} strokeDasharray="4 2"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Points de rupture */}
          <div style={s.card}>
            <p style={s.sectionTitle}>
              {ruptures.length > 0 ? `${ruptures.length} point(s) de rupture` : "Aucun point de rupture — solution robuste"}
            </p>
            {ruptures.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {ruptures.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "var(--color-background-tertiary)", borderRadius: 8 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, background: "#E1F5EE", color: "#085041", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>
                      {Math.round(r.w * 100)}%
                    </span>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{r.avant}</span>
                    <span style={{ color: "var(--color-text-tertiary)" }}>→</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#1D9E75" }}>{r.apres}</span>
                  </div>
                ))}
              </div>
            )}
            {ruptures.length === 0 && (
              <p style={s.hint}>La même combinaison reste optimale quelle que soit la pondération de "{cible}".</p>
            )}
          </div>

          {/* Tableau complet */}
          <div style={s.card}>
            <p style={s.sectionTitle}>Tableau complet</p>
            <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 8 }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>w_{cible}</th>
                    <th style={s.th}>Score total</th>
                    <th style={s.th}>Produits choisis</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sensitivity.map((row, i) => {
                    const isRupture = ruptures.some((r) => r.w === row.w_cible);
                    return (
                      <tr key={i} style={{ background: isRupture ? "var(--color-background-info)" : i % 2 === 0 ? "var(--color-background-tertiary)" : "transparent" }}>
                        <td style={s.td}>{Math.round(row.w_cible * 100)}%</td>
                        <td style={s.td}>{row.score_total}</td>
                        <td style={s.td}>{row.chosen_noms.join(", ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  card: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "14px 18px" },
  sectionTitle: { fontWeight: 500, fontSize: 14, margin: 0 },
  label: { fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 },
  hint: { fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 4, lineHeight: 1.5 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "4px 8px", fontSize: 11, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" },
  td: { padding: "6px 8px" },
  tooltip: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, padding: "10px 14px", fontSize: 13 },
};
