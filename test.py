import requests
import json

# ✅ Données de test
data = {
    "products": [
        {"nom": "A", "prix": 1, "importance": 10},
        {"nom": "B", "prix": 8, "importance": 15},
        {"nom": "C", "prix": 3, "importance": 7},
        {"nom": "D", "prix": 7, "importance": 12},
        {"nom": "E", "prix": 2, "importance": 5},
        {"nom": "F", "prix": 4, "importance": 9}
    ],
    "budget": 5
}

# URL de ton backend
url = "http://127.0.0.1:5000/optimize"

# Envoyer la requête POST
response = requests.post(url, json=data)

# Vérifier la réponse
if response.status_code == 200:
    result = response.json()
    print("💥 Score max:", result["dp"])
    print("✅ Produits choisis:",  result["chosen"])

    # # Affichage du DP final
    # print("\n🟢 Tableau DP final:")
    # for row in result["dp"]:
    #     print(row)

    # # Affichage des 5 premières étapes (pour vérifier steps)
    print("\n🔹 5 premières étapes:")
    for step in result["steps"]:
        print(step)
else:
    print("Erreur:", response.status_code)