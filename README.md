# DASM Angel Investor Portal — بوابة المستثمر الملائكي

بوابة واجهة مخصصة للمستثمرين الملائكيين في منصة DASM-e.  
هذا المشروع عبارة عن **واجهة أمامية فقط** (React + Vite) تتصل بـ API منصة داسم دون تكرار منطق الأعمال أو قواعد البيانات.

---

## الفكرة العامة

**مصدر الحقيقة يبقى داخل منصة داسم (Laravel):**
- هوية المستخدم وصلاحياته (`User`, `UserRole::INVESTOR`, `is_angel_investor`).
- وحدة الاستثمار الملائكي كاملة (الجداول، النماذج، الخدمات، العقود، الليدجر).
- واجهات API تحت `/api/investor/angel-investments/...`.

**هذا الريبو:**
- تطبيق React + Vite يعمل كعميل رفيع (Thin Client).
- يستهلك API داسم عبر HTTP باستخدام توكن صادر من SSO.
- لا يحتوي على أسرار خادم أو مفاتيح خاصة بالخلفية.

---

## سكوبات SSO للمستثمر

تُعرَّف في `backend/config/sso.php` تحت `platform_scopes.investor`:

| السكوب | الوصول |
|--------|--------|
| `angel:read` | قراءة القائمة، الكشوف، التفاصيل، العقد، التوزيعات |
| `angel:sign` | التوقيع على الاشتراك |
| `angel:ledger` | عرض سجل الليدجر المرتبط بالمركز |

عند `POST /api/sso/generate` مع `platform=investor` يُمنح التوكن هذه السكوبات فقط (مع قدرة `sso-investor`).  
مسارات `/api/investor/angel-investments/*` مقيّدة عبر middleware `sanctum.ability:...`.

---

## المتطلبات

- Node.js 20+
- Backend داسم يعمل في بيئة يمكن الوصول إليها.

---

## متغيرات البيئة

أنشئ ملف `.env.local` في جذر المشروع (انسخ من `.env.example`):

```env
# محلي
VITE_DASM_API_URL=http://localhost:8000/api
VITE_DASM_SSO_URL=http://localhost:3000
```

```env
# إنتاج (Vercel)
VITE_DASM_API_URL=https://api.dasm.com.sa/api
VITE_DASM_SSO_URL=https://www.dasm.com.sa
```

> لا تحفظ مفاتيح سرية للخادم هنا؛ التوكن يُستلم بعد تسجيل الدخول عبر SSO.

---

## تدفق SSO

1. المستخدم يُوجَّه إلى `${VITE_DASM_SSO_URL}/auth/sso?platform=investor&return_url=...`
2. يسجّل الدخول (إن لم يكن مسجلاً) ويوافق على التفويض.
3. داسم يُصدر `sso_token` قصير العمر (5 دقائق).
4. يُعاد توجيهه إلى `investor.dasm.com.sa/auth/callback?sso_token=...`
5. البوابة تستدعي `POST /api/sso/verify` للحصول على `access_token` طويل الأمد.
6. كل طلبات API اللاحقة تحمل `Authorization: Bearer ACCESS_TOKEN`.

---

## بنية المشروع

```
src/
  App.tsx              # router + AuthGuard + SSO callback
  lib/
    api.ts             # دوال الاتصال بـ API داسم
    auth.ts            # منطق التوكن + SSO redirect
  pages/
    Dashboard.tsx      # لوحة المحفظة الرئيسية
    Portfolio.tsx      # تفاصيل كل المراكز الاستثمارية
    Contract.tsx       # عرض العقد + التوقيع
    NotFound.tsx
  components/
    Layout.tsx
```

---

## تشغيل محلي

```bash
# 1. شغّل Backend داسم
cd backend && php artisan serve   # → http://localhost:8000

# 2. شغّل بوابة المستثمر (port 5173 افتراضي)
npm install
npm run dev
```

**ملاحظة CORS:** `cors.php` في الباكند يتضمن `http://localhost:5173` تلقائياً.  
إن غيّرت الـ port، أضف الأصل الجديد في `backend/config/cors.php`.

---

## النشر

- الدومين: `https://investor.dasm.com.sa`
- Platform: Vercel — يحتاج `vercel.json` بـ SPA rewrite (موجود مسبقاً).
- Env vars في Vercel Dashboard:
  - `VITE_DASM_API_URL=https://api.dasm.com.sa/api`
  - `VITE_DASM_SSO_URL=https://www.dasm.com.sa`

---

## ملاحظات أمنية

- التوكن مخزّن في `localStorage` — مناسب للمرحلة الأولى.
- عند انتهاء صلاحية التوكن (401) يُعاد التوجيه تلقائياً لـ SSO.
- يُفضّل لاحقاً طبقة BFF لتخزين التوكن في HttpOnly cookies.
