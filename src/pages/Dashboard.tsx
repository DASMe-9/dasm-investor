import { useEffect, useState } from "react";
import { fetchPortfolio, type PortfolioSummary } from "../lib/api";
import { getUser } from "../lib/auth";
import { TrendingUp, Wallet, Target, BarChart3, Clock, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

function fmt(n: number) {
  return new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function StatCard({ title, value, sub, icon: Icon, color }: { title: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    fetchPortfolio().then((p) => {
      setPortfolio(p);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // لو الموديول معطّل أو ما في بيانات — نعرض placeholder
  const hasData = portfolio && portfolio.positions_total_count > 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-l from-emerald-600/20 to-transparent border border-emerald-500/20 p-6">
        <h2 className="text-xl font-bold mb-1">أهلاً {user?.first_name || "بالمستثمر"}</h2>
        <p className="text-sm text-slate-400">تابع استثمارك اليومي في منصة داسم — 15% من صافي الدخل</p>
      </div>

      {hasData ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="إجمالي المستثمر"
              value={`${fmt(portfolio!.total_principal_funded_ledger)} ر.س`}
              icon={Wallet}
              color="bg-blue-500/20 text-blue-400"
            />
            <StatCard
              title="إجمالي التوزيعات"
              value={`${fmt(portfolio!.total_paid_all_positions)} ر.س`}
              sub={`مضاعف محقق: ${portfolio!.portfolio_realized_multiple.toFixed(2)}x`}
              icon={TrendingUp}
              color="bg-emerald-500/20 text-emerald-400"
            />
            <StatCard
              title="المتبقي للسقف"
              value={`${fmt(portfolio!.aggregate_remaining_to_position_caps)} ر.س`}
              icon={Target}
              color="bg-amber-500/20 text-amber-400"
            />
            <StatCard
              title="المراكز النشطة"
              value={`${portfolio!.active_positions_count}`}
              sub={`من ${portfolio!.positions_total_count} إجمالي`}
              icon={BarChart3}
              color="bg-purple-500/20 text-purple-400"
            />
          </div>

          {/* Quick link */}
          <Link href="/portfolio">
            <button className="w-full rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span className="font-medium">عرض تفاصيل المحفظة والتوزيعات</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
          </Link>
        </>
      ) : (
        /* Placeholder — module not active or no positions */
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-300 mb-2">لا توجد استثمارات نشطة حالياً</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            عندما يتم تفعيل حسابك الاستثماري، ستظهر هنا تفاصيل استثمارك وعوائدك اليومية من 15% من صافي دخل المنصة.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-600 text-center leading-relaxed max-w-2xl mx-auto">
        الأرقام المعروضة هي توزيعات مسجّلة فعلياً وليست التزاماً مستقبلياً.
        السقف يُطبَّق على مستوى كل اشتراك على حدة.
        لا يُعتبر هذا قرضاً أو وديعة مصرفية — لا يوجد ضمان لرأس المال أو لأي عائد.
      </p>
    </div>
  );
}

function Briefcase(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>
    </svg>
  );
}
