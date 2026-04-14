# فهرس توثيق نظام الاستثمار الملائكي — منصة DASM

> **آخر تحديث:** 2026-04-14
> **النظام:** بوابة المستثمر الملائكي — `investor.dasm.com.sa`
> **الباكند:** `api.dasm.com.sa` — Laravel 12 + Sanctum

---

## الملفات المتاحة

| الملف | الوصف | الجمهور المستهدف |
|-------|-------|------------------|
| [SRS.md](SRS.md) | وثيقة متطلبات البرنامج الكاملة | مديرو المنتج، كبار المطورين |
| [FEATURES.md](FEATURES.md) | توثيق الفيتشرز التفصيلي مع قصص المستخدم | مطورو الفرونتند والباكند |
| [FLOWCHARTS.md](FLOWCHARTS.md) | مخططات التدفق والعلاقات (Mermaid) | جميع أعضاء الفريق |
| [DATA_MODEL.md](DATA_MODEL.md) | توثيق نموذج البيانات الكامل | مطورو الباكند، مهندسو DB |
| [API_REFERENCE.md](API_REFERENCE.md) | مرجع API الكامل مع أمثلة | مطورو الفرونتند والتكامل |

---

## نظرة عامة على النظام

**نظام الاستثمار الملائكي** هو وحدة استثمارية متكاملة في منصة DASM تتيح للمستثمرين المؤهلين الاستثمار في المنصة مقابل الحصول على نسبة **15%** من صافي دخل المنصة اليومي حتى بلوغ سقف العائد المتفق عليه.

### المكونات الرئيسية

```
investor.dasm.com.sa  ←→  api.dasm.com.sa  ←→  Supabase PostgreSQL
     (React + Vite)          (Laravel 12)         (جداول angel_*)
```

### دورة الحياة المختصرة

```
إنشاء عقد → نشر نسخة → إنشاء اشتراك → توقيع المستثمر → التفعيل → التوزيعات → الإغلاق
```

### الجداول الأساسية

- `angel_investment_contracts` — العقود الاستثمارية
- `angel_investment_contract_versions` — نسخ العقود
- `angel_investment_subscriptions` — مراكز المستثمرين
- `angel_investment_signatures` — التواقيع الإلكترونية
- `angel_investment_distributions` — التوزيعات المالية
- `angel_investment_audit_logs` — سجلات التدقيق

---

## روابط سريعة

- **بوابة المستثمر:** https://investor.dasm.com.sa
- **المنصة الرئيسية:** https://www.dasm.com.sa
- **لوحة الإدارة:** https://control.dasm.com.sa
- **Render (الباكند):** https://api.dasm.com.sa

---

## للمطور الجديد — ابدأ من هنا

1. اقرأ [SRS.md](SRS.md) — القسم 1 (المقدمة) والقسم 2 (المتطلبات الوظيفية)
2. اطّلع على [DATA_MODEL.md](DATA_MODEL.md) — لفهم بنية الجداول
3. راجع [FLOWCHARTS.md](FLOWCHARTS.md) — المخطط 1 (دورة الحياة) والمخطط 2 (SSO)
4. استخدم [API_REFERENCE.md](API_REFERENCE.md) — مرجعاً أثناء التطوير
5. [FEATURES.md](FEATURES.md) — لفهم قصص المستخدم وحالات الخطأ
