# نموذج البيانات الكامل
## نظام الاستثمار الملائكي — منصة DASM

> **الإصدار:** 1.0.0
> **التاريخ:** 2026-04-14
> **قاعدة البيانات:** Supabase PostgreSQL — project `ttkhiatwayvlfksvehzm`

---

## جدول المحتويات

1. [الجداول الأساسية](#1-الجداول-الأساسية)
2. [العلاقات بين الجداول](#2-العلاقات-بين-الجداول)
3. [الفهارس والـ Unique Constraints](#3-الفهارس-والـ-unique-constraints)
4. [الـ Enums وقيمها](#4-الـ-enums-وقيمها)
5. [ملاحظات مهمة](#5-ملاحظات-مهمة)

---

## 1. الجداول الأساسية

### 1.1 جدول `angel_investment_contracts`

**الغرض:** تخزين العقود الاستثمارية الرئيسية.

| الحقل | النوع (PostgreSQL) | NULL | Default | الوصف |
|-------|-------------------|------|---------|-------|
| `id` | `bigserial` | NO | auto | المعرف الأساسي |
| `contract_number` | `varchar(50)` | NO | — | رقم العقد المرجعي الفريد |
| `title` | `varchar(255)` | NO | — | عنوان العقد |
| `status` | `varchar(20)` | NO | `'draft'` | حالة العقد |
| `default_cap_multiple` | `numeric(5,2)` | NO | — | المضاعف الافتراضي للسقف |
| `currency` | `varchar(3)` | NO | `'SAR'` | رمز العملة (ISO 4217) |
| `created_at` | `timestamptz` | NO | `now()` | وقت الإنشاء |
| `updated_at` | `timestamptz` | NO | `now()` | وقت آخر تعديل |

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (contract_number)`
- `CHECK (status IN ('draft', 'active', 'archived'))`
- `CHECK (default_cap_multiple >= 1.0)`

---

### 1.2 جدول `angel_investment_contract_versions`

**الغرض:** تخزين النسخ المختلفة من نص كل عقد مع دعم الإصدارات المتعددة.

| الحقل | النوع (PostgreSQL) | NULL | Default | الوصف |
|-------|-------------------|------|---------|-------|
| `id` | `bigserial` | NO | auto | المعرف الأساسي |
| `contract_id` | `bigint` | NO | — | FK إلى `angel_investment_contracts.id` |
| `version` | `integer` | NO | — | رقم النسخة (تصاعدي داخل العقد) |
| `body_template` | `text` | NO | — | نص العقد الكامل (يدعم placeholders) |
| `risk_disclosure_template` | `text` | NO | — | نص إفصاح المخاطر |
| `published_at` | `timestamptz` | YES | `NULL` | وقت النشر — NULL تعني مسودة |
| `created_at` | `timestamptz` | NO | `now()` | وقت الإنشاء |

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (contract_id, version)`
- `FOREIGN KEY (contract_id) REFERENCES angel_investment_contracts(id) ON DELETE RESTRICT`
- `CHECK (version > 0)`

**Placeholders المدعومة في `body_template`:**
```
{{investor_name}}       — اسم المستثمر الكامل
{{investor_id}}         — معرف المستثمر
{{subscription_code}}   — كود الاشتراك
{{principal_amount}}    — رأس المال بالأرقام
{{cap_multiple}}        — مضاعف السقف
{{cap_total}}           — السقف الكلي (محسوب)
{{contract_date}}       — تاريخ توقيع العقد
{{contract_number}}     — رقم العقد
```

---

### 1.3 جدول `angel_investment_subscriptions`

**الغرض:** تخزين مراكز الاستثمار الفردية — العلاقة بين مستثمر وعقد بشروط مالية محددة.

| الحقل | النوع (PostgreSQL) | NULL | Default | الوصف |
|-------|-------------------|------|---------|-------|
| `id` | `bigserial` | NO | auto | المعرف الأساسي |
| `subscription_code` | `varchar(30)` | NO | — | كود الاشتراك المُولَّد تلقائياً |
| `user_id` | `bigint` | NO | — | FK إلى `users.id` |
| `contract_id` | `bigint` | NO | — | FK إلى `angel_investment_contracts.id` |
| `contract_version_id` | `bigint` | NO | — | FK إلى `angel_investment_contract_versions.id` |
| `principal_amount` | `numeric(15,2)` | NO | — | رأس المال بالريال |
| `cap_multiple` | `numeric(5,2)` | NO | — | مضاعف السقف لهذا المركز تحديداً |
| `status` | `varchar(30)` | NO | `'pending_signature'` | الحالة الحالية للمركز |
| `signed_at` | `timestamptz` | YES | `NULL` | وقت توقيع المستثمر |
| `activated_at` | `timestamptz` | YES | `NULL` | وقت تفعيل الأدمن |
| `created_at` | `timestamptz` | NO | `now()` | وقت الإنشاء |
| `updated_at` | `timestamptz` | NO | `now()` | وقت آخر تعديل |

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (subscription_code)`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT`
- `FOREIGN KEY (contract_id) REFERENCES angel_investment_contracts(id) ON DELETE RESTRICT`
- `FOREIGN KEY (contract_version_id) REFERENCES angel_investment_contract_versions(id) ON DELETE RESTRICT`
- `CHECK (status IN ('pending_signature', 'signed_pending_funding', 'active', 'capped', 'paused', 'closed'))`
- `CHECK (principal_amount > 0)`
- `CHECK (cap_multiple >= 1.0)`

**الحقول المحسوبة (لا تُخزَّن في DB):**

```sql
-- يُحسب في AngelInvestmentMetricsService
cap_total          = principal_amount * cap_multiple
paid_to_date       = SUM(distributions.amount) WHERE subscription_id = this.id
remaining_to_cap   = cap_total - paid_to_date
realized_multiple  = paid_to_date / principal_amount
progress_percent   = (paid_to_date / cap_total) * 100
```

---

### 1.4 جدول `angel_investment_signatures`

**الغرض:** تخزين سجلات التوقيع الإلكتروني بشكل دائم وغير قابل للتعديل.

| الحقل | النوع (PostgreSQL) | NULL | Default | الوصف |
|-------|-------------------|------|---------|-------|
| `id` | `bigserial` | NO | auto | المعرف الأساسي |
| `subscription_id` | `bigint` | NO | — | FK إلى `angel_investment_subscriptions.id` |
| `signer_name` | `varchar(255)` | NO | — | اسم الموقّع (مأخوذ من `users.name` وقت التوقيع) |
| `ip_address` | `varchar(45)` | NO | — | عنوان IP (يدعم IPv6) |
| `user_agent` | `text` | NO | — | User-Agent المتصفح كاملاً |
| `accepted_at` | `timestamptz` | NO | — | وقت التوقيع (UTC) |
| `consent_text_hash` | `varchar(64)` | NO | — | SHA256 hash (hex, 64 حرف) |
| `created_at` | `timestamptz` | NO | `now()` | وقت الإنشاء |

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (subscription_id)` — توقيع واحد فقط لكل مركز
- `FOREIGN KEY (subscription_id) REFERENCES angel_investment_subscriptions(id) ON DELETE RESTRICT`
- `CHECK (LENGTH(consent_text_hash) = 64)` — SHA256 دائماً 64 حرف hex

**ملاحظة أمنية:** هذا الجدول للكتابة مرة واحدة فقط. لا يوجد endpoint لتعديل أو حذف سجلاته.

---

### 1.5 جدول `angel_investment_distributions`

**الغرض:** تسجيل التوزيعات المالية مع ربطها بالليدجر المحاسبي.

| الحقل | النوع (PostgreSQL) | NULL | Default | الوصف |
|-------|-------------------|------|---------|-------|
| `id` | `bigserial` | NO | auto | المعرف الأساسي |
| `subscription_id` | `bigint` | NO | — | FK إلى `angel_investment_subscriptions.id` |
| `amount` | `numeric(15,2)` | NO | — | مبلغ التوزيع بالريال |
| `currency` | `varchar(3)` | NO | `'SAR'` | رمز العملة |
| `description` | `text` | YES | `NULL` | وصف اختياري للتوزيع |
| `ledger_entry_id` | `bigint` | NO | — | FK إلى `ledger_entries.id` |
| `created_at` | `timestamptz` | NO | `now()` | وقت التسجيل |

**Constraints:**
- `PRIMARY KEY (id)`
- `UNIQUE (ledger_entry_id)` — إدخال ليدجر واحد لكل توزيع
- `FOREIGN KEY (subscription_id) REFERENCES angel_investment_subscriptions(id) ON DELETE RESTRICT`
- `FOREIGN KEY (ledger_entry_id) REFERENCES ledger_entries(id) ON DELETE RESTRICT`
- `CHECK (amount > 0)`
- `CHECK (currency ~ '^[A-Z]{3}$')`

---

### 1.6 جدول `angel_investment_audit_logs`

**الغرض:** سجل تدقيق شامل وغير قابل للتعديل لجميع الأحداث في النظام.

| الحقل | النوع (PostgreSQL) | NULL | Default | الوصف |
|-------|-------------------|------|---------|-------|
| `id` | `bigserial` | NO | auto | المعرف الأساسي |
| `actor_user_id` | `bigint` | NO | — | FK إلى `users.id` |
| `action` | `varchar(50)` | NO | — | نوع الإجراء |
| `subject_type` | `varchar(50)` | NO | — | نوع الكيان المتأثر |
| `subject_id` | `bigint` | NO | — | معرف الكيان المتأثر |
| `properties` | `jsonb` | YES | `NULL` | بيانات إضافية (JSON) |
| `created_at` | `timestamptz` | NO | `now()` | وقت التسجيل |

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT`
- `CHECK (action IN ('create_contract', 'publish_version', 'create_subscription', 'activate', 'distribute', 'pause', 'resume', 'close', 'sign', 'promote_investor', 'auto_capped'))`
- `CHECK (subject_type IN ('contract', 'contract_version', 'subscription', 'distribution'))`

**ملاحظة:** هذا الجدول append-only — لا DELETE، لا UPDATE أبداً.

---

## 2. العلاقات بين الجداول

### 2.1 مخطط نصي للعلاقات

```
users (1) ──────────────────── (N) angel_investment_subscriptions
                                    ↑ user_id FK

angel_investment_contracts (1) ─── (N) angel_investment_contract_versions
                                    ↑ contract_id FK

angel_investment_contracts (1) ─── (N) angel_investment_subscriptions
                                    ↑ contract_id FK

angel_investment_contract_versions (1) ── (N) angel_investment_subscriptions
                                            ↑ contract_version_id FK

angel_investment_subscriptions (1) ─── (0..1) angel_investment_signatures
                                         ↑ subscription_id FK UNIQUE

angel_investment_subscriptions (1) ─── (N) angel_investment_distributions
                                         ↑ subscription_id FK

angel_investment_distributions (1) ─── (1) ledger_entries
                                         ↑ ledger_entry_id FK UNIQUE

users (1) ──────────────────── (N) angel_investment_audit_logs
                                    ↑ actor_user_id FK
```

### 2.2 قواعد الحذف (ON DELETE)

| العلاقة | القاعدة | السبب |
|---------|---------|-------|
| subscriptions → users | `RESTRICT` | لا يمكن حذف مستخدم له اشتراكات |
| subscriptions → contracts | `RESTRICT` | لا يمكن حذف عقد له اشتراكات |
| signatures → subscriptions | `RESTRICT` | لا يمكن حذف اشتراك موقّع عليه |
| distributions → subscriptions | `RESTRICT` | لا يمكن حذف اشتراك له توزيعات |
| distributions → ledger_entries | `RESTRICT` | الليدجر لا يُحذف أبداً |

---

## 3. الفهارس والـ Unique Constraints

### 3.1 الفهارس الأساسية

```sql
-- للبحث السريع عن مراكز مستثمر محدد
CREATE INDEX idx_subscriptions_user_id
    ON angel_investment_subscriptions(user_id);

-- للبحث عن مراكز عقد محدد
CREATE INDEX idx_subscriptions_contract_id
    ON angel_investment_subscriptions(contract_id);

-- لفلترة المراكز حسب الحالة
CREATE INDEX idx_subscriptions_status
    ON angel_investment_subscriptions(status);

-- للبحث في سجل التدقيق
CREATE INDEX idx_audit_logs_actor
    ON angel_investment_audit_logs(actor_user_id);

CREATE INDEX idx_audit_logs_subject
    ON angel_investment_audit_logs(subject_type, subject_id);

CREATE INDEX idx_audit_logs_created_at
    ON angel_investment_audit_logs(created_at DESC);

-- للبحث عن توزيعات مركز محدد
CREATE INDEX idx_distributions_subscription_id
    ON angel_investment_distributions(subscription_id);

-- لنسخ العقد المنشورة
CREATE INDEX idx_versions_published
    ON angel_investment_contract_versions(contract_id, published_at DESC)
    WHERE published_at IS NOT NULL;
```

### 3.2 Unique Constraints

| الجدول | الحقول | الغرض |
|--------|--------|-------|
| `angel_investment_contracts` | `contract_number` | منع تكرار أرقام العقود |
| `angel_investment_contract_versions` | `(contract_id, version)` | نسخة واحدة لكل رقم إصدار داخل العقد |
| `angel_investment_subscriptions` | `subscription_code` | كود اشتراك فريد عالمياً |
| `angel_investment_signatures` | `subscription_id` | توقيع واحد فقط لكل مركز |
| `angel_investment_distributions` | `ledger_entry_id` | إدخال ليدجر واحد لكل توزيع |

---

## 4. الـ Enums وقيمها

### 4.1 حالات العقد (`contracts.status`)

| القيمة | المعنى | الانتقالات المسموحة |
|--------|--------|---------------------|
| `draft` | مسودة — لا تظهر للمستثمرين | → `active` |
| `active` | نشط — يمكن إنشاء اشتراكات عليه | → `archived` |
| `archived` | مؤرشف — لا اشتراكات جديدة | نهائي |

### 4.2 حالات الاشتراك (`subscriptions.status`)

| القيمة | المعنى | الانتقالات المسموحة |
|--------|--------|---------------------|
| `pending_signature` | بانتظار توقيع المستثمر | → `signed_pending_funding` |
| `signed_pending_funding` | موقّع — بانتظار تأكيد التمويل | → `active` |
| `active` | نشط — يقبل توزيعات | → `paused`, `capped`, `closed` |
| `paused` | موقوف مؤقتاً — لا توزيعات | → `active`, `closed` |
| `capped` | بلغ السقف — مكتمل تلقائياً | نهائي |
| `closed` | مُغلق يدوياً — نهائي | نهائي |

### 4.3 أنواع إجراءات التدقيق (`audit_logs.action`)

| القيمة | المُنفِّذ | الوصف |
|--------|---------|-------|
| `create_contract` | أدمن | إنشاء عقد جديد |
| `publish_version` | أدمن | نشر نسخة من العقد |
| `create_subscription` | أدمن | إنشاء مركز استثماري |
| `activate` | أدمن | تفعيل مركز |
| `distribute` | أدمن | تسجيل توزيع |
| `pause` | أدمن | إيقاف مؤقت |
| `resume` | أدمن | استئناف |
| `close` | أدمن | إغلاق نهائي |
| `sign` | مستثمر | توقيع العقد |
| `promote_investor` | أدمن | ترقية مستخدم لمستثمر |
| `auto_capped` | النظام | إغلاق تلقائي عند بلوغ السقف |

### 4.4 أنواع إدخالات الليدجر المرتبطة

| النوع | الاتجاه | الوقت |
|-------|---------|-------|
| `TYPE_ANGEL_CAPITAL_IN` | وارد (+) | عند تفعيل الاشتراك |
| `TYPE_ANGEL_DISTRIBUTION` | صادر (-) | عند كل توزيع |

---

## 5. ملاحظات مهمة

### 5.1 الليدجر كمصدر الحقيقة

```
⛔ لا تقرأ paid_to_date من subscriptions.principal_amount
✓ احسب paid_to_date من: SELECT SUM(amount) FROM angel_investment_distributions WHERE subscription_id = X
```

- الأرقام المالية دائماً تُحسب من جداول `angel_investment_distributions` و `ledger_entries`
- لا يوجد حقل `paid_to_date` مخزَّن في الـ DB — يُحسب في `AngelInvestmentMetricsService`
- `principal_amount` في `subscriptions` = المبلغ المرجعي الثابت — لا يتغير أبداً

### 5.2 صيغة `consent_text_hash`

```
consent_anchor = نص ثابت ومعروف مسبقاً (مُعرَّف في config/angel_investment.php)
hash = SHA256( version_id || "|" || user_id || "|" || consent_anchor )

مثال:
  version_id = "3"
  user_id = "142"
  consent_anchor = "أوافق على شروط وأحكام عقد الاستثمار الملائكي الصادر عن منصة داسم"
  hash = SHA256("3|142|أوافق على شروط...")
```

**لماذا الـ Hash؟**
1. يضمن أن المستثمر وقّع على نص بعينه (يمكن التحقق منه لاحقاً)
2. يمنع الإنكار — لا يمكن للمستثمر الادعاء بأنه لم يرَ شروطاً معينة
3. يتيح التحقق من صحة التوقيع بدون الحاجة لتخزين النص الكامل في signatures

### 5.3 صيغة `subscription_code`

```
Format: ANGEL-[4 أحرف/أرقام عشوائية]-[آخر رقمين من السنة]
مثال: ANGEL-X4K2-26
      ANGEL-M9PQ-26
```

يُولَّد في `AngelInvestmentDomainService` مع التحقق من عدم التكرار.

### 5.4 قواعد الـ Soft Delete

- **لا يوجد** soft delete في أي جدول من جداول النظام الملائكي
- الاشتراكات لا تُحذف — تُغلق (`closed`)
- العقود لا تُحذف — تُؤرشف (`archived`)
- سجلات التدقيق والتوزيعات والتواقيع والليدجر: للكتابة فقط — لا حذف مطلقاً

### 5.5 التوقيت والمناطق الزمنية

- كل الحقول `timestamptz` تُخزَّن بـ UTC
- الواجهة الأمامية مسؤولة عن التحويل لتوقيت المستخدم (Asia/Riyadh = UTC+3)
- `accepted_at` في التوقيع — UTC دائماً (مهم للاعتبارات القانونية)

### 5.6 حدود الأرقام

| الحقل | الحد الأدنى | الحد الأقصى (numeric) | ملاحظة |
|-------|-------------|----------------------|--------|
| `principal_amount` | 1.00 | 9,999,999,999,999.99 | بالريال |
| `cap_multiple` | 1.00 | 999.99 | مضاعف |
| `amount` (distributions) | 0.01 | 9,999,999,999,999.99 | بالريال |
| `version` | 1 | 2,147,483,647 | integer |
