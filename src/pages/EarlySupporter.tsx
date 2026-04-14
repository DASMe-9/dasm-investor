import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchEarlySupporterParticipations } from "../lib/api";
import type { EarlySupporterParticipation } from "../lib/api";
import {
  Heart,
  CheckCircle2,
  Clock,
  Zap,
  XCircle,
  Trophy,
  Loader2,
  AlertTriangle,
  PenLine,
  BarChart3,
} from "lucide-react";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.FC<any> }> = {
  pending_signature: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: PenLine },
  signed:           { color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)", icon: CheckCircle2 },
  active:           { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", icon: Zap },
  capped:           { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)", icon: Trophy },
  closed:           { color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", icon: XCircle },
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.closed;
  const Icon = cfg.icon;
  return (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Participation Card ───────────────────────────────────────────────────────

function ParticipationCard({ p }: { p: EarlySupporterParticipation }) {
  const isSmall = p.tier === "small";
  const accentColor = isSmall ? "#10b981" : "#a78bfa";
  const accentBg    = isSmall ? "rgba(16,185,129,0.08)" : "rgba(167,139,250,0.08)";
  const accentBorder = isSmall ? "rgba(16,185,129,0.15)" : "rgba(167,139,250,0.15)";

  return (
    <div
      className="rounded-2xl p-5 space-y-4 transition-all duration-200 hover:scale-[1.01]"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${accentBorder}` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: accentBg, border: `1px solid ${accentBorder}` }}
          >
            <Heart className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{p.tier_label}</p>
            <p className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
              {p.participation_code}
            </p>
          </div>
        </div>
        <StatusBadge status={p.status} label={p.status_label} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>الالتزام الشهري</p>
          <p className="text-base font-black" style={{ color: accentColor }}>
            {parseFloat(p.monthly_commitment).toLocaleString("ar-SA")} <span className="text-xs font-medium">ر.س</span>
          </p>
        </div>
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>رقم العقد</p>
          <p className="text-sm font-mono font-bold text-white">
            {p.contract?.contract_number ?? "—"}
          </p>
        </div>
      </div>

      {/* Dates */}
      {(p.signed_at || p.activated_at) && (
        <div className="flex gap-4 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          {p.signed_at && (
            <span>
              وُقِّع:{" "}
              <span className="text-white/50">{new Date(p.signed_at).toLocaleDateString("ar-SA")}</span>
            </span>
          )}
          {p.activated_at && (
            <span>
              فُعِّل:{" "}
              <span className="text-white/50">{new Date(p.activated_at).toLocaleDateString("ar-SA")}</span>
            </span>
          )}
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-2">
        <Link href={`/early-supporter/${p.id}`} className="flex-1">
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            style={{ backgroundColor: accentBg, border: `1px solid ${accentBorder}`, color: accentColor }}
          >
            <BarChart3 className="w-4 h-4" />
            الداشبورد
          </button>
        </Link>
        {p.can_sign && (
          <Link href={`/early-supporter/${p.id}/contract`}>
            <button
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}
            >
              <PenLine className="w-4 h-4" />
              وقّع
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-14 text-center"
      style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}
      >
        <Heart className="w-8 h-8" style={{ color: "#10b981" }} />
      </div>
      <h3 className="text-lg font-black text-white mb-2">لا توجد مشاركات بعد</h3>
      <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
        لم تنضم بعد إلى برنامج أصدقاء الدعم المبكر. تواصل مع إدارة داسم لمزيد من المعلومات.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EarlySupporter() {
  const [data, setData] = useState<{ is_early_supporter: boolean; participations: EarlySupporterParticipation[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarlySupporterParticipations()
      .then((res) => {
        if (!res) setError("تعذّر تحميل البيانات. يُرجى التحقق من الاتصال.");
        else setData(res);
      })
      .catch(() => setError("خطأ في الاتصال بالخادم."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#10b981" }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>جارٍ التحميل...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl p-12 text-center max-w-lg mx-auto mt-16"
        style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
      >
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: "#ef4444" }} />
        <h2 className="text-lg font-bold text-white mb-2">تعذّر التحميل</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{error}</p>
      </div>
    );
  }

  const participations = data?.participations ?? [];
  const pendingCount  = participations.filter((p) => p.status === "pending_signature").length;
  const activeCount   = participations.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(167,139,250,0.15) 100%)",
                border: "1px solid rgba(16,185,129,0.25)",
              }}
            >
              <Heart className="w-5 h-5" style={{ color: "#10b981" }} />
            </div>
            <h1 className="text-2xl font-black text-white">أصدقاء الدعم المبكر</h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            مشاركاتك في برنامج دعم منصة داسم مقابل حقوق توزيع مستقبلية
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-3">
          {pendingCount > 0 && (
            <div
              className="rounded-xl px-4 py-2 text-center"
              style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <p className="text-lg font-black" style={{ color: "#f59e0b" }}>{pendingCount}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>بانتظار التوقيع</p>
            </div>
          )}
          {activeCount > 0 && (
            <div
              className="rounded-xl px-4 py-2 text-center"
              style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <p className="text-lg font-black" style={{ color: "#10b981" }}>{activeCount}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>نشط</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending signature banner */}
      {pendingCount > 0 && (
        <div
          className="rounded-2xl px-6 py-4 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.04) 100%)",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <Clock className="w-5 h-5 flex-shrink-0" style={{ color: "#f59e0b" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>
              يوجد {pendingCount} {pendingCount === 1 ? "عقد يحتاج" : "عقود تحتاج"} لتوقيعك
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              يُرجى مراجعة العقود وإتمام التوقيع الإلكتروني
            </p>
          </div>
        </div>
      )}

      {/* Cards */}
      {participations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {participations.map((p) => (
            <ParticipationCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {/* Info section */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <h3 className="text-sm font-bold text-white mb-4">كيف يعمل البرنامج؟</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          <div className="space-y-2">
            <p className="font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>شريحة الأصدقاء (صغار)</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>التزام شهري يقل عن 100,000 ر.س تراكمياً</li>
              <li>15% من إجمالي إيرادات داسم (بعد عتبة 150K)</li>
              <li>سقف: حتى 4× من إجمالي ما دفعته</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>شريحة كبار الأصدقاء (ملائكة)</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>تراكمي ≥ 100,000 ر.س</li>
              <li>نسبة من صافي الأرباح المحددة تعاقدياً</li>
              <li>تناقصية: 100% → 50% → 25% حتى السقف</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
