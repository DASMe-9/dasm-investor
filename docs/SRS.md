# وثيقة متطلبات البرنامج (SRS)
## نظام الاستثمار الملائكي — منصة DASM

> **الإصدار:** 1.0.0
> **التاريخ:** 2026-04-14
> **الحالة:** معتمدة
> **المؤلف:** فريق DASM

---

## جدول المحتويات

1. [المقدمة](#1-المقدمة)
2. [المتطلبات الوظيفية](#2-المتطلبات-الوظيفية)
3. [المتطلبات غير الوظيفية](#3-المتطلبات-غير-الوظيفية)
4. [قيود النظام](#4-قيود-النظام)
5. [نموذج البيانات](#5-نموذج-البيانات)
6. [متطلبات API](#6-متطلبات-api)
7. [متطلبات SSO](#7-متطلبات-sso)

---

## 1. المقدمة

### 1.1 الغرض

تصف هذه الوثيقة المتطلبات الكاملة لنظام الاستثمار الملائكي ضمن منصة DASM. النظام يتيح لمستثمرين مؤهلين الاستثمار في المنصة مقابل الحصول على نسبة 15% من صافي الدخل اليومي للمنصة حتى بلوغ سقف عائد محدد مسبقاً.

### 1.2 النطاق

يشمل النطاق:
- **بوابة المستثمر** (`investor.dasm.com.sa`): واجهة React + Vite لعرض المحفظة والعقود والتوزيعات
- **API الباكند** (`api.dasm.com.sa`): Laravel 12 مع Sanctum للمصادقة وإدارة العمليات
- **لوحة الإدارة**: إدارة العقود والاشتراكات والتوزيعات عبر `control.dasm.com.sa`
- **نظام SSO**: مصادقة مركزية من `dasm.com.sa` إلى `investor.dasm.com.sa`

لا يشمل النطاق:
- معالجة المدفوعات الخارجية (تحويلات بنكية، SADAD)
- نظام KYC المستقل (يُستخدم KYC المنصة الرئيسية)
- إدارة الضرائب والزكاة

### 1.3 المصطلحات

| المصطلح | التعريف |
|---------|---------|
| **المستثمر الملائكي** | مستخدم مؤهل يمتلك مركزاً استثمارياً نشطاً في المنصة |
| **العقد الاستثماري** | وثيقة قانونية تحدد شروط الاستثمار وحصة العوائد |
| **نسخة العقد** | إصدار محدد من نص العقد مع قالب الإفصاح عن المخاطر |
| **المركز الاستثماري** | اشتراك مستثمر في عقد محدد بمبلغ رأس المال وسقف العائد |
| **السقف (Cap)** | الحد الأقصى للعوائد = رأس المال × مضاعف السقف |
| **المضاعف (Multiple)** | نسبة السقف إلى رأس المال (مثال: 2× يعني عائد 200%) |
| **الليدجر** | سجل محاسبي دائم وغير قابل للتعديل لجميع الحركات المالية |
| **التوزيع** | دفعة مالية تُصرف للمستثمر من العوائد المستحقة |
| **consent_anchor** | نص قانوني موحّد يوقّع عليه المستثمر |
| **SSO Token** | توكن قصير الأمد (5 دقائق) لنقل الهوية بين النطاقات |
| **Access Token** | توكن طويل الأمد (30 يوم) للوصول لـ API البوابة |

---

## 2. المتطلبات الوظيفية

### 2.1 متطلبات المستثمر

#### FR-INV-001: عرض المحفظة الاستثمارية

- **الوصف:** يجب أن يتمكن المستثمر من رؤية جميع مراكزه الاستثمارية في صفحة واحدة
- **المدخلات:** توكن مصادقة صالح بسكوب `angel:read`
- **المخرجات:** قائمة بجميع المراكز مع: رأس المال، السقف الكلي، المدفوع حتى الآن، المتبقي، نسبة التقدم
- **القيود:** يرى المستثمر مراكزه الخاصة فقط

#### FR-INV-002: عرض تفاصيل مركز محدد

- **الوصف:** عرض تفاصيل كاملة لمركز استثماري واحد
- **المدخلات:** معرف الاشتراك (subscription_id)
- **المخرجات:** بيانات المركز + تاريخ التوزيعات + الحركات الأخيرة في الليدجر

#### FR-INV-003: عرض نص العقد

- **الوصف:** يجب أن يتمكن المستثمر من قراءة نص عقده الكامل بالنسخة التي وقّع عليها
- **المدخلات:** معرف الاشتراك
- **المخرجات:** نص العقد المُصيَّر مع بيانات المستثمر مضمّنة

#### FR-INV-004: التوقيع الإلكتروني على العقد

- **الوصف:** يجب أن يتمكن المستثمر من توقيع العقد إلكترونياً
- **المدخلات:** معرف الاشتراك + موافقة صريحة (accepted: true) + بيانات الجهاز (IP، User-Agent)
- **المخرجات:** سجل توقيع بـ SHA256 hash + تحديث حالة الاشتراك إلى `signed_pending_funding`
- **الشروط المسبقة:** حالة الاشتراك = `pending_signature`
- **السكوب المطلوب:** `angel:sign`

#### FR-INV-005: عرض سجل الليدجر

- **الوصف:** عرض جميع الحركات المالية المرتبطة بالمركز
- **السكوب المطلوب:** `angel:ledger`
- **المخرجات:** قائمة مرتبة زمنياً بالحركات من نوع `TYPE_ANGEL_CAPITAL_IN` و `TYPE_ANGEL_DISTRIBUTION`

#### FR-INV-006: عرض تاريخ التوزيعات

- **الوصف:** عرض جميع التوزيعات التي تلقّاها المستثمر على مركز محدد
- **السكوب المطلوب:** `angel:read`

#### FR-INV-007: ملخص المحفظة الإجمالي

- **الوصف:** عرض إجمالي كل المراكز الاستثمارية في الداشبورد الرئيسي
- **المخرجات:** إجمالي رأس المال المستثمر، إجمالي العوائد المستلمة، إجمالي المتبقي، عدد المراكز النشطة

### 2.2 متطلبات الإدارة

#### FR-ADM-001: إنشاء عقد استثماري جديد

- **الوصف:** يجب أن يتمكن الأدمن من إنشاء عقد جديد مع قالب نصي
- **الحقول الإلزامية:** title, contract_number, default_cap_multiple, currency
- **القيود:** contract_number فريد عالمياً

#### FR-ADM-002: نشر نسخة جديدة من العقد

- **الوصف:** الأدمن ينشر نسخة جديدة من نص العقد قبل توجيه المستثمرين للتوقيع
- **الحقول الإلزامية:** version (رقمي تصاعدي)، body_template، risk_disclosure_template
- **السلوك:** عند النشر، يُسجَّل `published_at` بالوقت الحالي

#### FR-ADM-003: إنشاء اشتراك لمستثمر

- **الوصف:** الأدمن يُنشئ مركزاً استثمارياً لمستثمر مؤهل
- **الحقول الإلزامية:** user_id, contract_id, principal_amount, cap_multiple
- **السلوك:** الحالة الابتدائية دائماً `pending_signature`، subscription_code يُولَّد تلقائياً

#### FR-ADM-004: تفعيل الاشتراك

- **الوصف:** بعد التوقيع وتأكيد استلام التمويل، يُفعِّل الأدمن الاشتراك
- **الشروط المسبقة:** حالة الاشتراك = `signed_pending_funding`
- **السلوك:** تغيير الحالة إلى `active` + إنشاء إدخال ليدجر `TYPE_ANGEL_CAPITAL_IN` + تسجيل `activated_at`

#### FR-ADM-005: تسجيل توزيع جديد

- **الوصف:** الأدمن يُسجّل دفعة توزيع لمركز نشط
- **الحقول الإلزامية:** subscription_id, amount, currency, description
- **السلوك:**
  - إنشاء إدخال `angel_investment_distributions`
  - ربطه بإدخال ليدجر `TYPE_ANGEL_DISTRIBUTION`
  - إذا تجاوزت `paid_to_date` السقف → تغيير الحالة تلقائياً إلى `capped`

#### FR-ADM-006: إيقاف مؤقت / استئناف / إغلاق اشتراك

- **إيقاف مؤقت (pause):** من `active` إلى `paused` — لا توزيعات جديدة أثناء الإيقاف
- **استئناف (resume):** من `paused` إلى `active`
- **إغلاق (close):** من `active` أو `paused` إلى `closed` — نهائي لا يمكن التراجع عنه

#### FR-ADM-007: عرض التقارير والإحصائيات

- **الوصف:** لوحة إحصائيات شاملة للأدمن
- **المخرجات:**
  - إجمالي رأس المال المستثمر عبر جميع المراكز
  - إجمالي التوزيعات المدفوعة
  - توزيع المراكز حسب الحالة
  - قائمة بالمستثمرين النشطين

#### FR-ADM-008: ترقية مستخدم عادي إلى مستثمر

- **الوصف:** الأدمن يمنح صلاحية `investor` لمستخدم موجود
- **السلوك:** إضافة دور `investor` في `model_has_roles` مع `organization_id` الصحيح

#### FR-ADM-009: سجل التدقيق (Audit Log)

- **الوصف:** كل إجراء إداري يُسجَّل تلقائياً
- **الحقول:** actor_user_id, action (create/activate/distribute/pause/resume/close/publish), subject_type, subject_id, properties (JSON)

### 2.3 متطلبات الأمان

#### FR-SEC-001: التحقق من السكوبات

- كل endpoint محمي بسكوب محدد
- `angel:read` — القراءة فقط
- `angel:sign` — التوقيع على العقود
- `angel:ledger` — عرض الليدجر المالي

#### FR-SEC-002: تجزئة التوقيع

- عند التوقيع يُحسب: `SHA256(version_id | user_id | consent_anchor)`
- النتيجة تُحفظ في `consent_text_hash` في جدول `angel_investment_signatures`
- القيمة غير قابلة للتعديل بعد الحفظ

#### FR-SEC-003: حماية بيانات المستثمر

- المستثمر يرى بياناته فقط — يُتحقق `user_id` في كل استعلام
- لا يمكن للمستثمر الوصول لبيانات مستثمر آخر حتى بتعديل الـ URL

#### FR-SEC-004: تسجيل معلومات التوقيع

- `ip_address` يُسجَّل من طلب HTTP الفعلي
- `user_agent` يُسجَّل كاملاً
- `accepted_at` يُسجَّل بالتوقيت المنسّق (UTC)

---

## 3. المتطلبات غير الوظيفية

### 3.1 الأداء

| المعيار | القيمة المستهدفة |
|---------|----------------|
| وقت استجابة API للقراءة | أقل من 500ms (P95) |
| وقت استجابة API للكتابة | أقل من 1000ms (P95) |
| وقت تحميل الداشبورد | أقل من 2 ثانية على شبكة 4G |
| الحد الأقصى للطلبات المتزامنة | 100 طلب/ثانية |

### 3.2 الأمان

- جميع الاتصالات عبر HTTPS فقط (TLS 1.2 كحد أدنى)
- توكن SSO مدته 5 دقائق فقط — أحادي الاستخدام
- Access Token مدته 30 يوماً
- CORS مقيّد بالنطاقات المعتمدة: `dasm.com.sa`, `investor.dasm.com.sa`, `control.dasm.com.sa`
- جميع الأحداث الحساسة مسجّلة في `angel_investment_audit_logs`
- لا يُعرض `consent_text_hash` في استجابات API للمستثمر
- رقم IP المستثمر لا يُعرض له في أي استجابة

### 3.3 التوفر والموثوقية

- معدل التوفر المستهدف: 99.5%
- الليدجر للقراءة فقط بعد الكتابة — لا حذف، لا تعديل
- كل إدخال ليدجر مرتبط بـ FK بالتوزيع المقابل
- النسخ الاحتياطي للبيانات: يومي عبر Supabase

### 3.4 إمكانية الاستخدام

- الواجهة بالكامل بالعربية مع دعم RTL
- متوافقة مع أحدث إصدارين من Chrome, Firefox, Safari
- متجاوبة مع الأجهزة المحمولة (Responsive)

### 3.5 قابلية الصيانة

- كل تغيير على نموذج البيانات عبر Supabase MCP فقط (لا migrations يدوية)
- الكود موثّق بتعليقات للمنطق المعقد
- لا منطق أعمال في الـ Controllers — يُفوَّض لـ Services

---

## 4. قيود النظام

### 4.1 متغيرات البيئة المطلوبة

```env
# الباكند (Render)
APP_KEY=base64:...
DB_CONNECTION=pgsql
DB_HOST=...              # Supabase IPv4 pooler
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.ttkhiatwayvlfksvehzm
DB_PASSWORD=...
SANCTUM_STATEFUL_DOMAINS=investor.dasm.com.sa,control.dasm.com.sa,dasm.com.sa
CORS_ALLOWED_ORIGINS=https://investor.dasm.com.sa,https://control.dasm.com.sa,https://www.dasm.com.sa

# SSO
SSO_INVESTOR_PLATFORM=investor
SSO_TOKEN_TTL_MINUTES=5
SSO_ACCESS_TOKEN_TTL_DAYS=30
```

### 4.2 الليدجر كمصدر الحقيقة

- **قاعدة لا استثناء فيها:** الأرقام المالية تُحسب دائماً من جدول الليدجر
- `paid_to_date` = مجموع جميع إدخالات `TYPE_ANGEL_DISTRIBUTION` للمركز
- `principal_amount` في `angel_investment_subscriptions` = المبلغ المرجعي فقط
- لا يجوز تعديل أي إدخال في الليدجر بعد إنشائه — INSERT فقط

### 4.3 قواعد التحويل والعملات

- العملة الافتراضية: SAR (ريال سعودي)
- `principal_amount` و `amount` بالريال (ليس الهللة)
- التحقق من تطابق العملة عند التوزيع

### 4.4 قيود الحالة

- انتقالات الحالة تسير في اتجاه واحد فقط (لا رجعة من `closed`)
- `capped` تُضبط تلقائياً عند بلوغ السقف — لا يمكن للأدمن إعادتها لـ `active`
- الاشتراك المُغلق لا يقبل توزيعات جديدة

### 4.5 Spatie Teams

- دور `investor` في Spatie يتطلب `organization_id` في `model_has_roles`
- `organization_id` الافتراضي للمستثمرين = `1` (المنصة الرئيسية)

---

## 5. نموذج البيانات

### 5.1 جدول `angel_investment_contracts`

| الحقل | النوع | القيود | الوصف |
|-------|-------|--------|-------|
| `id` | bigint | PK, auto-increment | المعرف الأساسي |
| `contract_number` | varchar(50) | NOT NULL, UNIQUE | رقم العقد المرجعي |
| `title` | varchar(255) | NOT NULL | عنوان العقد |
| `status` | varchar(20) | NOT NULL, default='draft' | حالة العقد: `draft`, `active`, `archived` |
| `default_cap_multiple` | decimal(5,2) | NOT NULL | المضاعف الافتراضي للسقف |
| `currency` | varchar(3) | NOT NULL, default='SAR' | رمز العملة |
| `created_at` | timestamp | NOT NULL | وقت الإنشاء |
| `updated_at` | timestamp | NOT NULL | وقت آخر تعديل |

### 5.2 جدول `angel_investment_contract_versions`

| الحقل | النوع | القيود | الوصف |
|-------|-------|--------|-------|
| `id` | bigint | PK, auto-increment | المعرف الأساسي |
| `contract_id` | bigint | FK → contracts.id, NOT NULL | العقد الأب |
| `version` | integer | NOT NULL | رقم النسخة (تصاعدي) |
| `body_template` | text | NOT NULL | نص العقد الكامل (يدعم placeholders) |
| `risk_disclosure_template` | text | NOT NULL | نص الإفصاح عن المخاطر |
| `published_at` | timestamp | nullable | وقت النشر (null = مسودة) |
| `created_at` | timestamp | NOT NULL | وقت الإنشاء |

**Unique constraint:** `(contract_id, version)`

### 5.3 جدول `angel_investment_subscriptions`

| الحقل | النوع | القيود | الوصف |
|-------|-------|--------|-------|
| `id` | bigint | PK, auto-increment | المعرف الأساسي |
| `subscription_code` | varchar(30) | NOT NULL, UNIQUE | كود الاشتراك (مُولَّد تلقائياً) |
| `user_id` | bigint | FK → users.id, NOT NULL | المستثمر |
| `contract_id` | bigint | FK → contracts.id, NOT NULL | العقد |
| `contract_version_id` | bigint | FK → versions.id, NOT NULL | النسخة المُوقَّعة |
| `principal_amount` | decimal(15,2) | NOT NULL | رأس المال بالريال |
| `cap_multiple` | decimal(5,2) | NOT NULL | مضاعف السقف لهذا المركز |
| `status` | varchar(30) | NOT NULL | الحالة: `pending_signature`, `signed_pending_funding`, `active`, `capped`, `paused`, `closed` |
| `signed_at` | timestamp | nullable | وقت توقيع المستثمر |
| `activated_at` | timestamp | nullable | وقت تفعيل الأدمن |
| `created_at` | timestamp | NOT NULL | وقت الإنشاء |
| `updated_at` | timestamp | NOT NULL | وقت آخر تعديل |

**قاعدة محاسبية:** `cap_total = principal_amount × cap_multiple`

### 5.4 جدول `angel_investment_signatures`

| الحقل | النوع | القيود | الوصف |
|-------|-------|--------|-------|
| `id` | bigint | PK, auto-increment | المعرف الأساسي |
| `subscription_id` | bigint | FK → subscriptions.id, UNIQUE | الاشتراك (توقيع واحد فقط) |
| `signer_name` | varchar(255) | NOT NULL | اسم الموقّع (من بيانات المستخدم) |
| `ip_address` | varchar(45) | NOT NULL | عنوان IP عند التوقيع |
| `user_agent` | text | NOT NULL | User-Agent للمتصفح |
| `accepted_at` | timestamp | NOT NULL | وقت التوقيع (UTC) |
| `consent_text_hash` | varchar(64) | NOT NULL | SHA256(version_id|user_id|consent_anchor) |
| `created_at` | timestamp | NOT NULL | وقت الإنشاء |

**ملاحظة أمنية:** `consent_text_hash` يضمن عدم إنكار المستثمر لمحتوى ما وقّع عليه.

### 5.5 جدول `angel_investment_distributions`

| الحقل | النوع | القيود | الوصف |
|-------|-------|--------|-------|
| `id` | bigint | PK, auto-increment | المعرف الأساسي |
| `subscription_id` | bigint | FK → subscriptions.id, NOT NULL | المركز المستفيد |
| `amount` | decimal(15,2) | NOT NULL | مبلغ التوزيع بالريال |
| `currency` | varchar(3) | NOT NULL, default='SAR' | العملة |
| `description` | text | nullable | وصف التوزيع |
| `ledger_entry_id` | bigint | FK → ledger.id, NOT NULL, UNIQUE | إدخال الليدجر المقابل |
| `created_at` | timestamp | NOT NULL | وقت التسجيل |

### 5.6 جدول `angel_investment_audit_logs`

| الحقل | النوع | القيود | الوصف |
|-------|-------|--------|-------|
| `id` | bigint | PK, auto-increment | المعرف الأساسي |
| `actor_user_id` | bigint | FK → users.id, NOT NULL | المستخدم الذي نفّذ الإجراء |
| `action` | varchar(50) | NOT NULL | الإجراء: `create`, `publish_version`, `create_subscription`, `activate`, `distribute`, `pause`, `resume`, `close`, `sign` |
| `subject_type` | varchar(50) | NOT NULL | نوع الكيان: `contract`, `subscription`, `distribution` |
| `subject_id` | bigint | NOT NULL | معرف الكيان |
| `properties` | jsonb | nullable | بيانات إضافية متعلقة بالإجراء |
| `created_at` | timestamp | NOT NULL | وقت التسجيل |

**ملاحظة:** هذا الجدول للكتابة فقط — لا حذف، لا تعديل أبداً.

### 5.7 العلاقات بين الجداول

```
contracts (1) ──────────── (N) contract_versions
contracts (1) ──────────── (N) subscriptions
contract_versions (1) ───── (N) subscriptions
subscriptions (1) ───────── (1) signatures
subscriptions (1) ──────── (N) distributions
distributions (1) ──────── (1) ledger_entries
users (1) ──────────────── (N) subscriptions
users (1) ──────────────── (N) audit_logs (actor)
```

---

## 6. متطلبات API

### 6.1 مسارات المستثمر (`/api/investor/angel-investments/`)

| الرقم | الطريقة | المسار | السكوب | الوصف |
|-------|---------|--------|--------|-------|
| 1 | GET | `/` | `angel:read` | جلب جميع اشتراكات المستثمر |
| 2 | GET | `/statements/portfolio` | `angel:read` | ملخص إجمالي المحفظة |
| 3 | GET | `/{id}` | `angel:read` | تفاصيل اشتراك محدد |
| 4 | GET | `/{id}/contract` | `angel:read` | نص العقد المُصيَّر |
| 5 | POST | `/{id}/sign` | `angel:sign` | توقيع العقد إلكترونياً |
| 6 | GET | `/{id}/statement` | `angel:read` | كشف حساب الاشتراك |
| 7 | GET | `/{id}/ledger` | `angel:ledger` | حركات الليدجر |
| 8 | GET | `/{id}/distributions` | `angel:read` | تاريخ التوزيعات |

### 6.2 مسارات الإدارة (`/api/admin/angel-investments/`)

| الرقم | الطريقة | المسار | الوصف |
|-------|---------|--------|-------|
| 1 | GET | `/overview` | إحصائيات عامة |
| 2 | GET | `/options` | خيارات النماذج (عقود، مستثمرون) |
| 3 | GET | `/investors` | قائمة المستثمرين |
| 4 | GET | `/investors/{userId}/positions` | مراكز مستثمر محدد |
| 5 | POST | `/investors/{userId}/promote` | ترقية مستخدم لمستثمر |
| 6 | GET | `/contracts` | قائمة العقود |
| 7 | POST | `/contracts` | إنشاء عقد جديد |
| 8 | POST | `/contracts/{id}/versions` | نشر نسخة جديدة |
| 9 | GET | `/subscriptions` | قائمة جميع الاشتراكات |
| 10 | POST | `/subscriptions` | إنشاء اشتراك جديد |
| 11 | POST | `/subscriptions/{id}/activate` | تفعيل اشتراك |
| 12 | POST | `/subscriptions/{id}/distribute` | تسجيل توزيع |
| 13 | POST | `/subscriptions/{id}/pause` | إيقاف مؤقت |
| 14 | POST | `/subscriptions/{id}/resume` | استئناف |
| 15 | POST | `/subscriptions/{id}/close` | إغلاق نهائي |
| 16 | GET | `/subscriptions/{id}/ledger-links` | روابط الليدجر |
| 17 | GET | `/audit` | سجل التدقيق |
| 18 | GET | `/reports` | تقارير شاملة |

---

## 7. متطلبات SSO

### 7.1 تدفق المصادقة

1. المستثمر يزور `dasm.com.sa` ويُسجّل دخوله بحسابه العادي
2. يضغط على زر "بوابة المستثمر" في القائمة
3. الفرونتند يستدعي: `POST /api/sso/generate` مع `{platform: "investor", return_url: "..."}`
4. الباكند يتحقق من امتلاك المستخدم دور `investor`
5. الباكند يُنشئ SSO token (JWT أحادي الاستخدام، 5 دقائق)، يتضمن السكوبات: `[angel:read, angel:sign, angel:ledger]`
6. يُعاد توجيه المستخدم إلى: `investor.dasm.com.sa/auth/callback?sso_token=...`
7. بوابة المستثمر تستدعي: `POST /api/sso/verify` مع `{sso_token, platform: "investor"}`
8. الباكند يُصدر Access Token (Sanctum) مدته 30 يوم بالسكوبات المحددة
9. البوابة تخزّن Access Token في `localStorage` وتوجّه للداشبورد

### 7.2 السكوبات والصلاحيات

| السكوب | الصلاحيات |
|--------|-----------|
| `angel:read` | قراءة المراكز، العقود، التوزيعات، الملخصات |
| `angel:sign` | توقيع العقود إلكترونياً |
| `angel:ledger` | عرض سجلات الليدجر المالي |

**ملاحظة:** سكوبات بوابة المستثمر محدودة ومقيّدة — لا يمكن استخدامها للوصول لـ APIs أخرى في المنصة.

### 7.3 متطلبات التوكن

| المعيار | القيمة |
|---------|--------|
| مدة SSO Token | 5 دقائق |
| مدة Access Token | 30 يوماً |
| نوع Access Token | Sanctum Personal Access Token |
| تخزين | localStorage في البوابة |
| Header | `Authorization: Bearer {token}` |

### 7.4 حالات الخطأ في SSO

| الحالة | الكود | الرسالة |
|--------|-------|---------|
| المستخدم غير مُسجَّل دخول | 401 | `Unauthenticated` |
| المستخدم لا يملك دور `investor` | 403 | `Not an investor` |
| SSO token منتهي الصلاحية | 401 | `SSO token expired` |
| SSO token مستخدم مسبقاً | 401 | `SSO token already used` |
| نطاق غير مدعوم | 400 | `Invalid platform` |
