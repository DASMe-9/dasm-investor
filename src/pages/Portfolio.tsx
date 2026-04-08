import { useEffect, useState } from "react";
import { fetchSubscriptions, fetchDistributions, type Distribution } from "../lib/api";
import { ChevronDown, DollarSign, Calendar, TrendingUp } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "نشط", cls: "bg-emerald-500/20 text-emerald-400" },
    pending_signature: { label: "بانتظار التوقيع", cls: "bg-amber-500/20 text-amber-400" },
    signed_pending_funding: { label: "بانتظار التمويل", cls: "bg-blue-500/20 text-blue-400" },
    capped: { label: "وصل السقف", cls: "bg-purple-500/20 text-purple-400" },
    paused: { label: "مُعلّق", cls: "bg-slate-500/20 text-slate-400" },
    closed: { label: "مُغلق", cls: "bg-red-500/20 text-red-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-500/20 text-slate-400" };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}

function SubscriptionCard({ sub }: { sub: any }) {
  const [open, setOpen] = useState(false);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loadingDist, setLoadingDist] = useState(false);

  const metrics = sub.metrics || {};
  const progress = metrics.roi_progress_toward_cap_pct ?? 0;

  const loadDistributions = async () => {
    if (distributions.length > 0) { setOpen(!open); return; }
    setLoadingDist(true);
    const res = await fetchDistributions(sub.id);
    if (res) setDistributions(res);
    setLoadingDist(false);
    setOpen(true);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 font-mono">{sub.subscription_code}</p>
            <p className="text-lg font-bold mt-1">{fmt(metrics.principal_amount ?? sub.principal_amount)} ر.س</p>
          </div>
          <StatusBadge status={sub.status} />
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>التقدم نحو السقف</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-l from-emerald-400 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] text-slate-500">المدفوع</p>
            <p className="text-sm font-bold text-emerald-400">{fmt(metrics.paid_to_date ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] text-slate-500">السقف</p>
            <p className="text-sm font-bold">{fmt(metrics.cap_total_amount ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] text-slate-500">المتبقي</p>
            <p className="text-sm font-bold text-amber-400">{fmt(metrics.remaining_to_cap ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Distributions toggle */}
      <button onClick={loadDistributions} className="w-full border-t border-white/10 px-5 py-3 flex items-center justify-between text-sm text-slate-400 hover:bg-white/5 transition-colors">
        <span className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          سجل التوزيعات ({metrics.total_distributions_count ?? 0})
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-white/5 max-h-64 overflow-y-auto">
          {loadingDist ? (
            <div className="p-4 text-center text-slate-500 text-sm">جارٍ التحميل...</div>
          ) : distributions.length === 0 ? (
            <div className="p-4 text-center text-slate-600 text-sm">لا توجد توزيعات بعد</div>
          ) : (
            distributions.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0 hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">+{fmt(d.amount)} ر.س</p>
                    {d.description && <p className="text-[10px] text-slate-500">{d.description}</p>}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {fmtDate(d.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Portfolio() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions().then((res) => {
      const items = res?.subscriptions?.data ?? res?.data ?? [];
      setSubs(Array.isArray(items) ? items : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">المحفظة الاستثمارية</h2>
        <p className="text-sm text-slate-400">كل مراكزك الاستثمارية وتوزيعاتها</p>
      </div>

      {subs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <p className="text-slate-500">لا توجد اشتراكات استثمارية</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map((sub) => (
            <SubscriptionCard key={sub.id} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
