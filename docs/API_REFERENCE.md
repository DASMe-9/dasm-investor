# مرجع API الكامل
## نظام الاستثمار الملائكي — منصة DASM

> **الإصدار:** 1.0.0
> **التاريخ:** 2026-04-14
> **Base URL:** `https://api.dasm.com.sa`
> **Content-Type:** `application/json`
> **Accept:** `application/json`

---

## جدول المحتويات

1. [المصادقة والـ Headers](#1-المصادقة-والـ-headers)
2. [نظام SSO](#2-نظام-sso)
3. [API المستثمر](#3-api-المستثمر)
4. [API الإدارة](#4-api-الإدارة)
5. [أكواد الخطأ المشتركة](#5-أكواد-الخطأ-المشتركة)
6. [متغيرات البيئة](#6-متغيرات-البيئة)

---

## 1. المصادقة والـ Headers

### Headers المطلوبة في جميع الطلبات

```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

### أنواع التوكنات

| النوع | المصدر | مدة الصلاحية | الاستخدام |
|-------|--------|--------------|-----------|
| Main Token | تسجيل الدخول في `dasm.com.sa` | 30 يوماً | طلبات المنصة الرئيسية |
| SSO Token | `POST /api/sso/generate` | 5 دقائق | نقل الهوية للبوابة (أحادي الاستخدام) |
| Investor Token | `POST /api/sso/verify` | 30 يوماً | طلبات بوابة المستثمر فقط |

---

## 2. نظام SSO

### 2.1 توليد توكن SSO

**وصف:** يُستدعى من `dasm.com.sa` لتوليد توكن انتقال للبوابة الاستثمارية.

```http
POST /api/sso/generate
Authorization: Bearer {main_access_token}
```

**Request Body:**
```json
{
  "platform": "investor",
  "return_url": "https://investor.dasm.com.sa/dashboard"
}
```

**Response — 200 OK:**
```json
{
  "sso_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expires_in": 300,
  "scopes": ["angel:read", "angel:sign", "angel:ledger"],
  "redirect_url": "https://investor.dasm.com.sa/auth/callback?sso_token=eyJ..."
}
```

**أكواد الخطأ:**

| الكود | الحالة | الرسالة |
|-------|--------|---------|
| 401 | غير مُوثَّق | `{"message": "Unauthenticated"}` |
| 403 | لا يملك دور investor | `{"message": "Not an investor", "error": "insufficient_role"}` |
| 400 | منصة غير مدعومة | `{"message": "Invalid platform", "supported": ["investor"]}` |
| 422 | `return_url` غير صالح | `{"message": "Invalid return_url"}` |

---

### 2.2 التحقق من توكن SSO

**وصف:** يُستدعى من `investor.dasm.com.sa` للتحقق من التوكن وإصدار Access Token للبوابة.

```http
POST /api/sso/verify
```

**Request Body:**
```json
{
  "sso_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "platform": "investor"
}
```

**Response — 200 OK:**
```json
{
  "access_token": "3|abcdef1234567890...",
  "token_type": "Bearer",
  "expires_in": 2592000,
  "scopes": ["angel:read", "angel:sign", "angel:ledger"],
  "user": {
    "id": 142,
    "name": "أحمد بن محمد العتيبي",
    "email": "ahmed@example.com"
  }
}
```

**أكواد الخطأ:**

| الكود | الحالة | الرسالة |
|-------|--------|---------|
| 401 | توكن منتهي الصلاحية | `{"message": "SSO token expired", "error": "token_expired"}` |
| 401 | توكن مستخدم مسبقاً | `{"message": "SSO token already used", "error": "token_consumed"}` |
| 400 | توكن غير صالح | `{"message": "Invalid SSO token", "error": "token_invalid"}` |
| 400 | منصة غير مطابقة | `{"message": "Platform mismatch", "error": "platform_mismatch"}` |

---

## 3. API المستثمر

**Base Path:** `/api/investor/angel-investments`
**المصادقة:** Investor Access Token (من SSO)
**CORS:** مسموح من `https://investor.dasm.com.sa` فقط

---

### 3.1 جلب جميع الاشتراكات

```http
GET /api/investor/angel-investments
Authorization: Bearer {investor_token}
Scope: angel:read
```

**Response — 200 OK:**
```json
{
  "data": [
    {
      "id": 5,
      "subscription_code": "ANGEL-X4K2-26",
      "status": "active",
      "contract": {
        "id": 2,
        "title": "برنامج المستثمرين الملائكيين 2026",
        "contract_number": "ANGEL-2026-001"
      },
      "principal_amount": "500000.00",
      "cap_multiple": "2.00",
      "metrics": {
        "cap_total": "1000000.00",
        "paid_to_date": "150000.00",
        "remaining_to_cap": "850000.00",
        "realized_multiple": "0.30",
        "progress_percent": 15
      },
      "signed_at": "2026-03-15T10:30:00Z",
      "activated_at": "2026-03-20T08:00:00Z",
      "currency": "SAR"
    }
  ],
  "meta": {
    "total": 1,
    "active_count": 1
  }
}
```

---

### 3.2 ملخص المحفظة الإجمالي

```http
GET /api/investor/angel-investments/statements/portfolio
Authorization: Bearer {investor_token}
Scope: angel:read
```

**Response — 200 OK:**
```json
{
  "data": {
    "total_principal_invested": "700000.00",
    "total_paid_to_date": "210000.00",
    "total_remaining_to_cap": "1090000.00",
    "total_cap_value": "1300000.00",
    "overall_progress_percent": 16.15,
    "positions_count": {
      "total": 2,
      "active": 2,
      "capped": 0,
      "paused": 0,
      "closed": 0,
      "pending_signature": 0
    },
    "currency": "SAR"
  }
}
```

---

### 3.3 تفاصيل اشتراك محدد

```http
GET /api/investor/angel-investments/{id}
Authorization: Bearer {investor_token}
Scope: angel:read
```

**Path Parameters:**
- `id` — معرف الاشتراك (bigint)

**Response — 200 OK:**
```json
{
  "data": {
    "id": 5,
    "subscription_code": "ANGEL-X4K2-26",
    "status": "active",
    "contract": {
      "id": 2,
      "title": "برنامج المستثمرين الملائكيين 2026",
      "contract_number": "ANGEL-2026-001",
      "currency": "SAR"
    },
    "contract_version": {
      "version": 1,
      "published_at": "2026-02-01T00:00:00Z"
    },
    "principal_amount": "500000.00",
    "cap_multiple": "2.00",
    "metrics": {
      "cap_total": "1000000.00",
      "paid_to_date": "150000.00",
      "remaining_to_cap": "850000.00",
      "realized_multiple": "0.30",
      "progress_percent": 15
    },
    "is_signed": true,
    "signed_at": "2026-03-15T10:30:00Z",
    "activated_at": "2026-03-20T08:00:00Z",
    "created_at": "2026-03-10T09:00:00Z",
    "recent_distributions": [
      {
        "id": 12,
        "amount": "15000.00",
        "currency": "SAR",
        "description": "توزيع شهر مارس 2026",
        "created_at": "2026-03-31T12:00:00Z"
      }
    ]
  }
}
```

**أكواد الخطأ:**

| الكود | الحالة |
|-------|--------|
| 404 | `{"message": "Subscription not found"}` |
| 403 | `{"message": "Forbidden"}` — محاولة الوصول لمركز مستثمر آخر |

---

### 3.4 جلب نص العقد المُصيَّر

```http
GET /api/investor/angel-investments/{id}/contract
Authorization: Bearer {investor_token}
Scope: angel:read
```

**Response — 200 OK:**
```json
{
  "data": {
    "subscription_id": 5,
    "contract_number": "ANGEL-2026-001",
    "version": 1,
    "rendered_body": "<h1>عقد الاستثمار الملائكي</h1><p>يُبرم هذا العقد بين منصة داسم وبين المستثمر أحمد بن محمد العتيبي...</p>...",
    "rendered_risk_disclosure": "<h2>الإفصاح عن المخاطر</h2><p>يُقر المستثمر...</p>...",
    "consent_anchor": "أوافق على شروط وأحكام عقد الاستثمار الملائكي الصادر عن منصة داسم",
    "is_signed": false,
    "published_at": "2026-02-01T00:00:00Z"
  }
}
```

---

### 3.5 التوقيع على العقد

```http
POST /api/investor/angel-investments/{id}/sign
Authorization: Bearer {investor_token}
Scope: angel:sign
```

**Request Body:**
```json
{
  "accepted": true
}
```

**Response — 200 OK:**
```json
{
  "data": {
    "subscription_id": 5,
    "status": "signed_pending_funding",
    "signed_at": "2026-04-14T14:30:00Z",
    "signer_name": "أحمد بن محمد العتيبي",
    "message": "تم توقيع العقد بنجاح. سيتواصل معك فريق داسم لتأكيد استلام التمويل."
  }
}
```

**أكواد الخطأ:**

| الكود | الرسالة |
|-------|---------|
| 422 | `{"message": "Must explicitly accept the contract", "error": "acceptance_required"}` |
| 422 | `{"message": "Subscription is not awaiting signature", "error": "invalid_status", "current_status": "active"}` |
| 422 | `{"message": "Subscription already signed", "error": "already_signed"}` |
| 403 | `{"message": "Forbidden"}` |

---

### 3.6 كشف حساب الاشتراك

```http
GET /api/investor/angel-investments/{id}/statement
Authorization: Bearer {investor_token}
Scope: angel:read
```

**Response — 200 OK:**
```json
{
  "data": {
    "subscription": {
      "subscription_code": "ANGEL-X4K2-26",
      "principal_amount": "500000.00",
      "cap_total": "1000000.00"
    },
    "summary": {
      "paid_to_date": "150000.00",
      "remaining_to_cap": "850000.00",
      "realized_multiple": "0.30",
      "progress_percent": 15
    },
    "distributions_timeline": [
      {
        "date": "2026-03-31",
        "amount": "75000.00",
        "description": "توزيع Q1 2026",
        "running_total": "75000.00"
      },
      {
        "date": "2026-03-15",
        "amount": "75000.00",
        "description": "توزيع خاص — مارس",
        "running_total": "150000.00"
      }
    ]
  }
}
```

---

### 3.7 حركات الليدجر

```http
GET /api/investor/angel-investments/{id}/ledger
Authorization: Bearer {investor_token}
Scope: angel:ledger
```

**Query Parameters:**

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `page` | integer | رقم الصفحة (default: 1) |
| `per_page` | integer | عدد النتائج (default: 20, max: 100) |

**Response — 200 OK:**
```json
{
  "data": [
    {
      "id": 201,
      "type": "TYPE_ANGEL_CAPITAL_IN",
      "amount": "500000.00",
      "direction": "in",
      "description": "استلام رأس المال الاستثماري",
      "created_at": "2026-03-20T08:00:00Z"
    },
    {
      "id": 215,
      "type": "TYPE_ANGEL_DISTRIBUTION",
      "amount": "75000.00",
      "direction": "out",
      "description": "توزيع Q1 2026",
      "created_at": "2026-03-31T12:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 3
  }
}
```

---

### 3.8 تاريخ التوزيعات

```http
GET /api/investor/angel-investments/{id}/distributions
Authorization: Bearer {investor_token}
Scope: angel:read
```

**Response — 200 OK:**
```json
{
  "data": [
    {
      "id": 12,
      "amount": "75000.00",
      "currency": "SAR",
      "description": "توزيع Q1 2026",
      "created_at": "2026-03-31T12:00:00Z"
    },
    {
      "id": 8,
      "amount": "75000.00",
      "currency": "SAR",
      "description": "توزيع خاص — مارس",
      "created_at": "2026-03-15T10:00:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "total_amount": "150000.00"
  }
}
```

---

## 4. API الإدارة

**Base Path:** `/api/admin/angel-investments`
**المصادقة:** Admin Token (من تسجيل دخول المنصة الرئيسية)
**الصلاحية:** دور `super_admin` أو `admin`

---

### 4.1 نظرة عامة (Overview)

```http
GET /api/admin/angel-investments/overview
Authorization: Bearer {admin_token}
```

**Response — 200 OK:**
```json
{
  "data": {
    "total_investors": 12,
    "total_subscriptions": 18,
    "total_principal_invested": "8500000.00",
    "total_distributions_paid": "2340000.00",
    "subscriptions_by_status": {
      "pending_signature": 2,
      "signed_pending_funding": 1,
      "active": 10,
      "paused": 1,
      "capped": 3,
      "closed": 1
    },
    "currency": "SAR"
  }
}
```

---

### 4.2 قائمة المستثمرين

```http
GET /api/admin/angel-investments/investors
Authorization: Bearer {admin_token}
```

**Query Parameters:**

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `search` | string | بحث بالاسم أو البريد |
| `page` | integer | رقم الصفحة |

**Response — 200 OK:**
```json
{
  "data": [
    {
      "id": 142,
      "name": "أحمد بن محمد العتيبي",
      "email": "ahmed@example.com",
      "positions_count": 2,
      "total_principal": "700000.00",
      "total_paid": "210000.00"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 12
  }
}
```

---

### 4.3 ترقية مستخدم لمستثمر

```http
POST /api/admin/angel-investments/investors/{userId}/promote
Authorization: Bearer {admin_token}
```

**Response — 200 OK:**
```json
{
  "data": {
    "user_id": 55,
    "name": "فاطمة علي القحطاني",
    "email": "fatima@example.com",
    "promoted_at": "2026-04-14T10:00:00Z",
    "message": "تم ترقية المستخدم لمستثمر ملائكي بنجاح"
  }
}
```

**أكواد الخطأ:**

| الكود | الرسالة |
|-------|---------|
| 404 | `{"message": "User not found"}` |
| 422 | `{"message": "User is already an investor"}` |

---

### 4.4 قائمة العقود

```http
GET /api/admin/angel-investments/contracts
Authorization: Bearer {admin_token}
```

**Response — 200 OK:**
```json
{
  "data": [
    {
      "id": 2,
      "contract_number": "ANGEL-2026-001",
      "title": "برنامج المستثمرين الملائكيين 2026",
      "status": "active",
      "default_cap_multiple": "2.00",
      "currency": "SAR",
      "versions_count": 2,
      "latest_version": 2,
      "active_subscriptions_count": 10,
      "created_at": "2026-01-15T09:00:00Z"
    }
  ]
}
```

---

### 4.5 إنشاء عقد جديد

```http
POST /api/admin/angel-investments/contracts
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "contract_number": "ANGEL-2026-002",
  "title": "برنامج الاستثمار الإضافي 2026",
  "default_cap_multiple": 2.5,
  "currency": "SAR"
}
```

**Response — 201 Created:**
```json
{
  "data": {
    "id": 3,
    "contract_number": "ANGEL-2026-002",
    "title": "برنامج الاستثمار الإضافي 2026",
    "status": "draft",
    "default_cap_multiple": "2.50",
    "currency": "SAR",
    "created_at": "2026-04-14T10:00:00Z"
  }
}
```

**أكواد الخطأ:**

| الكود | الحقل | الرسالة |
|-------|-------|---------|
| 422 | `contract_number` | `{"errors": {"contract_number": ["contract_number already exists"]}}` |
| 422 | `default_cap_multiple` | `{"errors": {"default_cap_multiple": ["Must be at least 1.0"]}}` |

---

### 4.6 نشر نسخة جديدة من العقد

```http
POST /api/admin/angel-investments/contracts/{id}/versions
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "version": 2,
  "body_template": "عقد الاستثمار الملائكي\n\nيُبرم هذا العقد بين منصة داسم...\n\nاسم المستثمر: {{investor_name}}\nمبلغ الاستثمار: {{principal_amount}} ريال سعودي\nمضاعف السقف: {{cap_multiple}}×\nالسقف الكلي: {{cap_total}} ريال سعودي",
  "risk_disclosure_template": "إفصاح عن المخاطر\n\nيُقر المستثمر بأنه على دراية كاملة بالمخاطر..."
}
```

**Response — 201 Created:**
```json
{
  "data": {
    "id": 8,
    "contract_id": 2,
    "version": 2,
    "published_at": "2026-04-14T11:00:00Z",
    "created_at": "2026-04-14T11:00:00Z"
  }
}
```

**أكواد الخطأ:**

| الكود | الرسالة |
|-------|---------|
| 422 | `{"errors": {"version": ["Version number already exists for this contract"]}}` |
| 422 | `{"errors": {"body_template": ["The body template field is required"]}}` |

---

### 4.7 إنشاء اشتراك جديد

```http
POST /api/admin/angel-investments/subscriptions
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "user_id": 142,
  "contract_id": 2,
  "principal_amount": 500000,
  "cap_multiple": 2.0
}
```

**Response — 201 Created:**
```json
{
  "data": {
    "id": 19,
    "subscription_code": "ANGEL-P9RQ-26",
    "user_id": 142,
    "contract_id": 2,
    "contract_version_id": 2,
    "principal_amount": "500000.00",
    "cap_multiple": "2.00",
    "cap_total": "1000000.00",
    "status": "pending_signature",
    "created_at": "2026-04-14T12:00:00Z"
  }
}
```

---

### 4.8 تفعيل اشتراك

```http
POST /api/admin/angel-investments/subscriptions/{id}/activate
Authorization: Bearer {admin_token}
```

**Request Body:** (فارغ أو مع ملاحظة اختيارية)
```json
{
  "note": "تم تأكيد استلام التحويل البنكي رقم TRF-20260320-001"
}
```

**Response — 200 OK:**
```json
{
  "data": {
    "subscription_id": 19,
    "status": "active",
    "activated_at": "2026-04-14T12:30:00Z",
    "ledger_entry": {
      "id": 301,
      "type": "TYPE_ANGEL_CAPITAL_IN",
      "amount": "500000.00"
    }
  }
}
```

**أكواد الخطأ:**

| الكود | الرسالة |
|-------|---------|
| 422 | `{"message": "Subscription must be signed before activation", "current_status": "pending_signature"}` |
| 422 | `{"message": "Subscription is already active"}` |

---

### 4.9 تسجيل توزيع

```http
POST /api/admin/angel-investments/subscriptions/{id}/distribute
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "amount": 75000,
  "currency": "SAR",
  "description": "توزيع الربع الثاني 2026 — أبريل"
}
```

**Response — 201 Created:**
```json
{
  "data": {
    "distribution_id": 25,
    "subscription_id": 5,
    "amount": "75000.00",
    "currency": "SAR",
    "description": "توزيع الربع الثاني 2026 — أبريل",
    "ledger_entry_id": 315,
    "created_at": "2026-04-14T14:00:00Z",
    "updated_metrics": {
      "paid_to_date": "225000.00",
      "remaining_to_cap": "775000.00",
      "progress_percent": 22.5,
      "subscription_status": "active",
      "auto_capped": false
    }
  }
}
```

**مثال — عند بلوغ السقف:**
```json
{
  "data": {
    "distribution_id": 30,
    "amount": "775000.00",
    "updated_metrics": {
      "paid_to_date": "1000000.00",
      "remaining_to_cap": "0.00",
      "progress_percent": 100,
      "subscription_status": "capped",
      "auto_capped": true
    }
  }
}
```

---

### 4.10 إيقاف مؤقت

```http
POST /api/admin/angel-investments/subscriptions/{id}/pause
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "reason": "مراجعة داخلية للحسابات"
}
```

**Response — 200 OK:**
```json
{
  "data": {
    "subscription_id": 5,
    "previous_status": "active",
    "current_status": "paused",
    "paused_at": "2026-04-14T15:00:00Z"
  }
}
```

---

### 4.11 استئناف

```http
POST /api/admin/angel-investments/subscriptions/{id}/resume
Authorization: Bearer {admin_token}
```

**Response — 200 OK:**
```json
{
  "data": {
    "subscription_id": 5,
    "previous_status": "paused",
    "current_status": "active",
    "resumed_at": "2026-04-14T16:00:00Z"
  }
}
```

---

### 4.12 إغلاق نهائي

```http
POST /api/admin/angel-investments/subscriptions/{id}/close
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "reason": "انتهاء مدة العقد باتفاق مشترك",
  "confirm": true
}
```

**Response — 200 OK:**
```json
{
  "data": {
    "subscription_id": 5,
    "previous_status": "active",
    "current_status": "closed",
    "closed_at": "2026-04-14T17:00:00Z",
    "final_metrics": {
      "total_distributed": "225000.00",
      "realized_multiple": "0.45",
      "progress_percent": 22.5
    },
    "warning": "هذا الإجراء لا يمكن التراجع عنه"
  }
}
```

**أكواد الخطأ:**

| الكود | الرسالة |
|-------|---------|
| 422 | `{"message": "Subscription is already closed"}` |
| 422 | `{"message": "confirm field must be true to close subscription"}` |

---

### 4.13 سجل التدقيق

```http
GET /api/admin/angel-investments/audit
Authorization: Bearer {admin_token}
```

**Query Parameters:**

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `subject_type` | string | `contract`, `subscription`, `distribution` |
| `subject_id` | integer | معرف الكيان |
| `action` | string | نوع الإجراء |
| `actor_user_id` | integer | منفّذ الإجراء |
| `from_date` | date | من تاريخ (YYYY-MM-DD) |
| `to_date` | date | حتى تاريخ (YYYY-MM-DD) |
| `page` | integer | رقم الصفحة |

**Response — 200 OK:**
```json
{
  "data": [
    {
      "id": 88,
      "actor": {
        "id": 1,
        "name": "مسؤول النظام"
      },
      "action": "distribute",
      "subject_type": "subscription",
      "subject_id": 5,
      "properties": {
        "amount": "75000.00",
        "description": "توزيع Q2 2026"
      },
      "created_at": "2026-04-14T14:00:00Z"
    }
  ],
  "meta": {
    "total": 125,
    "current_page": 1
  }
}
```

---

### 4.14 مراكز مستثمر محدد

```http
GET /api/admin/angel-investments/investors/{userId}/positions
Authorization: Bearer {admin_token}
```

**Response — 200 OK:**
```json
{
  "data": {
    "investor": {
      "id": 142,
      "name": "أحمد بن محمد العتيبي",
      "email": "ahmed@example.com"
    },
    "positions": [
      {
        "id": 5,
        "subscription_code": "ANGEL-X4K2-26",
        "status": "active",
        "principal_amount": "500000.00",
        "cap_total": "1000000.00",
        "paid_to_date": "150000.00",
        "progress_percent": 15
      }
    ],
    "totals": {
      "total_principal": "500000.00",
      "total_paid": "150000.00"
    }
  }
}
```

---

### 4.15 روابط الليدجر

```http
GET /api/admin/angel-investments/subscriptions/{id}/ledger-links
Authorization: Bearer {admin_token}
```

**Response — 200 OK:**
```json
{
  "data": [
    {
      "ledger_entry_id": 201,
      "type": "TYPE_ANGEL_CAPITAL_IN",
      "amount": "500000.00",
      "linked_to": "activation",
      "created_at": "2026-03-20T08:00:00Z"
    },
    {
      "ledger_entry_id": 215,
      "type": "TYPE_ANGEL_DISTRIBUTION",
      "amount": "75000.00",
      "linked_to": "distribution_id:8",
      "created_at": "2026-03-15T10:00:00Z"
    }
  ]
}
```

---

### 4.16 التقارير الشاملة

```http
GET /api/admin/angel-investments/reports
Authorization: Bearer {admin_token}
```

**Query Parameters:**

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `period` | string | `monthly`, `quarterly`, `yearly` |
| `year` | integer | السنة (default: السنة الحالية) |

**Response — 200 OK:**
```json
{
  "data": {
    "period": "yearly",
    "year": 2026,
    "total_principal_under_management": "8500000.00",
    "total_distributions_this_year": "2340000.00",
    "new_subscriptions_this_year": 5,
    "completed_subscriptions_this_year": 2,
    "average_progress_percent": 27.5,
    "top_investors": [
      {
        "name": "أحمد بن محمد العتيبي",
        "total_invested": "700000.00"
      }
    ]
  }
}
```

---

## 5. أكواد الخطأ المشتركة

| الكود | المعنى | الأسباب الشائعة |
|-------|--------|-----------------|
| `400` | Bad Request | بيانات مشوّهة أو missing fields |
| `401` | Unauthenticated | توكن غير صالح أو منتهي |
| `403` | Forbidden | صلاحيات غير كافية أو محاولة الوصول لبيانات مستخدم آخر |
| `404` | Not Found | المورد غير موجود |
| `422` | Unprocessable Entity | خطأ في التحقق من البيانات |
| `429` | Too Many Requests | تجاوز حد الطلبات |
| `500` | Internal Server Error | خطأ في الخادم |

**صيغة الخطأ الموحّدة:**
```json
{
  "message": "وصف الخطأ",
  "error": "machine_readable_code",
  "errors": {
    "field_name": ["رسالة خطأ للحقل"]
  }
}
```

---

## 6. متغيرات البيئة

### الباكند (Render)

```env
# التطبيق
APP_NAME="DASM Platform"
APP_ENV=production
APP_URL=https://api.dasm.com.sa

# قاعدة البيانات (Supabase)
DB_CONNECTION=pgsql
DB_HOST=aws-0-eu-central-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.ttkhiatwayvlfksvehzm
DB_PASSWORD=your_db_password_here

# Sanctum
SANCTUM_STATEFUL_DOMAINS=investor.dasm.com.sa,control.dasm.com.sa,dasm.com.sa

# CORS
CORS_ALLOWED_ORIGINS=https://investor.dasm.com.sa,https://control.dasm.com.sa,https://www.dasm.com.sa

# SSO
SSO_SECRET_KEY=your_sso_secret_here
SSO_TOKEN_TTL_MINUTES=5
SSO_ACCESS_TOKEN_TTL_DAYS=30

# نظام الاستثمار الملائكي
ANGEL_CONSENT_ANCHOR="أوافق على شروط وأحكام عقد الاستثمار الملائكي الصادر عن منصة داسم"
ANGEL_REVENUE_SHARE_PERCENT=15
```

### بوابة المستثمر (Vercel)

```env
VITE_API_BASE_URL=https://api.dasm.com.sa
VITE_INVESTOR_PLATFORM_NAME=investor
VITE_MAIN_PLATFORM_URL=https://www.dasm.com.sa
```
