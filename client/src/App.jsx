// src/App.jsx — orchestre les 3 onglets, passe criteres à tous les composants

import { useState } from "react";
import ProductForm      from "./components/ProductForm";
import OptimizePanel    from "./components/OptimizePanel";
import ParetoChart      from "./components/ParetoChart";
import SensitivityChart from "./components/SensitivityChart";

const TABS = [
  { id: "optimize",    label: "Optimisation" },
  { id: "pareto",      label: "Frontière de Pareto" },
  { id: "sensitivity", label: "Sensibilité" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("optimize");
  const [config, setConfig]       = useState(null); // { products, budget, criteres }

  const handleSubmit = ({ products, budget, criteres }) => {
    setConfig({ products, budget, criteres });
  };

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <h1 style={s.title}>Sac à dos multi-critère</h1>
          <p style={s.subtitle}>Aide à la décision · programmation dynamique · frontière de Pareto</p>
        </div>
        {config && (
          <div style={s.badge}>
            {config.products.length} produits · budget {config.budget} · {config.criteres.length} critères : {config.criteres.join(", ")}
          </div>
        )}
      </header>

      <div style={s.layout}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <p style={s.sidebarTitle}>Configuration</p>
          <ProductForm onSubmit={handleSubmit} loading={false} />
        </aside>

        {/* Contenu principal */}
        <main style={s.main}>
          <div style={s.tabs}>
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={activeTab === tab.id ? s.tabActive : s.tab}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={s.content}>
            {!config ? (
              <div style={s.empty}>
                Configure tes produits et critères à gauche, puis clique sur
                <strong> "Lancer l'optimisation"</strong>.
              </div>
            ) : (
              <>
                {activeTab === "optimize"    && <OptimizePanel    {...config} />}
                {activeTab === "pareto"      && <ParetoChart      {...config} />}
                {activeTab === "sensitivity" && <SensitivityChart {...config} />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "var(--color-background-tertiary)", fontFamily: "var(--font-sans, system-ui, sans-serif)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 32px", background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", flexWrap: "wrap", gap: 12 },
  title:  { margin: 0, fontSize: 20, fontWeight: 500 },
  subtitle: { margin: "4px 0 0", fontSize: 12, color: "var(--color-text-secondary)" },
  badge: { padding: "6px 14px", borderRadius: 20, background: "#E1F5EE", color: "#085041", fontSize: 12, fontWeight: 500 },
  layout: { display: "grid", gridTemplateColumns: "360px 1fr", minHeight: "calc(100vh - 69px)" },
  sidebar: { background: "var(--color-background-primary)", borderRight: "0.5px solid var(--color-border-tertiary)", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" },
  sidebarTitle: { margin: 0, fontSize: 10, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" },
  main: { padding: "20px 26px", display: "flex", flexDirection: "column" },
  tabs: { display: "flex", gap: 4, borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: 18 },
  tab: { padding: "8px 16px", border: "none", background: "transparent", color: "var(--color-text-secondary)", fontSize: 14, cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -1, borderRadius: "6px 6px 0 0" },
  tabActive: { padding: "8px 16px", border: "none", background: "transparent", color: "#1D9E75", fontSize: 14, fontWeight: 500, cursor: "pointer", borderBottom: "2px solid #1D9E75", marginBottom: -1, borderRadius: "6px 6px 0 0" },
  content: { flex: 1 },
  empty: { textAlign: "center", padding: "60px 40px", color: "var(--color-text-secondary)", fontSize: 15, lineHeight: 1.7 },
};
