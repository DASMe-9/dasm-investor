# مخططات التدفق
## نظام الاستثمار الملائكي — منصة DASM

> **الإصدار:** 1.0.0
> **التاريخ:** 2026-04-14
> **ملاحظة:** جميع المخططات بصيغة Mermaid — قابلة للعرض مباشرة في GitHub

---

## المخطط 1: دورة حياة الاشتراك الكاملة

```mermaid
stateDiagram-v2
    direction LR

    [*] --> pending_signature : الأدمن ينشئ اشتراكاً جديداً

    pending_signature --> signed_pending_funding : المستثمر يوقّع العقد إلكترونياً\n(POST /investor/sign)\n[يُنشأ سجل في angel_investment_signatures]

    signed_pending_funding --> active : الأدمن يؤكد استلام التمويل\n(POST /admin/activate)\n[إدخال ليدجر TYPE_ANGEL_CAPITAL_IN]

    active --> paused : الأدمن يوقف مؤقتاً\n(POST /admin/pause)\n[لا توزيعات خلال الإيقاف]

    paused --> active : الأدمن يستأنف\n(POST /admin/resume)

    active --> capped : التوزيعات تبلغ السقف\n[paid_to_date >= cap_total]\n[تلقائي عند تسجيل آخر توزيع]

    active --> closed : الأدمن يُغلق نهائياً\n(POST /admin/close)

    paused --> closed : الأدمن يُغلق نهائياً\n(POST /admin/close)

    capped --> [*] : مركز مكتمل — لا توزيعات إضافية
    closed --> [*] : مركز مُغلق — لا عمليات إضافية

    note right of pending_signature
        الحالة الابتدائية دائماً
        subscription_code يُولَّد تلقائياً
        لا ليدجر بعد
    end note

    note right of active
        الحالة الوحيدة التي تقبل توزيعات
        AngelInvestmentMetricsService يحسب التقدم
        realized_multiple = paid_to_date / principal_amount
    end note

    note right of capped
        حالة نهائية تلقائية
        realized_multiple = cap_multiple
        المستثمر استوفى عائده كاملاً
    end note
```

---

## المخطط 2: تدفق SSO الكامل

```mermaid
sequenceDiagram
    autonumber
    participant U as المستثمر (المتصفح)
    participant D as dasm.com.sa (Frontend)
    participant API as api.dasm.com.sa (Backend)
    participant P as investor.dasm.com.sa (بوابة المستثمر)
    participant DB as Supabase (قاعدة البيانات)

    U->>D: يضغط "بوابة المستثمر"
    D->>API: POST /api/sso/generate\n{platform: "investor", return_url: "..."}\nAuthorization: Bearer {main_token}

    API->>DB: تحقق من دور المستخدم
    DB-->>API: {role: "investor"} ✓

    alt المستخدم لا يملك دور investor
        API-->>D: 403 Forbidden\n{"message": "Not an investor"}
        D-->>U: رسالة خطأ: "ليس لديك صلاحية الوصول"
    end

    API->>API: أنشئ SSO JWT Token\n(TTL: 5 دقائق، single-use)\nscopes: [angel:read, angel:sign, angel:ledger]
    API-->>D: 200 OK\n{sso_token: "eyJ...", expires_in: 300}

    D->>U: redirect → investor.dasm.com.sa/auth/callback?sso_token=eyJ...

    U->>P: يصل لصفحة /auth/callback

    P->>API: POST /api/sso/verify\n{sso_token: "eyJ...", platform: "investor"}

    API->>DB: تحقق من التوكن (غير مستخدم؟ لم ينته؟)
    DB-->>API: ✓ صالح وغير مستخدم

    alt التوكن منتهي الصلاحية (مضى أكثر من 5 دقائق)
        API-->>P: 401\n{"message": "SSO token expired"}
        P-->>U: redirect → dasm.com.sa/auth/sso?error=expired
    end

    alt التوكن مستخدم مسبقاً (إعادة استخدام مشبوهة)
        API->>DB: سجّل في audit_logs (حادثة أمنية)
        API-->>P: 401\n{"message": "SSO token already used"}
        P-->>U: redirect → dasm.com.sa?error=security
    end

    API->>DB: أبطل التوكن (mark as used)
    API->>DB: أنشئ Sanctum Personal Access Token\n(TTL: 30 يوماً)\nscopes: [angel:read, angel:sign, angel:ledger]

    API-->>P: 200 OK\n{access_token: "...", user: {id, name, email}}

    P->>P: localStorage.setItem("investor_token", access_token)
    P->>U: redirect → /dashboard

    U->>P: GET /dashboard
    P->>API: GET /api/investor/angel-investments\nAuthorization: Bearer {access_token}
    API->>DB: جلب مراكز المستثمر
    DB-->>API: [{subscription_code, status, progress...}]
    API-->>P: 200 OK - بيانات المحفظة
    P-->>U: عرض الداشبورد
```

---

## المخطط 3: تدفق التوقيع الإلكتروني

```mermaid
sequenceDiagram
    autonumber
    participant U as المستثمر
    participant P as investor.dasm.com.sa
    participant API as api.dasm.com.sa
    participant DB as Supabase

    U->>P: يفتح صفحة المركز\n/subscription/{id}
    P->>API: GET /api/investor/angel-investments/{id}\nBearer {access_token}
    API-->>P: {status: "pending_signature", contract_version_id: 3, ...}

    P->>P: يعرض زر "عرض العقد وتوقيعه"
    U->>P: يضغط "عرض العقد"

    P->>API: GET /api/investor/angel-investments/{id}/contract
    API->>DB: جلب نسخة العقد (contract_version_id)
    DB-->>API: {body_template, risk_disclosure_template, version: 3}

    API->>API: AngelInvestmentContractRenderer يستبدل:\n{{investor_name}} → اسم المستثمر\n{{principal_amount}} → المبلغ\n{{cap_multiple}} → المضاعف\n{{cap_total}} → السقف الكلي

    API-->>P: {rendered_body: "...", rendered_risk_disclosure: "...", version: 3}
    P-->>U: عرض نص العقد كاملاً + الإفصاح عن المخاطر

    U->>U: يقرأ العقد
    U->>P: يضغط "أوافق وأوقّع"

    P->>P: يتحقق من تمرير المستخدم لنهاية النص\n(scroll validation)
    P->>API: POST /api/investor/angel-investments/{id}/sign\nBearer {access_token}\n{accepted: true}

    API->>API: تحقق: accepted === true ؟
    alt accepted = false أو مفقود
        API-->>P: 422 {message: "Must explicitly accept the contract"}
        P-->>U: رسالة خطأ
    end

    API->>DB: تحقق: status = 'pending_signature' ؟
    alt الاشتراك ليس في حالة pending_signature
        API-->>P: 422 {message: "Subscription is not awaiting signature"}
        P-->>U: رسالة خطأ
    end

    API->>DB: تحقق: لا يوجد توقيع مسبق؟
    alt توقيع موجود مسبقاً
        API-->>P: 422 {message: "Subscription already signed"}
        P-->>U: "لقد وقّعت على هذا العقد مسبقاً"
    end

    API->>API: احسب: hash = SHA256(version_id|user_id|consent_anchor)\nmثال: SHA256("3|142|أوافق على شروط الاستثمار الملائكي...")

    Note over API: consent_anchor = نص ثابت في الكود\nيُعرف في config/angel_investment.php

    API->>DB: BEGIN TRANSACTION
    API->>DB: INSERT INTO angel_investment_signatures\n(subscription_id, signer_name, ip_address, user_agent, accepted_at, consent_text_hash)
    API->>DB: UPDATE angel_investment_subscriptions\nSET status='signed_pending_funding', signed_at=NOW()\nWHERE id={id}
    API->>DB: INSERT INTO angel_investment_audit_logs\n(actor_user_id={userId}, action='sign', subject_type='subscription', subject_id={id})
    API->>DB: COMMIT

    API-->>P: 200 OK\n{status: "signed_pending_funding", signed_at: "2026-04-14T..."}

    P-->>U: رسالة نجاح:\n"تم توقيع العقد بنجاح!\nسيتواصل معك الفريق لتأكيد استلام التمويل."
    P->>P: تحديث واجهة المركز (إخفاء زر التوقيع)
```

---

## المخطط 4: تدفق التوزيع وحساب السقف

```mermaid
flowchart TD
    A([الأدمن يقرر تسجيل توزيع]) --> B[يفتح لوحة الإدارة\ncontrol.dasm.com.sa]
    B --> C[يختار المركز النشط\nويُدخل:\n• مبلغ التوزيع\n• العملة\n• وصف اختياري]
    C --> D{POST /admin/subscriptions/ID/distribute}

    D --> E{تحقق من صحة البيانات}
    E -- "مبلغ سالب أو صفر" --> F[422: Amount must be > 0]
    E -- "عملة غير مطابقة" --> G[422: Currency mismatch]
    E -- "المركز غير نشط" --> H[422: Subscription is not active]
    E -- "✓ بيانات صحيحة" --> I

    I[BEGIN DB TRANSACTION]

    I --> J[INSERT INTO ledger_entries\ntype = TYPE_ANGEL_DISTRIBUTION\namount = X\nrelated_entity = subscription_id]

    J --> K[INSERT INTO angel_investment_distributions\nsubscription_id = ID\namount = X\ncurrency = SAR\ndescription = ...\nledger_entry_id = new_entry.id]

    K --> L[INSERT INTO angel_investment_audit_logs\naction = distribute\nproperties = amount, description]

    L --> M[احسب paid_to_date\n= SUM distributions.amount\nWHERE subscription_id = ID]

    M --> N{paid_to_date >= cap_total ؟}

    N -- "لا — لم يبلغ السقف" --> O[COMMIT TRANSACTION]
    N -- "نعم — بلغ السقف!" --> P[UPDATE subscriptions\nSET status = capped\nWHERE id = ID]
    P --> Q[INSERT audit_log\naction = auto_capped]
    Q --> O

    O --> R[200 OK\nreturn distribution details\n+ updated metrics]

    R --> S{هل status = capped ؟}
    S -- "لا" --> T[لوحة الإدارة:\nتُحدَّث أرقام المركز\npaid_to_date / remaining]
    S -- "نعم" --> U[لوحة الإدارة:\nإشعار: المركز بلغ سقفه!\nزر التوزيع يختفي]

    T --> V([المستثمر يرى التحديث في بوابته])
    U --> W([المستثمر يرى حالة CAPPED\n+ realized_multiple النهائي])
```

---

## المخطط 5: نموذج البيانات (ER Diagram)

```mermaid
erDiagram
    users {
        bigint id PK
        string name
        string email
        string password_hash
        string type
    }

    angel_investment_contracts {
        bigint id PK
        string contract_number UK
        string title
        string status
        decimal default_cap_multiple
        string currency
        timestamp created_at
        timestamp updated_at
    }

    angel_investment_contract_versions {
        bigint id PK
        bigint contract_id FK
        int version
        text body_template
        text risk_disclosure_template
        timestamp published_at
        timestamp created_at
    }

    angel_investment_subscriptions {
        bigint id PK
        string subscription_code UK
        bigint user_id FK
        bigint contract_id FK
        bigint contract_version_id FK
        decimal principal_amount
        decimal cap_multiple
        string status
        timestamp signed_at
        timestamp activated_at
        timestamp created_at
        timestamp updated_at
    }

    angel_investment_signatures {
        bigint id PK
        bigint subscription_id FK_UK
        string signer_name
        string ip_address
        text user_agent
        timestamp accepted_at
        string consent_text_hash
        timestamp created_at
    }

    angel_investment_distributions {
        bigint id PK
        bigint subscription_id FK
        decimal amount
        string currency
        text description
        bigint ledger_entry_id FK_UK
        timestamp created_at
    }

    angel_investment_audit_logs {
        bigint id PK
        bigint actor_user_id FK
        string action
        string subject_type
        bigint subject_id
        jsonb properties
        timestamp created_at
    }

    ledger_entries {
        bigint id PK
        string type
        decimal amount
        string related_entity_type
        bigint related_entity_id
        timestamp created_at
    }

    users ||--o{ angel_investment_subscriptions : "يملك"
    users ||--o{ angel_investment_audit_logs : "ينفّذ"
    angel_investment_contracts ||--o{ angel_investment_contract_versions : "له نسخ"
    angel_investment_contracts ||--o{ angel_investment_subscriptions : "له اشتراكات"
    angel_investment_contract_versions ||--o{ angel_investment_subscriptions : "يُستخدم في"
    angel_investment_subscriptions ||--|| angel_investment_signatures : "له توقيع"
    angel_investment_subscriptions ||--o{ angel_investment_distributions : "له توزيعات"
    angel_investment_distributions ||--|| ledger_entries : "مرتبط بـ"
```

---

## المخطط 6: تدفق حساب المقاييس

```mermaid
flowchart LR
    A[(angel_investment_subscriptions\nprincipal_amount = 500,000\ncap_multiple = 2.0)] --> B

    B[(angel_investment_distributions\nWHERE subscription_id = X\nSUM amounts)]

    B --> C[paid_to_date\n= 150,000 ريال]
    A --> D[cap_total\n= 500,000 × 2.0\n= 1,000,000 ريال]

    C --> E[remaining_to_cap\n= cap_total - paid_to_date\n= 1,000,000 - 150,000\n= 850,000 ريال]

    C --> F[realized_multiple\n= paid_to_date / principal_amount\n= 150,000 / 500,000\n= 0.30×]

    D --> E
    C --> G[progress_percent\n= paid_to_date / cap_total × 100\n= 150,000 / 1,000,000 × 100\n= 15%]
    D --> G

    E --> H[(AngelInvestmentMetricsService\nيجمع الأرقام النهائية)]
    F --> H
    G --> H
    A --> H

    H --> I[استجابة API\n{\n  principal: 500000\n  cap_total: 1000000\n  paid_to_date: 150000\n  remaining_to_cap: 850000\n  realized_multiple: 0.30\n  progress_percent: 15\n  status: active\n}]

    I --> J[الداشبورد يعرض:\nشريط تقدم 15%\n850,000 ريال متبقي\nX0.30 عائد محقق]
```

---

## المخطط 7: تدفق العقد الكامل من الأدمن

```mermaid
flowchart TD
    A([الأدمن يريد إنشاء برنامج استثمار جديد]) --> B

    B[إنشاء عقد\nPOST /admin/contracts\n{\n  contract_number: ANGEL-2026-001\n  title: برنامج المستثمرين الملائكيين\n  default_cap_multiple: 2.0\n  currency: SAR\n}]

    B --> C{تحقق من contract_number}
    C -- "مكرر" --> D[422: Contract number exists]
    C -- "✓ فريد" --> E[(INSERT INTO contracts\nstatus = draft)]

    E --> F[نشر النسخة الأولى\nPOST /admin/contracts/ID/versions\n{\n  version: 1\n  body_template: نص العقد الكامل...\n  risk_disclosure_template: الإفصاح...\n}]

    F --> G{تحقق من الـ version رقم}
    G -- "مكرر لهذا العقد" --> H[422: Version exists]
    G -- "✓ جديد" --> I[(INSERT INTO contract_versions\npublished_at = NOW())]

    I --> J[العقد جاهز للاشتراكات]

    J --> K[إنشاء اشتراك للمستثمر\nPOST /admin/subscriptions\n{\n  user_id: 142\n  contract_id: 5\n  principal_amount: 500000\n  cap_multiple: 2.0\n}]

    K --> L{تحقق من المستثمر}
    L -- "لا يملك دور investor" --> M[422: User is not an investor]
    L -- "✓ مستثمر مؤهل" --> N[(INSERT INTO subscriptions\nstatus = pending_signature\nsubscription_code = ANGEL-X4K2-2026)]

    N --> O[إشعار للمستثمر:\nلديك عقد جديد بانتظار توقيعك]

    O --> P{هل المستثمر وقّع؟}
    P -- "لم يوقّع بعد" --> Q[الحالة: pending_signature\nالأدمن ينتظر]
    P -- "وقّع" --> R[الحالة: signed_pending_funding\nالأدمن يُؤكد استلام التمويل]

    Q --> P

    R --> S[تفعيل الاشتراك\nPOST /admin/subscriptions/ID/activate]

    S --> T[(BEGIN TRANSACTION\nUPDATE subscriptions\nSET status = active\nactivated_at = NOW()\n\nINSERT INTO ledger_entries\ntype = TYPE_ANGEL_CAPITAL_IN\namount = 500000\n\nINSERT INTO audit_logs\naction = activate\nCOMMIT)]

    T --> U([المركز نشط\nجاهز لاستقبال التوزيعات])
```
