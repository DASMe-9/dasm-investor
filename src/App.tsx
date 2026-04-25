import { Route, Switch, useLocation, Redirect } from "wouter";
import { useEffect, useState } from "react";
import { setToken, setUser, verifySSOToken, redirectToSSO, isLoggedIn, clearAuth, getUser } from "./lib/auth";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Contract from "./pages/Contract";
import EarlySupporter from "./pages/EarlySupporter";
import EarlySupporterContract from "./pages/EarlySupporterContract";
import EarlySupporterDashboard from "./pages/EarlySupporterDashboard";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import TalkGlobalContext from "./components/TalkGlobalContext";
import { ShieldX, LogOut, TrendingUp, Lock } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  Access-control rules (مركزية — لا تغيّر بدون مراجعة الأمن)
//
//  المسموح لهم بالوصول:
//  1. admin / super_admin                — إشراف وتدقيق داخلي
//  2. أدوار Spatie: angel_investor / investor / early_supporter
//  3. علامة is_angel_investor=true       — للمستثمرين المنوحين مباشرة
//
//  ممنوع صراحةً: أي مستخدم عادي، حتى لو لديه اشتراك.
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_TYPES = ["admin", "super_admin"];
const INVESTOR_ROLES = ["angel_investor", "investor", "early_supporter"];

function isAuthorized(user: any): boolean {
  if (!user) return false;
  if (ADMIN_TYPES.includes(user.type)) return true;
  if (user.is_angel_investor === true) return true;
  if (user.is_early_supporter === true) return true;
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  return roles.some((r) => INVESTOR_ROLES.includes(r));
}

// ─────────────────────────────────────────────────────────────────────────────
//  SSO Callback
// ─────────────────────────────────────────────────────────────────────────────
function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("sso_token");
    const ssoError = params.get("sso_error");

    if (ssoError) { setError("تم إلغاء تسجيل الدخول"); return; }
    if (!ssoToken) { setError("رمز الدخول غير صالح"); return; }

    verifySSOToken(ssoToken).then((result) => {
      if (result) {
        setToken(result.token);
        setUser(result.user);
        setLocation("/");
      } else {
        setError("فشل التحقق — تأكد من صلاحية الجلسة");
      }
    });
  }, [setLocation]);

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        dir="rtl"
        style={{ background: "linear-gradient(145deg, #020809 0%, #040f10 60%, #051214 100%)" }}
      >
        <div
          className="rounded-2xl p-8 max-w-sm w-full text-center space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(52,211,153,0.15)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)" }}
          >
            <ShieldX className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-red-400 font-bold">{error}</p>
          <button
            onClick={() => redirectToSSO()}
            className="w-full px-6 py-3 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#ecfdf5" }}
          >
            إعادة تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "linear-gradient(145deg, #020809 0%, #040f10 60%, #051214 100%)" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
      >
        <TrendingUp className="w-7 h-7 text-emerald-400" />
      </div>
      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      <p className="text-emerald-400/60 text-sm">جارٍ التحقق من الهوية...</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Access Denied — لا تكشف عن وجود المنصة لمن ليس له صلاحية
// ─────────────────────────────────────────────────────────────────────────────
function AccessDenied() {
  const user = getUser();
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      dir="rtl"
      style={{ background: "linear-gradient(145deg, #020809 0%, #040f10 60%, #051214 100%)" }}
    >
      <div
        className="rounded-2xl p-8 max-w-md w-full text-center space-y-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          <Lock className="w-8 h-8 text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">وصول مقيّد</h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
            هذه البوابة مخصصة للمستثمرين المعتمدين وفريق الإدارة فقط.
            إذا كنت مستثمراً ولم تتمكن من الوصول،
            تواصل مع إدارة داسم لمنحك الصلاحية.
          </p>
          {user?.first_name && (
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
              مسجل دخول كـ: {user.first_name} {user.last_name}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <a
            href="https://www.dasm.com.sa"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "#eff6ff" }}
          >
            العودة لمنصة داسم
          </a>
          <button
            onClick={() => { clearAuth(); window.location.href = "/"; }}
            className="flex items-center justify-center gap-2 w-full px-6 py-2 rounded-xl text-sm transition"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            <LogOut className="w-4 h-4" />
            تسجيل خروج
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Loading / SSO Redirect screen — واجهة احترافية بدل spinner مجرد
// ─────────────────────────────────────────────────────────────────────────────
function InvestorGate() {
  return (
    <div
      className="min-h-screen flex"
      dir="rtl"
      style={{ background: "linear-gradient(145deg, #020809 0%, #040f10 60%, #051214 100%)" }}
    >
      {/* Brand panel — يظهر فيما يجري التحويل لـSSO */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12">
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
          {/* Investment chart illustration */}
          <div className="relative w-64 h-48 mx-auto">
            <div
              className="absolute inset-0 rounded-3xl opacity-15"
              style={{ background: "radial-gradient(circle at 50% 50%, #10b981, transparent)" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 200 160" className="w-56 h-44 opacity-80">
                {/* Grid lines */}
                {[40, 70, 100, 130].map((y) => (
                  <line key={y} x1="20" y1={y} x2="180" y2={y} stroke="#064e3b" strokeWidth="1" strokeDasharray="4,4" />
                ))}
                {/* Area chart */}
                <path
                  d="M20 130 L50 110 L80 90 L110 70 L140 50 L170 35 L180 30 L180 140 L20 140 Z"
                  fill="url(#investGrad)"
                  opacity="0.3"
                />
                <path
                  d="M20 130 L50 110 L80 90 L110 70 L140 50 L170 35 L180 30"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Data points */}
                {[[20,130],[50,110],[80,90],[110,70],[140,50],[170,35]].map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#10b981" stroke="#020809" strokeWidth="2" />
                ))}
                {/* Upward arrow */}
                <path d="M160 25 L170 15 L180 25" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Lock icon — top right */}
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

      {/* Right: Loading/redirect */}
      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <TrendingUp className="w-8 h-8 text-emerald-400" />
        </div>
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
        <p className="text-emerald-400/50 text-sm">جارٍ التحقق من الهوية...</p>
        <p className="text-white/20 text-xs">ستُحوَّل لصفحة داسم للمصادقة</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  AuthGuard
// ─────────────────────────────────────────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  // localStorage reads are synchronous — no loading state needed
  if (!isLoggedIn()) return <Redirect to="/login" />;
  const user = getUser();
  if (!isAuthorized(user)) return <AccessDenied />;
  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Root App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    const handleExpired = () => {
      clearAuth();
      window.location.href = "/login";
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  return (
    <>
      <TalkGlobalContext />
      <Switch>
        {/* صفحة الدخول المستقلة */}
        <Route path="/login" component={LoginPage} />

        {/* SSO callback (موروث) */}
        <Route path="/auth/callback" component={AuthCallback} />
        <Route>
          <AuthGuard>
            <Layout>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/portfolio" component={Portfolio} />
                <Route path="/contract/:id" component={Contract} />
                <Route path="/early-supporter" component={EarlySupporter} />
                <Route path="/early-supporter/:id" component={EarlySupporterDashboard} />
                <Route path="/early-supporter/:id/contract" component={EarlySupporterContract} />
                <Route component={NotFound} />
              </Switch>
            </Layout>
          </AuthGuard>
        </Route>
      </Switch>
    </>
  );
}
