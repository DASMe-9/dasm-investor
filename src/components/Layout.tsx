import { useLocation, Link } from "wouter";
import { getUser, clearAuth } from "../lib/auth";
import { BarChart3, Briefcase, LogOut, ExternalLink, Diamond } from "lucide-react";

const nav = [
  { name: "نظرة عامة", href: "/", icon: BarChart3 },
  { name: "محفظتي", href: "/portfolio", icon: Briefcase },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/";
  };

  return (
    <div
      className="min-h-screen text-white"
      dir="rtl"
      style={{
        backgroundColor: "#080c14",
        backgroundImage: `
          linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    >
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          backgroundColor: "rgba(8,12,20,0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-4">
            {/* Logo mark */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow: "0 0 20px rgba(16,185,129,0.35)",
              }}
            >
              D
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-wide">بوابة المستثمر الملائكي</span>
                {/* Angel badge */}
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(251,191,36,0.1) 100%)",
                    border: "1px solid rgba(245,158,11,0.4)",
                    color: "#f59e0b",
                  }}
                >
                  <Diamond className="w-2.5 h-2.5" />
                  ملائكي
                </span>
              </div>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                DASM Angel Investor Portal
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {nav.map((item) => {
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                    style={{
                      backgroundColor: active ? "rgba(16,185,129,0.12)" : "transparent",
                      color: active ? "#10b981" : "rgba(255,255,255,0.5)",
                      border: active ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </button>
                </Link>
              );
            })}

            {/* Back to DASM */}
            <a
              href="https://www.dasm.com.sa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 mr-2"
              style={{
                color: "rgba(255,255,255,0.35)",
                border: "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)";
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)";
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              العودة لداسم
            </a>
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                >
                  {(user.first_name?.[0] || "م").toUpperCase()}
                </div>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {user.first_name} {user.last_name}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ color: "rgba(255,255,255,0.35)" }}
              title="تسجيل خروج"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div
          className="sm:hidden flex border-t px-2"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {nav.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <button
                  className="w-full flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors"
                  style={{ color: active ? "#10b981" : "rgba(255,255,255,0.35)" }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 pb-16">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-6 px-4"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="mx-auto max-w-7xl text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center font-black text-xs"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
            >
              D
            </div>
            <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
              DASM — بوابة المستثمر الملائكي
            </span>
          </div>
          <p className="text-[10px] leading-relaxed max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.2)" }}>
            تنبيه قانوني: المعلومات المعروضة في هذه البوابة هي بيانات استثمارية خاصة بك فقط.
            هذه البوابة لا تُقدّم نصيحة استثمارية. الاستثمار في المنصات الرقمية ينطوي على مخاطر،
            ولا يُضمن أي عائد. الأرقام المعروضة هي توزيعات مسجّلة فعلياً وليست التزاماً مستقبلياً.
          </p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.12)" }}>
            © {new Date().getFullYear()} DASM Platform. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
