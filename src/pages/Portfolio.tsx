import { useEffect, useState } from "react";
import { fetchSubscriptions, fetchDistributions, type Distribution } from "../lib/api";
import { ChevronDown, Calendar, TrendingUp, Clock, Layers, PenLine } from "lucide-react";
import { Link } from "wouter";

// ─── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: {
    label: "نشط",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
  },
  pending_signature: {
    label: "بانتظار التوقيع",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
  },
  signed_pending_funding: {
    label: "بانتظار التمويل",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
  },
  capped: {
    label: "وصل السقف",
    color: "#a855f7",
    bg: "rgba(168,85,247,0.1)",
    border: "rgba(168,85,247,0.25)",
  },
  paused: {
    label: "مُعلّق",
    color: "rgba(255,255,255,0.4)",
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.1)",
  },
  closed: {
    label: "مُغلق",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? {
    label: status,
    color: "rgba(255,255,255,0.4)",
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.1)",
  };
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

// ─── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({
  pct,
  size = 100,
  color = "#10b981",
}: {
  pct: number;
  size?: number;
  color?: string;
}) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="6"
      />
      {/* Progress */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
          filter: `drop-shadow(0 0 6px ${color}88)`,
        }}
      />
    </svg>
  );
}

// ─── Subscription Card ─────────────────────────────────────────────────────────

function SubscriptionCard({ sub }: { sub: any }) {
  const [open, setOpen] = useState(false);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loadingDist, setLoadingDist] = useState(false);

  // sub is already flattened: { id, subscription_code, status, metrics: {...}, ... }
  const metrics = sub.metrics || {};
  const progress: number = metrics.roi_progress_toward_cap_pct ?? sub.roi_progress_toward_cap_pct ?? 0;
  const principal: number = metrics.principal_amount ?? sub.principal_amount ?? 0;
  const paidToDate: number = metrics.paid_to_date ?? sub.paid_to_date ?? 0;
  const capTotal: number = metrics.cap_total_amount ?? sub.cap_total_amount ?? 0;
  const remainingToCap: number = metrics.remaining_to_cap ?? sub.remaining_to_cap ?? 0;
  const realizedMultiple: number = metrics.realized_multiple ?? sub.realized_multiple ?? 0;
  const distCount: number = metrics.total_distributions_count ?? 0;
  const startedAt: string | null = metrics.investment_started_at ?? sub.activated_at ?? null;
  const latestDist: string | null = metrics.latest_distribution_at ?? sub.latest_distribution_at ?? null;

  const subStatus: string = sub.status ?? "";
  const isPendingSignature = subStatus === "pending_signature";

  // Ring color based on status
  const statusColor = STATUS_MAP[subStatus]?.color ?? "#10b981";

  const loadDistributions = async () => {
    if (open) { setOpen(false); return; }
    if (distributions.length > 0) { setOpen(true); return; }
    setLoadingDist(true);
    const res = await fetchDistributions(sub.id);
    if (res) setDistributions(res);
    setLoadingDist(false);
    setOpen(true);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* ── Card Header ── */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            {/* Code */}
            <p
              className="text-[10px] font-mono mb-1.5"
              style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}
            >
              {sub.subscription_code}
            </p>
            {/* Principal */}
            <p className="text-2xl font-black text-white tracking-tight">
              {fmt(principal)}{" "}
              <span className="text-base font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
                ر.س
              </span>
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              رأس المال
            </p>
          </div>
          <StatusBadge status={subStatus} />
        </div>

        {/* ── Sign Contract CTA (pending_signature only) ── */}
        {isPendingSignature && (
          <Link href={`/contract/${sub.id}`}>
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl mb-5 font-bold text-sm transition-all duration-200 hover:scale-[1.01]"
              style={{
                backgroundColor: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                color: "#f59e0b",
                boxShadow: "0 0 16px rgba(245,158,11,0.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,158,11,0.14)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,158,11,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.25)";
              }}
            >
              <PenLine className="w-4 h-4" />
              راجع العقد ووقّعه إلكترونياً
            </button>
          </Link>
        )}

        {/* ── Ring + Numbers Layout ── */}
        <div className="flex items-center gap-6">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <ProgressRing pct={progress} size={96} color={statusColor} />
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ transform: "none" }}
            >
              <span className="text-lg font-black" style={{ color: statusColor }}>
                {progress.toFixed(0)}%
              </span>
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                منجز
              </span>
            </div>
          </div>

          {/* 3 mini stat blocks */}
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.1)" }}
            >
              <p className="text-[9px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                المدفوع
              </p>
              <p className="text-xs font-black" style={{ color: "#10b981" }}>
                {fmt(paidToDate)}
              </p>
              <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                ر.س
              </p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-[9px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                السقف
              </p>
              <p className="text-xs font-black text-white">
                {fmt(capTotal)}
              </p>
              <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                ر.س
              </p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.1)" }}
            >
              <p className="text-[9px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                المتبقي
              </p>
              <p className="text-xs font-black" style={{ color: "#f59e0b" }}>
                {fmt(remainingToCap)}
              </p>
              <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                ر.س
              </p>
            </div>
          </div>
        </div>

        {/* ── Bottom row: multiple + dates ── */}
        <div
          className="mt-5 pt-4 flex flex-wrap items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Realized multiple */}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              المضاعف المحقق:
            </span>
            <span
              className="text-sm font-black"
              style={{ color: "#f59e0b" }}
            >
              {realizedMultiple.toFixed(2)}x
            </span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4">
            {startedAt && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Calendar className="w-3 h-3" />
                <span>بدأ: {fmtDate(startedAt)}</span>
              </div>
            )}
            {latestDist && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Clock className="w-3 h-3" />
                <span>آخر توزيع: {fmtDate(latestDist)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Distributions Accordion Toggle ── */}
      <button
        onClick={loadDistributions}
        className="w-full flex items-center justify-between px-6 py-3.5 transition-all duration-200"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.45)",
          backgroundColor: open ? "rgba(255,255,255,0.02)" : "transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.04)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = open ? "rgba(255,255,255,0.02)" : "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
        }}
      >
        <div className="flex items-center gap-2 text-sm">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "rgba(16,185,129,0.12)" }}
          >
            <TrendingUp className="w-3 h-3" style={{ color: "#10b981" }} />
          </div>
          سجل التوزيعات
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: "rgba(16,185,129,0.1)",
              color: "#10b981",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            {distCount}
          </span>
        </div>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* ── Distribution Timeline ── */}
      {open && (
        <div
          className="max-h-72 overflow-y-auto"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          {loadingDist ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "#10b981" }}
              />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                جارٍ تحميل التوزيعات...
              </span>
            </div>
          ) : distributions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                لا توجد توزيعات مسجّلة بعد
              </p>
            </div>
          ) : (
            <div className="relative px-6 py-4">
              {/* Timeline line */}
              <div
                className="absolute right-[3.25rem] top-4 bottom-4 w-px"
                style={{ backgroundColor: "rgba(16,185,129,0.12)" }}
              />

              {distributions.map((d, idx) => (
                <div key={d.id} className="relative flex items-start gap-4 mb-4 last:mb-0">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 relative z-10">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: idx === 0 ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${idx === 0 ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <TrendingUp
                        className="w-3 h-3"
                        style={{ color: idx === 0 ? "#10b981" : "rgba(255,255,255,0.3)" }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex items-start justify-between gap-2 pb-4 border-b border-white/[0.04] last:border-0">
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: idx === 0 ? "#10b981" : "rgba(255,255,255,0.7)" }}
                      >
                        +{fmt(d.amount)}{" "}
                        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {d.currency || "SAR"}
                        </span>
                      </p>
                      {d.description && (
                        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {d.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
                      <Calendar className="w-3 h-3" />
                      {fmtDate(d.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Portfolio Page ────────────────────────────────────────────────────────────

export default function Portfolio() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions()
      .then((res) => {
        // API returns: { portfolio_summary, positions: { data: [...], ... } }
        // Each item: { position: {...}, subscription: {...}, metrics: {...} }
        const rawItems: any[] = res?.positions?.data ?? [];
        const mapped = rawItems.map((item: any) => {
          const pos = item.position ?? {};
          const sub = item.subscription ?? {};
          return {
            // Primary key for distribution API calls
            id: sub.id ?? pos.subscription_id,
            subscription_code: pos.subscription_code ?? sub.subscription_code,
            status: pos.status ?? sub.status,
            principal_amount: pos.principal_amount ?? parseFloat(sub.principal_amount) ?? 0,
            paid_to_date: pos.paid_to_date ?? 0,
            cap_total_amount: pos.cap_total_amount ?? 0,
            remaining_to_cap: pos.remaining_to_cap ?? 0,
            roi_progress_toward_cap_pct: pos.roi_progress_toward_cap_pct ?? 0,
            realized_multiple: pos.realized_multiple ?? 0,
            latest_distribution_at: pos.latest_distribution_at ?? null,
            currency: pos.currency ?? sub.currency ?? "SAR",
            activated_at: sub.activated_at ?? null,
            // Nested for additional access
            metrics: item.metrics ?? {},
            subscription: sub,
            position: pos,
          };
        });
        setSubs(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "#10b981" }}
        />
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          جارٍ تحميل محفظتك...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.2)",
          }}
        >
          <Layers className="w-5 h-5" style={{ color: "#a855f7" }} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">المحفظة الاستثمارية</h2>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {subs.length > 0
              ? `${subs.length} مركز استثماري — انقر على أي بطاقة لعرض سجل التوزيعات`
              : "لا توجد مراكز استثمارية حالياً"}
          </p>
        </div>
      </div>

      {subs.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}
          >
            <Layers className="w-7 h-7" style={{ color: "rgba(168,85,247,0.5)" }} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">لا توجد اشتراكات استثمارية</h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            عند تفعيل مراكزك الاستثمارية ستظهر هنا مع تفاصيلها الكاملة.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {subs.map((sub) => (
            <SubscriptionCard key={sub.id} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
