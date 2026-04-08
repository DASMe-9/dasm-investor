import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center" dir="rtl">
      <p className="text-6xl font-bold text-slate-700 mb-4">404</p>
      <p className="text-slate-400 mb-6">الصفحة غير موجودة</p>
      <Link href="/">
        <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
          العودة للرئيسية
        </button>
      </Link>
    </div>
  );
}
