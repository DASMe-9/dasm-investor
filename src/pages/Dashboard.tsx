import { useEffect, useState, useRef } from "react";
import { fetchPortfolio, type PortfolioSummary } from "../lib/api";
import { getUser } from "../lib/auth";
import { Wallet, Target, BarChart3, Layers, ArrowLeft, TrendingUp, Clock, Star } from "lucide-react";
import { Link } from "wouter";

// ─── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function todayArabic() {
  return new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Count-up Hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// ─── Metric Card ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accentColor: string;
  glowColor: string;
}

function MetricCard({ title, value, sub, icon: Icon, accentColor, glowColor }: MetricCardProps) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundColor: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            boxShadow: `0 0 16px ${glowColor}20`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div
          className="w-1.5 h-1.5 rounded-full mt-1.5"
          style={{ backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
        />
      </div>
      <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
        {title}
      </p>
      <p className="text-xl font-black tracking-tight" style={{ color: "#ffffff" }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Progress Bar Section ──────────────────────────────────────────────────────

function ProgressSection({
  portfolio,
  animatedPaid,
}: {
  portfolio: PortfolioSummary;
  animatedPaid: number;
}) {
  const total = portfolio.total_principal_funded_ledger + portfolio.aggregate_remaining_to_position_caps;
  const pct = total > 0 ? (portfolio.total_paid_all_positions / total) * 100 : 0;

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-bold text-base text-white mb-1">قصة استثمارك</h3>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            رحلتك من رأس المال إلى السقف
          </p>
        </div>
        <div className="text-left">
          <div
            className="text-3xl font-black"
            style={{ color: "#10b981", fontVariantNumeric: "tabular-nums" }}
          >
            {pct.toFixed(1)}%
          </div>
          <p className="text-[10px] text-right" style={{ color: "rgba(255,255,255,0.3)" }}>
            منجز
          </p>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-3 rounded-full overflow-hidden mb-4" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        {/* Filled */}
        <div
          className="absolute top-0 right-0 h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: "linear-gradient(to left, #10b981, #34d399)",
            boxShadow: "0 0 12px rgba(16,185,129,0.6)",
          }}
        />
        {/* Glow pulse */}
        <div
          className="absolute top-0 right-0 h-full rounded-full opacity-40 animate-pulse"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: "linear-gradient(to left, #10b981, transparent)",
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        <span>{fmt(portfolio.total_paid_all_positions)} ر.س محقق</span>
        <span>السقف: {fmt(total)} ر.س</span>
      </div>

      {/* Animated paid */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{ backgroundColor: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5" style={{ color: "#10b981" }} />
          <div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              إجمالي التوزيعات المحققة
            </p>
            <p className="text-lg font-black" style={{ color: "#10b981" }}>
              {fmt(animatedPaid)} <span className="text-sm font-medium">ر.س</span>
            </p>
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.25)",
            color: "#f59e0b",
          }}
        >
          {portfolio.portfolio_realized_multiple.toFixed(2)}x
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    fetchPortfolio()
      .then((p) => setPortfolio(p))
      .finally(() => setLoading(false));
  }, []);

  const animatedPaid = useCountUp(portfolio?.total_paid_all_positions ?? 0);
  const animatedPrincipal = useCountUp(portfolio?.total_principal_funded_ledger ?? 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(16,185,129,0.3)", borderTopColor: "#10b981" }}
        />
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          جارٍ تحميل بيانات محفظتك...
        </p>
      </div>
    );
  }

  const hasData = portfolio && portfolio.positions_total_count > 0;

  return (
    <div className="space-y-6">
      {/* ── Hero Section ── */}
      <div
        className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(8,12,20,0) 60%)",
          border: "1px solid rgba(16,185,129,0.12)",
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-5 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
            transform: "translate(-30%, -30%)",
          }}
        />

        <div className="relative">
          {/* Greeting */}
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              {todayArabic()}
            </p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
            أهلاً،{" "}
            <span style={{ color: "#10b981" }}>
              {user?.first_name || "المستثمر"}
            </span>
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            15% من صافي دخل المنصة — تُوزَّع على مراكزك الاستثمارية
          </p>

          {/* Big Number */}
          {hasData ? (
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                  إجمالي رأس المال المستثمر
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-4xl sm:text-5xl font-black"
                    style={{ fontVariantNumeric: "tabular-nums", color: "#ffffff" }}
                  >
                    {fmt(animatedPrincipal)}
                  </span>
                  <span className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                    ر.س
                  </span>
                </div>
              </div>

              <div
                className="px-4 py-2 rounded-xl"
                style={{
                  backgroundColor: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                <p className="text-[10px] mb-0.5" style={{ color: "rgba(245,158,11,0.6)" }}>
                  المضاعف المحقق
                </p>
                <p className="text-2xl font-black" style={{ color: "#f59e0b" }}>
                  {portfolio!.portfolio_realized_multiple.toFixed(2)}x
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              في انتظار تفعيل مراكزك الاستثمارية
            </p>
          )}
        </div>
      </div>

      {/* ── 4 Metric Cards ── */}
      {hasData ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="إجمالي رأس المال"
              value={`${fmt(portfolio!.total_principal_funded_ledger)} ر.س`}
              sub="رأس المال الموّل فعلياً"
              icon={Wallet}
              accentColor="#3b82f6"
              glowColor="#3b82f6"
            />
            <MetricCard
              title="التوزيعات المحققة"
              value={`${fmt(portfolio!.total_paid_all_positions)} ر.س`}
              sub={`مضاعف: ${portfolio!.portfolio_realized_multiple.toFixed(2)}x`}
              icon={TrendingUp}
              accentColor="#10b981"
              glowColor="#10b981"
            />
            <MetricCard
              title="المتبقي للسقف"
              value={`${fmt(portfolio!.aggregate_remaining_to_position_caps)} ر.س`}
              sub="حتى اكتمال العوائد"
              icon={Target}
              accentColor="#f59e0b"
              glowColor="#f59e0b"
            />
            <MetricCard
              title="المراكز الاستثمارية"
              value={`${portfolio!.active_positions_count} / ${portfolio!.positions_total_count}`}
              sub={`${portfolio!.capped_positions_count} وصلت السقف`}
              icon={BarChart3}
              accentColor="#a855f7"
              glowColor="#a855f7"
            />
          </div>

          {/* ── Progress Story ── */}
          <ProgressSection portfolio={portfolio!} animatedPaid={animatedPaid} />

          {/* ── CTA to Portfolio ── */}
          <Link href="/portfolio">
            <button
              className="w-full rounded-2xl p-5 flex items-center justify-between transition-all duration-200 hover:scale-[1.01]"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(16,185,129,0.06)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(16,185,129,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <Layers className="w-5 h-5" style={{ color: "#10b981" }} />
                </div>
                <div className="text-right">
                  <p className="font-bold text-white text-sm">تفاصيل المحفظة الاستثمارية</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    عرض كل مراكزك + سجل التوزيعات الكامل
                  </p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5" style={{ color: "rgba(255,255,255,0.3)" }} />
            </button>
          </Link>
        </>
      ) : (
        /* ── Empty State ── */
        <div
          className="rounded-2xl p-12 sm:p-16 text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              backgroundColor: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.15)",
            }}
          >
            <Clock className="w-8 h-8" style={{ color: "rgba(245,158,11,0.5)" }} />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">بوابتك الاستثمارية جاهزة</h3>
          <p className="text-sm leading-relaxed max-w-md mx-auto mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            عندما يتم تفعيل مركزك الاستثماري، ستتابع هنا عوائدك اليومية من{" "}
            <span style={{ color: "#10b981", fontWeight: 600 }}>15% من صافي دخل المنصة</span>،
            مع تقارير مفصّلة لكل توزيع وكل مركز استثماري.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#10b981" }} />
              توزيعات دورية
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
              مضاعف عائد محدد
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#a855f7" }} />
              شفافية كاملة في الليدجر
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
