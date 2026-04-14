import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { setToken, setUser, verifySSOToken, redirectToSSO, isLoggedIn, clearAuth, getUser } from "./lib/auth";
import { fetchSubscriptions } from "./lib/api";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Contract from "./pages/Contract";
import EarlySupporter from "./pages/EarlySupporter";
import EarlySupporterContract from "./pages/EarlySupporterContract";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { ShieldX, LogOut } from "lucide-react";

function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("sso_token");
    const ssoError = params.get("sso_error");

    if (ssoError) { setError("تم إلغاء تسجيل الدخول"); return; }
    if (!ssoToken) { setError("لا يوجد توكن SSO"); return; }

    verifySSOToken(ssoToken).then((result) => {
      if (result) {
        setToken(result.token);
        setUser(result.user);
        setLocation("/");
      } else {
        setError("فشل التحقق من التوكن");
      }
    });
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950" dir="rtl">
        <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-xl p-8 max-w-sm text-center">
          <p className="text-red-400 font-bold mb-4">{error}</p>
          <button onClick={() => redirectToSSO()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            إعادة تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );
}

function AccessDenied() {
  const user = getUser();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4" dir="rtl">
      <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-8 max-w-md text-center">
        <ShieldX className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">ليس لديك صلاحية الوصول</h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          هذه البوابة مخصصة للمستثمرين الملائكيين فقط.
          {user?.first_name && (
            <span className="block mt-2 text-slate-500">
              مسجل الدخول كـ: {user.first_name} {user.last_name}
            </span>
          )}
        </p>
        <div className="space-y-3">
          <a href="https://www.dasm.com.sa/dashboard" className="block w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
            العودة لمنصة داسم
          </a>
          <button
            onClick={() => { clearAuth(); window.location.href = "/"; }}
            className="flex items-center justify-center gap-2 w-full px-6 py-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            تسجيل خروج
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authorized" | "denied">("loading");

  useEffect(() => {
    if (!isLoggedIn()) {
      redirectToSSO();
      return;
    }

    const user = getUser();
    const adminRoles = ["admin", "super_admin", "moderator", "employee"];
    const isAdmin = user?.type && adminRoles.includes(user.type);

    // أدمن — دخول مباشر للمراقبة (بدون بيانات استثمارية)
    if (isAdmin) {
      setStatus("authorized");
      return;
    }

    // مستثمر ملائكي أو صديق دعم مبكر — is_angel_investor / is_early_supporter flag
    if (user?.is_angel_investor || user?.is_early_supporter) {
      setStatus("authorized");
      return;
    }

    // تحقق عبر API — مستخدم عادي قد يملك اشتراك
    fetchSubscriptions().then((res) => {
      const hasSubs = (res?.positions?.data ?? []).length > 0;
      const hasSummary = res?.portfolio_summary?.positions_total_count > 0;
      if (hasSubs || hasSummary) {
        setStatus("authorized");
      } else {
        setStatus("denied");
      }
    }).catch(() => {
      setStatus("denied");
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status === "denied") {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

export default function App() {
  // ✅ عند انتهاء صلاحية التوكن (401) — امسح الجلسة وأعد التوجيه لـ SSO
  useEffect(() => {
    const handleExpired = () => {
      clearAuth();
      redirectToSSO();
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  return (
    <Switch>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route>
        <AuthGuard>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/portfolio" component={Portfolio} />
              <Route path="/contract/:id" component={Contract} />
              <Route path="/early-supporter" component={EarlySupporter} />
              <Route path="/early-supporter/:id/contract" component={EarlySupporterContract} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}
