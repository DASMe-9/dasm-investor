import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { setToken, setUser, verifySSOToken, redirectToSSO, isLoggedIn } from "./lib/auth";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button onClick={() => redirectToSSO()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            إعادة تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!isLoggedIn()) { redirectToSSO(); } else { setReady(true); }
  }, []);
  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  return <>{children}</>;
}

export default function App() {
  return (
    <Switch>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route>
        <AuthGuard>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/portfolio" component={Portfolio} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}
