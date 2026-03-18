from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
def knapsack(products, budget):
    n = len(products)
    dp = [[0]*(budget+1) for _ in range(n+1)]
    steps = []  # stocker des étapes dp[i,w]


    for i in range(1, n+1):#donné via input front prix, budget max et valeur(importance produit)
        price = products[i-1]['prix']
        value = products[i-1]['importance']

        for w in range(budget+1):
            if price <= w:
                dp[i][w] = max(dp[i-1][w],
                               dp[i-1][w-price] + value)
                
            else:
                dp[i][w] = dp[i-1][w]
            steps.append({
                "i": i,
                "w": w,
                "value": dp[i][w]
            })
            # print(steps)

    # retrouver les produits choisis
    w = budget
    chosen = []
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i-1][w]:
            chosen.append(products[i-1]['nom'])
            w -= products[i-1]['prix']

    return dp[n][budget], chosen[::-1], steps

@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.json
    products = data['products']
    budget = data['budget']

    dp, chosen, steps= knapsack(products, budget)

    return jsonify({
        "dp": dp,
        "steps":steps,
        "chosen": chosen,
        # "score": dp[len(products)][budget]
    })

if __name__ == '__main__':
    app.run(debug=True)
# Test
# products = [
#     {"nom":"A","prix":1,"importance":10},
#     {"nom":"B","prix":8,"importance":15},
#     {"nom":"C","prix":3,"importance":7},
#     {"nom":"D","prix":7,"importance":12}
# ]
# budget = 5

# score, selected, steps = knapsack(products, budget)
# print("Score max:", score)
# print("Produits choisis:", selected)