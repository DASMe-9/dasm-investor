import { useLocation, Link } from "wouter";
import { getUser, clearAuth } from "../lib/auth";
import { BarChart3, Briefcase, LogOut, TrendingUp } from "lucide-react";

const nav = [
  { name: "نظرة عامة", href: "/", icon: BarChart3 },
  { name: "المحفظة", href: "/portfolio", icon: Briefcase },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm">بوابة المستثمر</h1>
              <p className="text-[10px] text-slate-400">DASM Angel Investor</p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {nav.map((item) => {
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${active ? "bg-white/10 text-white font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-slate-400 hidden sm:block">
                {user.first_name} {user.last_name}
              </span>
            )}
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="تسجيل خروج">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex border-t border-white/5 px-2">
          {nav.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <button className={`w-full flex flex-col items-center gap-1 py-2 text-[10px] transition-colors ${active ? "text-emerald-400" : "text-slate-500"}`}>
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
