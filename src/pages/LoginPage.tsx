import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { loginDirect, setToken, setUser, getUser } from "../lib/auth";
import { Loader2, TrendingUp, Eye, EyeOff, Lock } from "lucide-react";

const ADMIN_TYPES   = ["admin", "super_admin"];
const INVESTOR_ROLES = ["angel_investor", "investor", "early_supporter"];

function isAuthorized(user: any): boolean {
  if (!user) return false;
  if (ADMIN_TYPES.includes(user.type)) return true;
  if (user.is_angel_investor === true) return true;
  if (user.is_early_supporter === true) return true;
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  return roles.some((r) => INVESTOR_ROLES.includes(r));
}

const BrandPanel = () => (
  <div
    className="hidden lg:flex flex-col justify-between w-1/2 p-12"
    style={{ background: "linear-gradient(145deg, #020809 0%, #040f10 50%, #051214 100%)" }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
      >
        <TrendingUp className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="font-extrabold text-white text-lg leading-none">بوابة المستثمرين</p>
        <p className="text-emerald-400 text-xs">DASM Investor Portal</p>
      </div>
    </div>

    <div className="space-y-8">
      <div className="relative w-64 h-48 mx-auto">
        <div className="absolute inset-0 rounded-3xl opacity-15" style={{ background: "radial-gradient(circle at 50% 50%, #10b981, transparent)" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 200 160" className="w-56 h-44 opacity-80">
            {[40, 70, 100, 130].map((y) => (
              <line key={y} x1="20" y1={y} x2="180" y2={y} stroke="#064e3b" strokeWidth="1" strokeDasharray="4,4" />
            ))}
            <path d="M20 130 L50 110 L80 90 L110 70 L140 50 L170 35 L180 30 L180 140 L20 140 Z" fill="url(#investGrad)" opacity="0.3" />
            <path d="M20 130 L50 110 L80 90 L110 70 L140 50 L170 35 L180 30" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <defs>
              <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[[20,130],[50,110],[80,90],[110,70],[140,50],[170,35]].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#10b981" stroke="#020809" strokeWidth="2" />
            ))}
            <path d="M160 25 L170 15 L180 25" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="round" />
            <rect x="155" y="5" width="16" height="12" rx="2" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
            <path d="M158 8 C158 6 162 4 162 8" stroke="#10b981" strokeWidth="1.5" fill="none" />
            <circle cx="162" cy="11" r="2" fill="#34d399" />
          </svg>
        </div>
      </div>

      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-extrabold text-white leading-tight">
          بوابة المستثمرين<br />
          <span className="text-emerald-400">الملائكيين</span>
        </h1>
        <p className="text-emerald-200/50 text-base leading-relaxed max-w-xs mx-auto">
          منصة سرية ومؤمَّنة لمتابعة محافظك الاستثمارية والصفقات الحصرية في منظومة داسم.
        </p>
      </div>

      <div className="space-y-3">
        {[
          { icon: "🔒", text: "وصول مقيّد للمستثمرين المعتمدين فقط" },
          { icon: "📈", text: "محفظة استثمارية ومتابعة المراحل" },
          { icon: "🤝", text: "صفقات وفرص استثمارية حصرية" },
        ].map((f) => (
          <div key={f.text} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="text-xl">{f.icon}</span>
            <span className="text-emerald-100/70 text-sm">{f.text}</span>
          </div>
        ))}
      </div>
    </div>

    <p className="text-emerald-600/30 text-xs text-center">
      DASM Investor Portal — سري وغير مفهرَس
    </p>
  </div>
);

function AccessDenied({ userType }: { userType: string }) {
  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: "linear-gradient(145deg, #020809, #051214)" }}>
      <BrandPanel />
      <div className="flex-1 flex flex-col justify-center items-center gap-5 p-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-white font-bold text-lg">وصول مقيّد</h2>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            هذه البوابة مخصصة للمستثمرين المعتمدين وفريق الإدارة فقط.<br />
            حسابك ({userType}) لا يملك الصلاحية. تواصل مع إدارة داسم.
          </p>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
          className="px-6 py-3 rounded-xl text-sm font-bold transition-transform hover:scale-[1.02]"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
        >
          تسجيل خروج
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [deniedUser, setDeniedUser] = useState<any>(null);

  if (deniedUser) return <AccessDenied userType={deniedUser.type} />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user } = await loginDirect(email, password);
      if (!isAuthorized(user)) {
        setDeniedUser(user);
        return;
      }
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "تعذّر تسجيل الدخول";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: "linear-gradient(145deg, #020809 0%, #040f10 60%, #051214 100%)" }}>
      <BrandPanel />

      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 min-h-screen">
        {/* شعار موبايل */}
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-white">بوابة المستثمرين</p>
            <p className="text-emerald-400 text-xs">DASM Investor Portal</p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-7">
          <div className="space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-1"
              style={{ background: "rgba(16,185,129,0.1)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <Lock className="w-3 h-3" />
              وصول مقيّد للمستثمرين المعتمدين
            </div>
            <h2 className="text-3xl font-extrabold text-white">تسجيل الدخول</h2>
            <p className="text-sm" style={{ color: "rgba(110,231,183,0.4)" }}>
              أدمن · سوبر أدمن · مستثمر ملائكي
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(110,231,183,0.6)" }}>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@dasm.com.sa"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-emerald-950 focus:outline-none transition"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,185,129,0.25)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.08)"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(110,231,183,0.6)" }}>
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-emerald-950 focus:outline-none transition pl-10"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,185,129,0.25)" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.08)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(110,231,183,0.4)" }}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", color: "#fca5a5" }}
              >
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: submitting ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg, #10b981, #059669)" }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحقق...</>
              ) : (
                <>دخول ←</>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <a href="https://www.dasm.com.sa" className="text-xs transition" style={{ color: "rgba(255,255,255,0.15)" }}>
              ← العودة لمنصة داسم
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
