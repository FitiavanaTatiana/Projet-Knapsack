// src/api/knapsack.js — couche API dynamique

const BASE_URL = "http://127.0.0.1:5000";

async function post(route, body) {
  const res = await fetch(`${BASE_URL}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.join(" | ") || "Erreur serveur");
  return data;
}

// products : [{nom, prix, criteres: {c1: v, c2: v, ...}}]
// poids    : {c1: w1, c2: w2, ...}
export const optimize    = (body) => post("/optimize", body);
export const pareto      = (body) => post("/pareto", body);
export const sensitivity = (body) => post("/sensitivity", body);
