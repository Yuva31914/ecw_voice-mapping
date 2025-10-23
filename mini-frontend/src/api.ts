const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'

export async function checkSession() {
  const r = await fetch(`${BASE}/session`, { credentials: 'include' })
  return r.json() as Promise<{ authenticated: boolean }>
}

export function loginWithECW() {
  window.location.href = `${BASE}/login`
}

export async function logout() {
  await fetch(`${BASE}/logout`, { method: 'POST', credentials: 'include' })
  window.location.reload()
}

