"""
Sac à dos multi-critère — Backend Flask (version dynamique)
=============================================================
Les critères NE SONT PLUS hardcodés.
Le frontend envoie une liste de critères avec leurs poids.

Structure d'un produit :
  { "nom": "Laptop", "prix": 6, "criteres": { "importance": 15, "urgence": 5, "risque": 3 } }

Structure des poids :
  { "importance": 0.5, "urgence": 0.3, "risque": 0.2 }

Routes :
  GET  /health       → vérification serveur
  POST /optimize     → solution optimale (poids donnés)
  POST /pareto       → frontière de Pareto (N critères)
  POST /sensitivity  → sensibilité sur un critère choisi
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)


# ─────────────────────────────────────────────
#  VALIDATION
# ─────────────────────────────────────────────

def validate_input(data):
    errors = []
    if not isinstance(data, dict):
        return ["Le corps doit être un objet JSON."]

    if "products" not in data:
        errors.append("Champ 'products' manquant.")
    elif not isinstance(data["products"], list) or len(data["products"]) == 0:
        errors.append("'products' doit être une liste non vide.")
    else:
        for i, p in enumerate(data["products"]):
            nom = p.get("nom", f"produit_{i}")
            if not isinstance(p.get("prix"), (int, float)) or p["prix"] <= 0:
                errors.append(f"'{nom}': 'prix' invalide (doit être > 0).")
            if not isinstance(p.get("criteres"), dict) or len(p["criteres"]) == 0:
                errors.append(f"'{nom}': 'criteres' manquant ou vide.")

    if "budget" not in data:
        errors.append("Champ 'budget' manquant.")
    elif not isinstance(data["budget"], (int, float)) or data["budget"] <= 0:
        errors.append("'budget' doit être un nombre positif.")

    return errors


def normaliser_poids(poids):
    total = sum(poids.values())
    if total <= 0:
        n = len(poids)
        return {k: round(1 / n, 6) for k in poids}
    return {k: round(v / total, 6) for k, v in poids.items()}


# ─────────────────────────────────────────────
#  ALGORITHME DP — N critères
# ─────────────────────────────────────────────

def score_agrege(produit, poids):
    criteres = produit.get("criteres", {})
    return sum(poids.get(c, 0) * criteres.get(c, 0) for c in poids)


def knapsack_dp(products, budget, poids):
    budget = int(budget)
    n = len(products)
    poids = normaliser_poids(poids)

    dp = [[0.0] * (budget + 1) for _ in range(n + 1)]
    steps = []

    for i in range(1, n + 1):
        prod  = products[i - 1]
        price = int(prod["prix"])
        score = score_agrege(prod, poids)

        for w in range(budget + 1):
            if price <= w:
                dp[i][w] = max(dp[i-1][w], dp[i-1][w-price] + score)
            else:
                dp[i][w] = dp[i-1][w]

            if dp[i][w] > dp[i-1][w]:
                steps.append({
                    "produit":  prod["nom"],
                    "capacite": w,
                    "valeur":   round(dp[i][w], 3),
                })

    # Backtracking
    w = budget
    chosen = []
    for i in range(n, 0, -1):
        if round(dp[i][w], 8) != round(dp[i-1][w], 8):
            chosen.append(products[i-1])
            w -= int(products[i-1]["prix"])
    chosen = chosen[::-1]

    scores_criteres = {
        c: round(sum(p["criteres"].get(c, 0) for p in chosen), 3)
        for c in poids
    }

    return {
        "score_total":     round(dp[n][budget], 3),
        "scores_criteres": scores_criteres,
        "poids_total":     sum(int(p["prix"]) for p in chosen),
        "chosen":          chosen,
        "steps":           steps,
    }


# ─────────────────────────────────────────────
#  PARETO — N critères
# ─────────────────────────────────────────────

def domine(sol_a, sol_b, criteres):
    sa = sol_a["scores_criteres"]
    sb = sol_b["scores_criteres"]
    return (
        all(sb.get(c, 0) >= sa.get(c, 0) for c in criteres) and
        any(sb.get(c, 0) >  sa.get(c, 0) for c in criteres)
    )


def grille_poids(criteres, nb_points):
    n = len(criteres)
    if n == 1:
        return [{criteres[0]: 1.0}]
    if n == 2:
        return [
            {criteres[0]: round(i/nb_points, 3), criteres[1]: round(1 - i/nb_points, 3)}
            for i in range(nb_points + 1)
        ]
    # N > 2 : simplex sampling
    random.seed(42)
    grille = []
    for _ in range(nb_points):
        vals = [random.expovariate(1) for _ in range(n)]
        total = sum(vals)
        grille.append({criteres[j]: round(vals[j]/total, 4) for j in range(n)})
    # Ajouter les coins
    for j in range(n):
        grille.append({criteres[k]: (1.0 if k == j else 0.0) for k in range(n)})
    return grille


def calculer_pareto(products, budget, criteres, nb_points=30):
    toutes = []
    for poids in grille_poids(criteres, nb_points):
        res = knapsack_dp(products, budget, poids)
        toutes.append({
            "poids":           poids,
            "scores_criteres": res["scores_criteres"],
            "score_total":     res["score_total"],
            "poids_total":     res["poids_total"],
            "chosen_noms":     [p["nom"] for p in res["chosen"]],
            "nb_choisis":      len(res["chosen"]),
        })

    # Dédupliquer
    vues = set()
    uniques = []
    for sol in toutes:
        cle = tuple(sorted(sol["chosen_noms"]))
        if cle not in vues:
            vues.add(cle)
            uniques.append(sol)

    # Filtrer dominées
    front = [
        sol for sol in uniques
        if not any(domine(sol, autre, criteres) for autre in uniques if autre is not sol)
    ]
    front.sort(key=lambda s: s["scores_criteres"].get(criteres[0], 0))
    uniques.sort(key=lambda s: s["scores_criteres"].get(criteres[0], 0))
    return front, uniques


# ─────────────────────────────────────────────
#  ROUTES FLASK
# ─────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Backend opérationnel"})


@app.route("/optimize", methods=["POST"])
def optimize():
    data = request.json or {}
    errors = validate_input(data)
    if errors:
        return jsonify({"errors": errors}), 400

    criteres   = list(data["products"][0]["criteres"].keys())
    poids_bruts = data.get("poids", {c: 1 for c in criteres})
    poids      = normaliser_poids(poids_bruts)
    result     = knapsack_dp(data["products"], data["budget"], poids)

    return jsonify({
        "score_total":     result["score_total"],
        "scores_criteres": result["scores_criteres"],
        "poids_total":     result["poids_total"],
        "budget":          data["budget"],
        "chosen":          result["chosen"],
        "nb_choisis":      len(result["chosen"]),
        "poids_utilises":  poids,
        "criteres":        criteres,
        "steps":           result["steps"],
    })


@app.route("/pareto", methods=["POST"])
def pareto():
    data = request.json or {}
    errors = validate_input(data)
    if errors:
        return jsonify({"errors": errors}), 400

    criteres  = list(data["products"][0]["criteres"].keys())
    nb_points = min(int(data.get("nb_points", 30)), 100)
    front, toutes = calculer_pareto(data["products"], data["budget"], criteres, nb_points)

    return jsonify({
        "pareto_front":  front,
        "all_solutions": toutes,
        "nb_pareto":     len(front),
        "nb_solutions":  len(toutes),
        "criteres":      criteres,
    })


@app.route("/sensitivity", methods=["POST"])
def sensitivity():
    """
    Fait varier le poids d'UN critère cible de 0% à 100%.
    Les autres critères se partagent le reste équitablement.
    """
    data = request.json or {}
    errors = validate_input(data)
    if errors:
        return jsonify({"errors": errors}), 400

    criteres      = list(data["products"][0]["criteres"].keys())
    critere_cible = data.get("critere_cible", criteres[0])
    nb_points     = min(int(data.get("nb_points", 20)), 100)
    autres        = [c for c in criteres if c != critere_cible]

    resultats = []
    for i in range(nb_points + 1):
        w_cible = round(i / nb_points, 3)
        w_reste = round(1 - w_cible, 3)
        poids   = {critere_cible: w_cible}
        for c in autres:
            poids[c] = round(w_reste / len(autres), 4) if autres else 0.0

        res = knapsack_dp(data["products"], data["budget"], poids)
        resultats.append({
            "w_cible":         w_cible,
            "poids":           poids,
            "score_total":     res["score_total"],
            "scores_criteres": res["scores_criteres"],
            "chosen_noms":     [p["nom"] for p in res["chosen"]],
            "nb_choisis":      len(res["chosen"]),
        })

    return jsonify({
        "sensitivity":   resultats,
        "critere_cible": critere_cible,
        "criteres":      criteres,
        "nb_points":     len(resultats),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
