// NEXT_PUBLIC_* est injecté au build (voir Dockerfile.dashboard) — nécessaire car ce code tourne
// dans le navigateur, qui ne connaît rien du réseau Docker interne.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
