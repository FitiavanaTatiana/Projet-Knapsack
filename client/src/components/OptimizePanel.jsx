// src/components/OptimizePanel.jsx — sliders dynamiques pour N critères

import { useState, useEffect, useCallback } from "react";
import { optimize } from "../api/knapsack";

export default function OptimizePanel({ products, budget, criteres }) {
  // poids initiaux : égaux pour chaque critère
  const initPoids = () =>
    Object.fromEntries(criteres.map((c) => [c, Math.round(100 / criteres.length)]));

  const [poids, setPoids]   = useState(initPoids);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  // Réinitialiser quand les critères changent
  useEffect(() => {
    setPoids(initPoids());
    setResult(null);
  }, [criteres.join(",")]);

  const run = useCallback(async (poidsActuels) => {
    if (!products?.length) return;
    setLoading(true);
    setError(null);
    try {
      // Normaliser : la somme doit faire 100
      const total = Object.values(poidsActuels).reduce((a, b) => a + b, 0);
      const poidsNorm = Object.fromEntries(
        Object.entries(poidsActuels).map(([k, v]) => [k, total > 0 ? v / total : 1 / criteres.length])
      );
      const res = await optimize({ products, budget, poids: poidsNorm });
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [products, budget]);

  useEffect(() => { run(poids); }, [products, budget, criteres.join(",")]);

  // Changer le poids d'un critère et recalculer
  const changePoids = (critere, valeur) => {
    const nouveau = { ...poids, [critere]: Number(valeur) };
    setPoids(nouveau);
    run(nouveau);
  };

  const COULEURS = ["#1D9E75", "#378ADD", "#E24B4A", "#BA7517", "#7F77DD", "#D85A30"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Sliders poids — un par critère */}
      <div style={s.card}>
        <p style={s.sectionTitle}>Poids des critères</p>
        <p style={s.hint}>Chaque slider ajuste l'importance relative d'un critère. Recalcul automatique.</p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {criteres.map((c, i) => {
            const total = Object.values(poids).reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((poids[c] / total) * 100) : 0;
            const couleur = COULEURS[i % COULEURS.length];
            return (
              <div key={c}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{c}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: couleur }}>{pct}%</span>
                </div>
                <input
                  type="range" min={0} max={100} step={5}
                  value={poids[c] ?? 0}
                  onChange={(e) => changePoids(c, e.target.value)}
                  style={{ width: "100%", accentColor: couleur }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {loading && <div style={s.loading}>Calcul en cours...</div>}
      {error   && <div style={s.error}>{error}</div>}

      {result && !loading && (
        <>
          {/* Métriques */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(criteres.length + 1, 4)}, 1fr)`, gap: 10 }}>
            <MetricCard label="Score total" value={result.score_total} color="#1D9E75" />
            {criteres.map((c, i) => (
              <MetricCard
                key={c}
                label={`Score ${c}`}
                value={result.scores_criteres?.[c] ?? "—"}
                color={COULEURS[i % COULEURS.length]}
              />
            ))}
          </div>

          {/* Budget utilisé */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={s.hint}>Budget utilisé</span>
              <span style={{ fontWeight: 500 }}>{result.poids_total} / {result.budget}</span>
            </div>
            <div style={{ marginTop: 8, background: "var(--color-background-tertiary)", borderRadius: 6, height: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (result.poids_total / result.budget) * 100)}%`, background: "#1D9E75", borderRadius: 6 }} />
            </div>
          </div>

          {/* Produits choisis */}
          <div style={s.card}>
            <p style={s.sectionTitle}>Produits sélectionnés ({result.nb_choisis})</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {result.chosen.map((p) => (
                <div key={p.nom} style={s.chip}>
                  <span style={s.chipNom}>{p.nom}</span>
                  <span style={s.chipDetail}>
                    prix {p.prix} · {Object.entries(p.criteres).map(([c, v]) => `${c}: ${v}`).join(" · ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Étapes DP */}
          <div style={s.card}>
            <p style={s.sectionTitle}>Tableau DP — {result.steps.length} améliorations</p>
            <div style={{ maxHeight: 160, overflowY: "auto", marginTop: 8 }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Produit</th>
                    <th style={s.th}>Capacité w</th>
                    <th style={s.th}>dp[i,w]</th>
                  </tr>
                </thead>
                <tbody>
                  {result.steps.map((step, i) => (
                    <tr key={i} style={i % 2 === 0 ? { background: "var(--color-background-tertiary)" } : {}}>
                      <td style={s.td}>{step.produit}</td>
                      <td style={s.td}>{step.capacite}</td>
                      <td style={s.td}>{step.valeur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderTop: `3px solid ${color}`, borderRadius: 10, padding: "12px 14px" }}>
      <p style={{ fontSize: 10, color: "var(--color-text-secondary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, margin: "4px 0 0", color }}>{value}</p>
    </div>
  );
}

const s = {
  card: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "14px 18px" },
  sectionTitle: { fontWeight: 500, fontSize: 14, margin: 0 },
  hint: { fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 4, lineHeight: 1.5 },
  loading: { textAlign: "center", color: "var(--color-text-secondary)", padding: 20 },
  error: { background: "var(--color-background-danger)", color: "var(--color-text-danger)", padding: 12, borderRadius: 8, fontSize: 13 },
  chip: { display: "flex", flexDirection: "column", padding: "8px 12px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8 },
  chipNom: { fontWeight: 500, fontSize: 14, color: "#1D9E75" },
  chipDetail: { fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "4px 8px", fontSize: 11, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" },
  td: { padding: "4px 8px" },
};
