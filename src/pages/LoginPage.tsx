import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { loginDirect } from "../lib/auth";

const ADMIN_TYPES    = ["admin", "super_admin"];
const INVESTOR_ROLES = ["angel_investor", "investor", "early_supporter"];

function isAuthorized(user: any): boolean {
  if (!user) return false;
  if (ADMIN_TYPES.includes(user.type)) return true;
  if (user.is_angel_investor === true) return true;
  if (user.is_early_supporter === true) return true;
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  return roles.some((r) => INVESTOR_ROLES.includes(r));
}

function AccessDenied({ type }: { type: string }) {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #020809, #051214)", padding: "1.5rem" }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center", padding: "2.5rem", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#f87171"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 style={{ margin: "0 0 0.5rem", color: "white", fontWeight: 700, fontSize: "1.125rem" }}>وصول مقيّد</h2>
        <p style={{ margin: "0 0 1.5rem", color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", lineHeight: 1.6 }}>
          هذه البوابة مخصصة للمستثمرين المعتمدين وفريق الإدارة.<br />
          حسابك ({type}) لا يملك الصلاحية.
        </p>
        <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} style={{ padding: "0.75rem 1.5rem", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "0.875rem" }}>
          تسجيل خروج
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [, navigate]        = useLocation();
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [denied, setDenied] = useState<any>(null);

  if (denied) return <AccessDenied type={denied.type} />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { user } = await loginDirect(email, pw);
      if (!isAuthorized(user)) { setDenied(user); return; }
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "تعذّر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(145deg, #020809 0%, #040f10 60%, #051214 100%)" }}>

      {/* ── يسار: نموذج ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2rem 2.5rem" }}>

        {/* شعار */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #10b981, #059669)", fontSize: 22, fontWeight: 800, color: "white" }}>
            م
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: "white", fontSize: "1rem" }}>بوابة المستثمرين</p>
            <p style={{ margin: 0, color: "#34d399", fontSize: "0.75rem" }}>DASM Investor Portal</p>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ margin: "0 0 0.375rem", fontSize: "1.875rem", fontWeight: 800, color: "white" }}>أهلاً بعودتك 👋</h2>
          <p style={{ margin: "0 0 1.75rem", color: "rgba(52,211,153,0.5)", fontSize: "0.9rem" }}>سجّل دخولك للوصول إلى محفظتك الاستثمارية.</p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>البريد الإلكتروني</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@dasm.com.sa"
                style={{ width: "100%", borderRadius: 12, padding: "0.8rem 1rem", fontSize: "0.9375rem", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(16,185,129,0.25)", color: "white", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.1)"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>كلمة المرور</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} required placeholder="••••••••"
                  style={{ width: "100%", borderRadius: 12, padding: "0.8rem 1rem 0.8rem 2.75rem", fontSize: "0.9375rem", background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(16,185,129,0.25)", color: "white", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.1)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(52,211,153,0.5)", padding: 0 }}>
                  {showPw
                    ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ borderRadius: 12, padding: "0.75rem 1rem", fontSize: "0.875rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}>{error}</div>
            )}

            <button
              type="submit" disabled={busy}
              style={{ width: "100%", padding: "0.9rem", borderRadius: 12, fontWeight: 700, fontSize: "1rem", color: "white", background: busy ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg, #10b981, #059669)", border: "none", cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: busy ? 0.7 : 1 }}
            >
              {busy ? <>
                <svg style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                جارٍ التحقق...
              </> : <>دخول ←</>}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <a href="https://www.dasm.com.sa" style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.8125rem", textDecoration: "none" }}>← العودة للرئيسية</a>
          </div>
        </div>
      </div>

      {/* ── يمين: لوحة الهوية (desktop) ── */}
      <div
        className="inv-brand"
        style={{ width: "45%", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "3rem 2.5rem", gap: "1.5rem", background: "linear-gradient(145deg, #020809 0%, #040f10 55%, #051214 100%)", display: "none", borderRight: "1px solid rgba(16,185,129,0.08)" }}
      >
        <div style={{ width: 88, height: 88, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #10b981, #059669)", fontSize: 40, fontWeight: 800, color: "white" }}>
          م
        </div>

        <div style={{ textAlign: "center" }}>
          <h1 style={{ margin: "0 0 0.25rem", fontSize: "2rem", fontWeight: 800, color: "white" }}>بوابة المستثمرين</h1>
          <p style={{ margin: 0, color: "#34d399", fontSize: "0.8125rem", letterSpacing: "0.05em" }}>DASM INVESTOR PORTAL</p>
        </div>

        <h2 style={{ textAlign: "center", fontSize: "1.625rem", fontWeight: 800, color: "#34d399", lineHeight: 1.3, margin: "0.25rem 0" }}>
          استثمارك في أيدٍ<br />
          <span style={{ color: "white" }}>أمينة ومتخصصة</span>
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", width: "100%", maxWidth: 320 }}>
          {[
            { icon: "🔒", text: "وصول مقيّد للمستثمرين المعتمدين فقط" },
            { icon: "📈", text: "محفظة استثمارية ومتابعة المراحل" },
            { icon: "🤝", text: "صفقات وفرص استثمارية حصرية" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: 12, padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}>
              <span style={{ fontSize: "1.25rem" }}>{f.icon}</span>
              <span style={{ color: "rgba(209,250,229,0.65)", fontSize: "0.875rem" }}>{f.text}</span>
            </div>
          ))}
        </div>

        <p style={{ color: "rgba(5,150,105,0.4)", fontSize: "0.75rem", marginTop: "0.5rem" }}>DASM Investor Portal — سري وغير مفهرَس</p>
      </div>

      <style>{`
        @media (min-width: 1024px) { .inv-brand { display: flex !important; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
