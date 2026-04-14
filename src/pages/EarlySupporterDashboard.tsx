import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import {
  fetchEarlySupporterParticipation,
  fetchEarlySupporterDistributions,
  fetchEarlySupporterContributions,
} from "../lib/api";
import type {
  EarlySupporterParticipation,
  EarlySupporterMetrics,
  EarlySupporterDistributionRow,
  EarlySupporterContributionRow,
} from "../lib/api";
import {
  Heart, TrendingUp, Wallet, Target, Zap, Trophy,
  ChevronLeft, ChevronDown, Calendar, Loader2,
  AlertTriangle, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, Clock, BarChart3,
} from "lucide-react";

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(n: number | string) {
  return new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(typeof n === "string" ? parseFloat(n) : n);
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Count-up ─────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200): number {
  const [v, setV] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) { setV(0); return; }
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      setV((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return v;
}

// ─── Stage Progress Bar ───────────────────────────────────────────────────────

function StageBar({ metrics }: { metrics: EarlySupporterMetrics }) {
  const dist = parseFloat(metrics.total_distributions_received);
  const s1   = parseFloat(metrics.stage_1_target);
  const s2   = parseFloat(metrics.stage_2_target);
  const s3   = parseFloat(metrics.stage_3_target);
  const cap  = s3;

  const pct1 = cap > 0 ? Math.min((Math.min(dist, s1) / cap) * 100, 33.33) : 0;
  const pct2 = cap > 0 ? Math.min((Math.max(0, Math.min(dist, s2) - s1) / cap) * 100, 33.33) : 0;
  const pct3 = cap > 0 ? Math.min((Math.max(0, dist - s2) / cap) * 100, 33.33) : 0;

  const stages = [
    { label: "المرحلة 1", rate: "100%", color: "#10b981", pct: pct1, target: s1, desc: "حتى 2×" },
    { label: "المرحلة 2", rate: "50%",  color: "#f59e0b", pct: pct2, target: s2, desc: "حتى 3×" },
    { label: "المرحلة 3", rate: "25%",  color: "#a78bfa", pct: pct3, target: s3, desc: "حتى 4×" },
  ];

  return (
    <div className="space-y-4">
      {/* Track */}
      <div className="relative">
        <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          {stages.map((s, i) => (
            <div
              key={i}
              className="h-full transition-all duration-1000"
              style={{
                width: `${s.pct}%`,
                backgroundColor: s.color,
                boxShadow: s.pct > 0 ? `0 0 8px ${s.color}88` : "none",
              }}
            />
          ))}
        </div>
        {/* Stage separators */}
        {[33.33, 66.66].map((p) => (
          <div
            key={p}
            className="absolute top-0 h-full w-px"
            style={{ left: `${p}%`, backgroundColor: "rgba(255,255,255,0.15)" }}
          />
        ))}
      </div>

      {/* Stage labels */}
      <div className="grid grid-cols-3 gap-2">
        {stages.map((s, i) => {
          const isActive = metrics.current_stage === i + 1;
          const isDone = metrics.current_stage > i + 1 || metrics.roi_progress_pct >= 100;
          return (
            <div
              key={i}
              className="rounded-xl p-3 text-center transition-all"
              style={{
                backgroundColor: isActive ? `${s.color}12` : "rgba(255,255,255,0.025)",
                border: `1px solid ${isActive ? s.color + "30" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {isDone && !isActive ? (
                  <CheckCircle2 className="w-3 h-3" style={{ color: s.color }} />
                ) : isActive ? (
                  <Zap className="w-3 h-3" style={{ color: s.color }} />
                ) : (
                  <Clock className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                )}
                <span className="text-[10px] font-bold" style={{ color: isActive ? s.color : "rgba(255,255,255,0.35)" }}>
                  {s.label}
                </span>
              </div>
              <p className="text-base font-black" style={{ color: isActive ? s.color : "rgba(255,255,255,0.3)" }}>
                {s.rate}
              </p>
              <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{s.desc}</p>
              <p className="text-[9px] mt-1 font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
                حتى {fmt(s.target)} ر.س
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Activation Threshold Banner ──────────────────────────────────────────────

function ActivationBanner({ metrics }: { metrics: EarlySupporterMetrics }) {
  if (metrics.tier !== "small" || metrics.activation_threshold_reached) return null;

  const paid = parseFloat(metrics.total_paid_in);
  const threshold = parseFloat(metrics.activation_threshold);
  const pct = threshold > 0 ? Math.min((paid / threshold) * 100, 100) : 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Clock className="w-5 h-5 flex-shrink-0" style={{ color: "#f59e0b" }} />
        <div>
          <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>عتبة التفعيل لم تُبلَغ بعد</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            التوزيعات تبدأ بعد بلوغ {fmt(threshold)} ر.س تراكمياً
          </p>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: "#f59e0b", boxShadow: "0 0 8px rgba(245,158,11,0.5)" }}
        />
      </div>
      <div className="flex justify-between text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
        <span>{fmt(paid)} ر.س مدفوع</span>
        <span>{pct.toFixed(1)}% من العتبة</span>
        <span>{fmt(threshold)} ر.س المطلوب</span>
      </div>
    </div>
  );
}

// ─── Distributions Timeline ───────────────────────────────────────────────────

function DistributionsSection({ participationId }: { participationId: number }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<EarlySupporterDistributionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    if (rows.length > 0) { setOpen(true); return; }
    setLoading(true);
    const data = await fetchEarlySupporterDistributions(participationId);
    setRows(data);
    setLoading(false);
    setOpen(true);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 transition-all"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(16,185,129,0.1)" }}>
            <ArrowDownLeft className="w-4 h-4" style={{ color: "#10b981" }} />
          </div>
          <span className="text-sm font-bold text-white">التوزيعات المستلمة</span>
        </div>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div className="max-h-72 overflow-y-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#10b981" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>جارٍ التحميل...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              لا توجد توزيعات مسجّلة بعد
            </div>
          ) : (
            <div className="px-5 py-3 space-y-3">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(16,185,129,0.1)" }}>
                      <TrendingUp className="w-3 h-3" style={{ color: "#10b981" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#10b981" }}>+{fmt(r.amount)} ر.س</p>
                      {r.description && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{r.description}</p>}
                      {r.period_label && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{r.period_label}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                    <Calendar className="w-3 h-3" />
                    {fmtDate(r.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Contributions Timeline ───────────────────────────────────────────────────

function ContributionsSection({ participationId }: { participationId: number }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<EarlySupporterContributionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    if (rows.length > 0) { setOpen(true); return; }
    setLoading(true);
    const data = await fetchEarlySupporterContributions(participationId);
    setRows(data);
    setLoading(false);
    setOpen(true);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 transition-all"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(59,130,246,0.1)" }}>
            <ArrowUpRight className="w-4 h-4" style={{ color: "#3b82f6" }} />
          </div>
          <span className="text-sm font-bold text-white">سجل المساهمات الشهرية</span>
        </div>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div className="max-h-64 overflow-y-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#3b82f6" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>جارٍ التحميل...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              لا توجد مساهمات مسجّلة بعد
            </div>
          ) : (
            <div className="px-5 py-3 space-y-3">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(59,130,246,0.1)" }}>
                      <Wallet className="w-3 h-3" style={{ color: "#3b82f6" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#3b82f6" }}>{fmt(r.amount)} ر.س</p>
                      {r.period_label && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{r.period_label}</p>}
                      {r.notes && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{r.notes}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                    <Calendar className="w-3 h-3" />
                    {fmtDate(r.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function EarlySupporterDashboard() {
  const params = useParams<{ id: string }>();
  const participationId = parseInt(params.id ?? "0", 10);

  const [participation, setParticipation] = useState<EarlySupporterParticipation | null>(null);
  const [metrics, setMetrics] = useState<EarlySupporterMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!participationId) { setError("معرّف غير صالح"); setLoading(false); return; }

    fetchEarlySupporterParticipation(participationId)
      .then((res: any) => {
        if (!res) { setError("تعذّر تحميل البيانات."); return; }
        setParticipation(res as EarlySupporterParticipation);
        if (res.metrics) setMetrics(res.metrics as EarlySupporterMetrics);
      })
      .catch(() => setError("خطأ في الاتصال بالخادم."))
      .finally(() => setLoading(false));
  }, [participationId]);

  // Animated values
  const animDist = useCountUp(metrics ? parseFloat(metrics.total_distributions_received) : 0);
  const animPaid = useCountUp(metrics ? parseFloat(metrics.total_paid_in) : 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#10b981" }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>جارٍ تحميل الداشبورد...</p>
      </div>
    );
  }

  if (error || !participation || !metrics) {
    return (
      <div className="rounded-2xl p-12 text-center max-w-lg mx-auto mt-16"
        style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: "#ef4444" }} />
        <h2 className="text-lg font-bold text-white mb-2">تعذّر التحميل</h2>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>{error || "البيانات غير متوفرة."}</p>
        <Link href="/early-supporter">
          <button className="px-6 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
            العودة للقائمة
          </button>
        </Link>
      </div>
    );
  }

  const isSmall = participation.tier === "small";
  const tierColor  = isSmall ? "#10b981" : "#a78bfa";
  const tierBorder = isSmall ? "rgba(16,185,129,0.2)" : "rgba(167,139,250,0.2)";
  const isCapped   = metrics.roi_progress_pct >= 100;

  const stageColors: Record<number, string> = { 1: "#10b981", 2: "#f59e0b", 3: "#a78bfa" };
  const currentColor = stageColors[metrics.current_stage] ?? "#10b981";

  return (
    <div className="space-y-6 pb-16" dir="rtl">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
        <Link href="/early-supporter">
          <button className="hover:text-white transition-colors">أصدقاء الدعم المبكر</button>
        </Link>
        <span>/</span>
        <span style={{ color: "rgba(255,255,255,0.6)" }}>داشبورد المشاركة</span>
      </div>

      {/* ── Hero ── */}
      <div
        className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${tierColor}12 0%, rgba(8,12,20,0) 60%)`,
          border: `1px solid ${tierBorder}`,
        }}
      >
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-5 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${tierColor} 0%, transparent 70%)`, transform: "translate(-30%,-30%)" }} />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4" style={{ color: tierColor }} />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: tierColor, backgroundColor: `${tierColor}18`, border: `1px solid ${tierColor}30` }}>
              {participation.tier_label}
            </span>
            <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
              {participation.participation_code}
            </span>
          </div>

          <h2 className="text-3xl font-black text-white mb-1">
            <span style={{ color: tierColor }}>{fmt(animDist)}</span>
            <span className="text-lg font-bold mr-2" style={{ color: "rgba(255,255,255,0.4)" }}>ر.س</span>
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            إجمالي التوزيعات المستلمة
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "إجمالي المساهمات", value: `${fmt(animPaid)} ر.س`, color: "#3b82f6", icon: Wallet },
              { label: "المضاعف المحقق", value: `${parseFloat(metrics.realized_multiple).toFixed(2)}x`, color: "#f59e0b", icon: TrendingUp },
              { label: "المرحلة الحالية", value: `${metrics.current_stage} / 3`, color: currentColor, icon: BarChart3 },
              { label: "المتبقي للسقف", value: `${fmt(metrics.remaining_to_cap)} ر.س`, color: "#a855f7", icon: Target },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3"
                style={{ backgroundColor: `${s.color}0d`, border: `1px solid ${s.color}20` }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
                </div>
                <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Activation threshold (small tier) ── */}
      <ActivationBanner metrics={metrics} />

      {/* ── Stage Progress ── */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-black text-white mb-1">مراحل عائد الدعم</h3>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              كلما تراكمت المساهمات، يتناقص معدل التوزيع تدريجياً حتى السقف 4×
            </p>
          </div>
          <div className="text-left">
            <p className="text-3xl font-black" style={{ color: currentColor }}>
              {metrics.roi_progress_pct.toFixed(1)}%
            </p>
            <p className="text-[10px] text-right" style={{ color: "rgba(255,255,255,0.3)" }}>نحو السقف</p>
          </div>
        </div>

        <StageBar metrics={metrics} />

        {/* Current stage summary */}
        {!isCapped ? (
          <div
            className="mt-4 rounded-xl p-4 flex items-center justify-between"
            style={{ backgroundColor: `${currentColor}0d`, border: `1px solid ${currentColor}25` }}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5" style={{ color: currentColor }} />
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  معدل التوزيع الحالي
                </p>
                <p className="text-xl font-black" style={{ color: currentColor }}>
                  {metrics.current_rate_pct}%
                  <span className="text-xs font-normal mr-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                    من نصيبك في الإيرادات
                  </span>
                </p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>حتى نهاية المرحلة</p>
              <p className="text-sm font-bold" style={{ color: currentColor }}>
                {fmt(metrics.remaining_to_next_stage)} ر.س
              </p>
            </div>
          </div>
        ) : (
          <div
            className="mt-4 rounded-xl p-4 flex items-center gap-3"
            style={{ backgroundColor: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}
          >
            <Trophy className="w-5 h-5" style={{ color: "#a78bfa" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#a78bfa" }}>اكتملت حقوق التوزيع (4×)</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                لقد استلمت كامل العائد المستحق وفق شروط البرنامج.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Monthly commitment info ── */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between"
        style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>الالتزام الشهري المتفق عليه</p>
          <p className="text-2xl font-black text-white">
            {fmt(metrics.monthly_commitment)}
            <span className="text-sm font-medium mr-1" style={{ color: "rgba(255,255,255,0.4)" }}>ر.س / شهر</span>
          </p>
        </div>
        <div className="text-left">
          <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>إجمالي {metrics.contributions_count} دفعة مسجّلة</p>
          {metrics.latest_contribution_at && (
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              آخر دفعة: {fmtDate(metrics.latest_contribution_at)}
            </p>
          )}
        </div>
      </div>

      {/* ── Transactions ── */}
      <DistributionsSection participationId={participationId} />
      <ContributionsSection participationId={participationId} />

      {/* ── Actions ── */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link href={`/early-supporter/${participationId}/contract`}>
          <button
            className="w-full rounded-2xl p-4 flex items-center justify-between transition-all"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span className="text-sm font-bold text-white">عرض العقد</span>
            <ChevronLeft className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        </Link>
        <Link href="/early-supporter">
          <button
            className="w-full rounded-2xl p-4 flex items-center justify-between transition-all"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span className="text-sm font-bold text-white">كل المشاركات</span>
            <ChevronLeft className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        </Link>
      </div>
    </div>
  );
}
