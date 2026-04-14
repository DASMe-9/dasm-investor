# FLOWCHARTS — برنامج أصدقاء الدعم المبكر

---

## مخطط 1: دورة حياة المشارك الكاملة

```mermaid
stateDiagram-v2
    direction LR
    [*] --> جديد : تسجيل + أول مساهمة

    جديد --> صغار_غير_مفعّل : تراكمي المجموعة < 150K

    صغار_غير_مفعّل --> صغار_مفعّل : تراكمي المجموعة ≥ 150K
    صغار_غير_مفعّل --> كبار : مساهمة فردية ≥ 100K

    صغار_مفعّل --> مرحلة_2x : يبدأ استلام التوزيعات (0x → 2x بـ 100%)
    صغار_مفعّل --> كبار : تجاوز 100K تراكمياً

    مرحلة_2x --> مرحلة_3x : استلم ضعفي مساهمته (50% من الحصة)
    مرحلة_3x --> مرحلة_4x : استلم 3x (25% من الحصة)
    مرحلة_4x --> منتهي : استلم 4x — انتهت الحقوق تلقائياً

    كبار --> يستلم_من_صافي : يأخذ نسبته من صافي الربح
    يستلم_من_صافي --> منتهي : استلم 4x

    منتهي --> [*]
```

---

## مخطط 2: خوارزمية حساب التوزيع الشهري

```mermaid
flowchart TD
    A([بداية الشهر]) --> B{هل تراكمي الصغار ≥ 150K؟}

    B -- لا --> C[🔴 لا توزيع للصغار\nاعرض: متبقي X ر.س]
    B -- نعم --> D[احسب وعاء الصغار\n= إجمالي الدخل × 15%]

    D --> E[لكل مشارك صغير]
    E --> F[احسب نسبته التراكمية\n= مساهمته ÷ إجمالي مساهمات الصغار]
    F --> G[احسب حصته المبدئية\n= وعاء الصغار × نسبته]
    G --> H{ما مضاعفه الحالي؟\nاستلم ÷ ساهم}

    H -- أقل من 2x --> I[✅ الحصة الكاملة 100%]
    H -- 2x إلى 3x --> J[⚡ نصف الحصة 50%]
    H -- 3x إلى 4x --> K[💛 ربع الحصة 25%]
    H -- 4x فأكثر --> L[⛔ صفر — انتهت الحقوق]

    I --> M[أضف للتوزيع الشهري]
    J --> M
    K --> M
    L --> N[عرض رسالة انتهاء الحقوق]

    M --> O{هل يوجد كبار؟}
    O -- لا --> P[انتهى الحساب للصغار]
    O -- نعم --> Q[احسب وعاء الكبار\n= صافي الربح]

    Q --> R[لكل مشارك كبير]
    R --> S[نسبته = مساهمته ÷ إجمالي مساهمات الكبار]
    S --> T[حصته = وعاء الكبار × نسبته]
    T --> U{مضاعفه؟}

    U -- < 4x --> V[✅ يستلم حصته]
    U -- ≥ 4x --> W[⛔ انتهت حقوقه]

    V --> X([نهاية — تجميع التوزيعات])
    W --> X
    P --> X
    N --> X
```

---

## مخطط 3: آلية المضاعف المتناقص

```mermaid
flowchart LR
    A([مساهمة 10,000 ر.س]) --> B

    B["المرحلة 1: 0x → 2x\nيستلم 100% من حصته\nحتى يصل لـ 20,000 ر.س إجمالي"] --> C

    C{وصل 2x؟\n20,000 استلم}

    C -- نعم --> D["المرحلة 2: 2x → 3x\nيستلم 50% من حصته\nحتى يصل لـ 30,000 ر.س إجمالي"]
    C -- لا --> B

    D --> E{وصل 3x؟\n30,000 استلم}

    E -- نعم --> F["المرحلة 3: 3x → 4x\nيستلم 25% من حصته\nحتى يصل لـ 40,000 ر.س إجمالي"]
    E -- لا --> D

    F --> G{وصل 4x؟\n40,000 استلم}

    G -- نعم --> H[⛔ انتهت الحقوق تلقائياً\nلا مزيد من التوزيعات]
    G -- لا --> F

    style B fill:#10b981,color:#fff
    style D fill:#f59e0b,color:#fff
    style F fill:#ef4444,color:#fff
    style H fill:#374151,color:#fff
```

---

## مخطط 4: نموذج الدخل والخصومات

```mermaid
flowchart TD
    A([صفقات المنصة]) --> B

    B["عدد 250 × 250\n+ عدد 500 × 500\n+ عدد 1000 × 1000\n= إجمالي العمولات"]

    B --> C["+ ضريبة 15%\n= إجمالي الدخل"]

    C --> D1["للصغار:\n× 15% = وعاء الصغار"]
    C --> E["− رسوم بوابة 2.45%\n= صافي للمنصة"]

    E --> F["− عمولات شركاء 20%\n= صافي الربح"]

    F --> G["للكبار:\nنسبتهم × صافي الربح"]

    D1 --> H([توزيع الصغار])
    G --> I([توزيع الكبار])

    style D1 fill:#3b82f6,color:#fff
    style G fill:#8b5cf6,color:#fff
    style H fill:#10b981,color:#fff
    style I fill:#10b981,color:#fff
```

---

## مخطط 5: قرار التخارج

```mermaid
flowchart TD
    A([طلب تخارج]) --> B{هل مرّت 3 سنوات\nمن أول مساهمة؟}

    B -- لا --> C[⛔ مدة الحظر لم تنته\nاعرض الموعد المتوقع]

    B -- نعم --> D{هل أعطى إشعار\n3 أشهر مسبقاً؟}

    D -- لا --> E[⚠️ يجب إشعار 3 أشهر مسبقاً]

    D -- نعم --> F{ما تصنيف المشارك؟}

    F -- صغار / أبطال --> G{هل الكاش\nمتوفر؟}
    F -- كبار\nمساهمة واحدة كبيرة --> H[⛔ لا تخارج\nحسب شروط البرنامج]

    G -- نعم --> I["✅ يُعاد رأس المال فقط\n= إجمالي مساهماته التراكمية\nلا أرباح إضافية عند التخارج"]
    G -- لا --> J[⏳ انتظر توفر الكاش\nأو اتفاق خاص]

    I --> K([انتهى — سُدّد رأس المال])
    K --> L[حقوقه في التوزيعات\nتنتهي فور التخارج]

    style H fill:#ef4444,color:#fff
    style I fill:#10b981,color:#fff
    style C fill:#f59e0b,color:#fff
```

---

## مخطط 6: نموذج البيانات (سيميوليشن)

```mermaid
erDiagram
    SIMULATION_STATE {
        string id
        string name
        date created_at
    }

    PARTICIPANT {
        string id
        string name
        string tier
        number total_contributed
        number total_received
        number current_multiplier
        string phase
        boolean rights_ended
    }

    MONTHLY_CONTRIBUTION {
        string participant_id
        string year_month
        number amount
    }

    MONTHLY_INCOME {
        string year_month
        number deals_250
        number deals_500
        number deals_1000
        number gross_revenue
        number vat
        number total_income
        number gateway_fees
        number partner_commissions
        number net_profit
    }

    MONTHLY_DISTRIBUTION {
        string participant_id
        string year_month
        number calculated_share
        number multiplier_factor
        number actual_distribution
        string phase_at_time
    }

    EXIT_SCENARIO {
        string participant_id
        string scenario
        number principal_to_return
        number total_received_before_exit
        number profit_ratio
        boolean eligible
        string reason_if_not
    }

    SIMULATION_STATE ||--o{ PARTICIPANT : "contains"
    PARTICIPANT ||--o{ MONTHLY_CONTRIBUTION : "has"
    PARTICIPANT ||--o{ MONTHLY_DISTRIBUTION : "receives"
    PARTICIPANT ||--o{ EXIT_SCENARIO : "evaluated_in"
    MONTHLY_INCOME ||--o{ MONTHLY_DISTRIBUTION : "generates"
```

---

## مخطط 7: تدفق واجهة المستخدم (UX Flow)

```mermaid
flowchart TD
    A([يفتح /simulation]) --> B[لوحة المقاييس الإجمالية\nعرض الحالة الافتراضية]

    B --> C{يختار تاب}

    C --> D[المشاركون\nإضافة / تعديل / حذف]
    C --> E[نموذج الدخل\nإدخال الصفقات الشهرية]
    C --> F[التوزيعات\nعرض الجدول الشهري]
    C --> G[ماذا لو\nتغيير المتغيرات]
    C --> H[التخارج\nالسيناريوهات الثلاثة]
    C --> I[التصدير\nJSON / CSV]

    D --> J{تغيير بيانات؟}
    E --> J
    G --> J

    J -- نعم --> K[إعادة حساب فورية\nلكل التوزيعات والمقاييس]
    K --> B

    F --> L[عرض جدول شهري\nمع ألوان المراحل]
    H --> M[عرض 3 جداول\nسيناريو 2026 / 2027 / 2028]
    I --> N[تنزيل JSON أو CSV]

    style K fill:#10b981,color:#fff
    style B fill:#3b82f6,color:#fff
```

---

## مخطط 8: ترقي الشريحة (صغار → كبار)

```mermaid
sequenceDiagram
    participant N as النظام
    participant S as سالم (مثال)
    participant G as مجموعة الكبار

    Note over S: يبدأ صغير — 1,000 ر.س/شهر
    loop كل شهر 2026-2027
        S->>N: مساهمة شهرية
        N->>N: مساهمات تراكمية += 1,000
        N->>S: يستلم حصته من وعاء الصغار
    end

    Note over S: بعد 100 شهر / مساهمات كبيرة مفردة
    N->>N: تحقق: مساهمات سالم ≥ 100,000 ر.س؟

    alt نعم — تجاوز 100K
        N->>S: 🔵 تم ترقيتك لشريحة الكبار
        N->>G: أضف سالم لوعاء الكبار
        Note over S,G: من الآن: سالم يأخذ من صافي الربح\nليس من إجمالي الدخل
        Note over S: مثال من الملف: سالم في يناير 2028\nأول شهر كـ كبير
    else لا
        N->>S: يستمر في شريحة الصغار
    end
```
