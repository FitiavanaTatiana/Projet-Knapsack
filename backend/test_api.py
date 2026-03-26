"""
test_api.py — Teste les routes avec des critères dynamiques
Lancer d'abord : python app.py
Puis           : python test_api.py
"""

import requests, json

BASE = "http://127.0.0.1:5000"

# ─── Données avec 3 critères dynamiques ───
PRODUCTS = [
    {"nom": "A", "prix": 1, "criteres": {"importance": 10, "urgence": 8, "risque": 2}},
    {"nom": "B", "prix": 8, "criteres": {"importance": 15, "urgence": 5, "risque": 7}},
    {"nom": "C", "prix": 3, "criteres": {"importance": 7,  "urgence": 9, "risque": 1}},
    {"nom": "D", "prix": 7, "criteres": {"importance": 12, "urgence": 3, "risque": 5}},
    {"nom": "E", "prix": 2, "criteres": {"importance": 5,  "urgence": 7, "risque": 3}},
    {"nom": "F", "prix": 4, "criteres": {"importance": 9,  "urgence": 6, "risque": 4}},
]
BUDGET = 5

def sep(t): print(f"\n{'='*55}\n  {t}\n{'='*55}")

# Health
sep("GET /health")
print(requests.get(f"{BASE}/health").json())

# Optimize avec 3 critères
sep("POST /optimize — 3 critères")
r = requests.post(f"{BASE}/optimize", json={
    "products": PRODUCTS,
    "budget":   BUDGET,
    "poids":    {"importance": 0.5, "urgence": 0.3, "risque": 0.2},
})
res = r.json()
print(f"Score total      : {res['score_total']}")
print(f"Scores critères  : {res['scores_criteres']}")
print(f"Poids utilisés   : {res['poids_utilises']}")
print(f"Produits choisis : {[p['nom'] for p in res['chosen']]}")
print(f"Étapes DP        : {len(res['steps'])}")

# Pareto
sep("POST /pareto")
r = requests.post(f"{BASE}/pareto", json={"products": PRODUCTS, "budget": BUDGET, "nb_points": 20})
res = r.json()
print(f"Solutions uniques : {res['nb_solutions']}")
print(f"Solutions Pareto  : {res['nb_pareto']}")
print(f"Critères détectés : {res['criteres']}")
for s in res["pareto_front"]:
    print(f"  {s['chosen_noms']}  scores={s['scores_criteres']}")

# Sensitivity sur "urgence"
sep("POST /sensitivity — critère cible : urgence")
r = requests.post(f"{BASE}/sensitivity", json={
    "products":      PRODUCTS,
    "budget":        BUDGET,
    "critere_cible": "urgence",
    "nb_points":     10,
})
res = r.json()
print(f"Critère cible : {res['critere_cible']}")
for pt in res["sensitivity"]:
    print(f"  w_urgence={pt['w_cible']:.1f}  → {pt['chosen_noms']}")

# Test validation
sep("Test validation — données invalides")
r = requests.post(f"{BASE}/optimize", json={
    "products": [{"nom": "X", "prix": -1, "criteres": {}}],
    "budget": 0,
})
print(f"Status : {r.status_code}")
print(f"Erreurs: {r.json()['errors']}")
