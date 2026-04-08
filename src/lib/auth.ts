/**
 * DASM Investor Auth — SSO flow
 */

const TOKEN_KEY = "investor_access_token";
const USER_KEY = "investor_user";

const BASE = import.meta.env.VITE_DASM_API_URL || "https://api.dasm.com.sa/api";
const SSO_BASE = import.meta.env.VITE_DASM_SSO_URL || "https://www.dasm.com.sa";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUser(): any | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

/**
 * Redirect to DASM SSO page
 */
export function redirectToSSO(): void {
  const returnUrl = `${window.location.origin}/auth/callback`;
  window.location.href = `${SSO_BASE}/auth/sso?platform=investor&return_url=${encodeURIComponent(returnUrl)}`;
}

/**
 * Verify SSO token with backend
 */
export async function verifySSOToken(ssoToken: string): Promise<{ token: string; user: any } | null> {
  try {
    const res = await fetch(`${BASE}/sso/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sso_token: ssoToken, platform: "investor" }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.success || !json.data?.access_token) return null;

    return {
      token: json.data.access_token,
      user: json.data.user,
    };
  } catch {
    return null;
  }
}
