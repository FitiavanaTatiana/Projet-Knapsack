// src/components/ProductForm.jsx
// Formulaire entièrement dynamique — N critères configurables

import { useState } from "react";

const CRITERES_DEFAUT = ["importance", "urgence"];

const PRODUITS_DEFAUT = (criteres) => [
  { nom: "A", prix: 1, criteres: Object.fromEntries(criteres.map((c, i) => [c, [10,8,3][i]??5])) },
  { nom: "B", prix: 8, criteres: Object.fromEntries(criteres.map((c, i) => [c, [15,5,7][i]??5])) },
  { nom: "C", prix: 3, criteres: Object.fromEntries(criteres.map((c, i) => [c, [7,9,1][i]??5]))  },
  { nom: "D", prix: 7, criteres: Object.fromEntries(criteres.map((c, i) => [c, [12,3,5][i]??5])) },
  { nom: "E", prix: 2, criteres: Object.fromEntries(criteres.map((c, i) => [c, [5,7,3][i]??5]))  },
  { nom: "F", prix: 4, criteres: Object.fromEntries(criteres.map((c, i) => [c, [9,6,4][i]??5]))  },
];

export default function ProductForm({ onSubmit, loading }) {
  const [criteres, setCriteres]   = useState(CRITERES_DEFAUT);
  const [nouveauC, setNouveauC]   = useState("");
  const [products, setProducts]   = useState(PRODUITS_DEFAUT(CRITERES_DEFAUT));
  const [budget, setBudget]       = useState(5);
  const [budgetInput, setBudgetInput] = useState("5");

  // ── Gestion critères ──
  const ajouterCritere = () => {
    const nom = nouveauC.trim().toLowerCase().replace(/\s+/g, "_");
    if (!nom || criteres.includes(nom)) return;
    const nouveauxC = [...criteres, nom];
    setCriteres(nouveauxC);
    setProducts((prev) =>
      prev.map((p) => ({ ...p, criteres: { ...p.criteres, [nom]: 5 } }))
    );
    setNouveauC("");
  };

  const supprimerCritere = (c) => {
    if (criteres.length <= 1) return;
    setCriteres((prev) => prev.filter((x) => x !== c));
    setProducts((prev) =>
      prev.map((p) => {
        const { [c]: _, ...rest } = p.criteres;
        return { ...p, criteres: rest };
      })
    );
  };

  const renommerCritere = (ancien, nouveau) => {
    const nom = nouveau.trim().toLowerCase().replace(/\s+/g, "_");
    if (!nom || criteres.includes(nom)) return;
    setCriteres((prev) => prev.map((c) => (c === ancien ? nom : c)));
    setProducts((prev) =>
      prev.map((p) => {
        const { [ancien]: val, ...rest } = p.criteres;
        return { ...p, criteres: { ...rest, [nom]: val ?? 5 } };
      })
    );
  };

  // ── Gestion produits ──
  const updateProduct = (idx, field, value) => {
    setProducts((prev) =>
      prev.map((p, i) => {
        if (i !== idx) return p;
        if (field === "nom") return { ...p, nom: value };
        if (field === "prix") return { ...p, prix: Number(value) };
        return { ...p, criteres: { ...p.criteres, [field]: Number(value) } };
      })
    );
  };

  const ajouterProduit = () => {
    setProducts((prev) => [
      ...prev,
      {
        nom: `P${prev.length + 1}`,
        prix: 1,
        criteres: Object.fromEntries(criteres.map((c) => [c, 5])),
      },
    ]);
  };

  const supprimerProduit = (idx) => {
    if (products.length <= 2) return;
    setProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Budget libre */}
      <div style={s.card}>
        <p style={s.label}>Budget maximum</p>
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <input
            type="number"
            min={1}
            value={budgetInput}
            onChange={(e) => {
              setBudgetInput(e.target.value);
              const v = Number(e.target.value);
              if (v > 0) setBudget(v);
            }}
            style={{ ...s.inputNum, width: 80, fontSize: 18, fontWeight: 500 }}
          />
          <span style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>
            (entier, ex: 10, 50, 1000)
          </span>
        </div>
      </div>

      {/* Critères dynamiques */}
      <div style={s.card}>
        <p style={s.label}>Critères ({criteres.length})</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {criteres.map((c) => (
            <div key={c} style={s.criterePill}>
              <input
                defaultValue={c}
                onBlur={(e) => renommerCritere(c, e.target.value)}
                style={s.critereInput}
              />
              <button
                onClick={() => supprimerCritere(c)}
                style={s.btnX}
                disabled={criteres.length <= 1}
              >×</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            placeholder="nouveau critère..."
            value={nouveauC}
            onChange={(e) => setNouveauC(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ajouterCritere()}
            style={{ ...s.inputNum, flex: 1 }}
          />
          <button onClick={ajouterCritere} style={s.btnSec}>+ Ajouter</button>
        </div>
      </div>

      {/* Tableau produits */}
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={s.label}>Produits ({products.length})</p>
          <button onClick={ajouterProduit} style={s.btnSec}>+ Produit</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Nom</th>
                <th style={s.th}>Prix</th>
                {criteres.map((c) => (
                  <th key={c} style={s.th}>{c}</th>
                ))}
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i} style={i % 2 === 0 ? s.rowEven : {}}>
                  <td style={s.td}>
                    <input value={p.nom} onChange={(e) => updateProduct(i, "nom", e.target.value)} style={{ ...s.inputNum, width: 44 }} maxLength={6} />
                  </td>
                  <td style={s.td}>
                    <input type="number" min={1} value={p.prix} onChange={(e) => updateProduct(i, "prix", e.target.value)} style={{ ...s.inputNum, width: 52 }} />
                  </td>
                  {criteres.map((c) => (
                    <td key={c} style={s.td}>
                      <input type="number" min={0} max={100} value={p.criteres[c] ?? 0} onChange={(e) => updateProduct(i, c, e.target.value)} style={{ ...s.inputNum, width: 52 }} />
                    </td>
                  ))}
                  <td style={s.td}>
                    <button onClick={() => supprimerProduit(i)} style={s.btnX} disabled={products.length <= 2}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={() => onSubmit({ products, budget, criteres })}
        disabled={loading}
        style={loading ? { ...s.btnPrimary, opacity: 0.6 } : s.btnPrimary}
      >
        {loading ? "Calcul..." : "Lancer l'optimisation"}
      </button>
    </div>
  );
}

const s = {
  card: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "14px 18px" },
  label: { fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "4px 8px", fontSize: 11, color: "var(--color-text-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" },
  td: { padding: "4px 8px" },
  rowEven: { background: "var(--color-background-tertiary)" },
  inputNum: { padding: "4px 6px", fontSize: 13, borderRadius: 6, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", textAlign: "center" },
  criterePill: { display: "flex", alignItems: "center", gap: 2, background: "#E1F5EE", borderRadius: 20, padding: "3px 6px 3px 10px", border: "0.5px solid #9FE1CB" },
  critereInput: { border: "none", background: "transparent", color: "#085041", fontSize: 13, fontWeight: 500, width: 90, outline: "none" },
  btnX: { background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1, padding: "0 2px" },
  btnSec: { padding: "6px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-primary)", fontSize: 13, cursor: "pointer" },
  btnPrimary: { padding: "12px", borderRadius: 10, border: "none", background: "#1D9E75", color: "#fff", fontWeight: 500, fontSize: 15, cursor: "pointer", width: "100%" },
};
