/**
 * DASM Investor API Client
 */
import { getToken } from "./auth";

const BASE = import.meta.env.VITE_DASM_API_URL || "https://api.dasm.com.sa/api";

function headers(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { ...headers(), ...options?.headers },
    });

    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
      return null;
    }

    if (!res.ok) return null;

    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

// ===== Types =====

export interface InvestorSubscription {
  id: number;
  subscription_code: string;
  principal_amount: number;
  cap_multiple: number;
  currency: string;
  status: string;
  signed_at: string | null;
  activated_at: string | null;
}

export interface SubscriptionMetrics {
  principal_amount: number;
  cap_multiple: number;
  cap_total_amount: number;
  paid_to_date: number;
  remaining_to_cap: number;
  roi_progress_toward_cap_pct: number;
  realized_multiple: number;
  latest_distribution_at: string | null;
  total_distributions_count: number;
  current_status: string;
  investment_started_at: string | null;
}

export interface PortfolioSummary {
  positions_total_count: number;
  active_positions_count: number;
  capped_positions_count: number;
  total_principal_funded_ledger: number;
  total_paid_all_positions: number;
  aggregate_remaining_to_position_caps: number;
  portfolio_realized_multiple: number;
}

export interface Distribution {
  id: number;
  amount: number;
  currency: string;
  description: string | null;
  created_at: string;
}

// ===== API Functions =====

/** قائمة اشتراكات المستثمر */
export async function fetchSubscriptions(): Promise<any> {
  return request("/investor/angel-investments");
}

/** ملخص المحفظة الإجمالي */
export async function fetchPortfolio(): Promise<PortfolioSummary | null> {
  return request<PortfolioSummary>("/investor/angel-investments/statements/portfolio");
}

/** بيان مركز استثماري واحد */
export async function fetchPositionStatement(id: number): Promise<any> {
  return request(`/investor/angel-investments/${id}/statement`);
}

/** تفاصيل اشتراك */
export async function fetchSubscription(id: number): Promise<any> {
  return request(`/investor/angel-investments/${id}`);
}

/** عرض العقد */
export async function fetchContract(id: number): Promise<any> {
  return request(`/investor/angel-investments/${id}/contract`);
}

/** التوقيع على العقد */
export async function signContract(id: number, consents: { read_confirmed: boolean; accept_risk_disclosure: boolean; consent_electronic: boolean }): Promise<any> {
  return request(`/investor/angel-investments/${id}/sign`, {
    method: "POST",
    body: JSON.stringify(consents),
  });
}

/** سجل التوزيعات */
export async function fetchDistributions(id: number): Promise<Distribution[] | null> {
  return request<Distribution[]>(`/investor/angel-investments/${id}/distributions`);
}

/** سجل الليدجر */
export async function fetchLedger(id: number): Promise<any> {
  return request(`/investor/angel-investments/${id}/ledger`);
}
