# مواصفات التنفيذ — سيميوليشن السيموليشن

> هذا الملف للمطور — يصف بالضبط كيف تُبنى الصفحة تقنياً

---

## الموقع في الريبو

```
dasm-investor/src/
  pages/
    Simulation.tsx          ← الصفحة الرئيسية
  simulation/
    SimulationContext.tsx   ← State Management (Context + useReducer)
    calculations.ts         ← كل الحسابات (خالصة — no side effects)
    defaultData.ts          ← بيانات 2026/2027/2028 من الملف
    types.ts                ← TypeScript interfaces
    components/
      ParticipantsTab.tsx
      IncomeTab.tsx
      DistributionsTab.tsx
      WhatIfTab.tsx
      ExitTab.tsx
      ExportTab.tsx
      ContractTab.tsx
      MetricsDashboard.tsx
      ParticipantCard.tsx
      PhaseIndicator.tsx
```

---

## TypeScript Interfaces

```typescript
// types.ts

export type ParticipantTier = 'small' | 'large';
export type MultiplierPhase = 'phase1' | 'phase2' | 'phase3' | 'ended';

export interface Participant {
  id: string;
  name: string;
  // كل الأرقام بالريال
  monthlyContributions: Record<string, number>; // key: "2026-03"
  totalContributed: number;       // محسوب
  totalReceived: number;          // محسوب
  currentMultiplier: number;      // محسوب: totalReceived / totalContributed
  currentPhase: MultiplierPhase;  // محسوب
  tier: ParticipantTier;          // محسوب: totalContributed < 100000
  rightsEnded: boolean;           // محسوب: currentMultiplier >= 4
}

export interface MonthlyIncome {
  yearMonth: string;  // "2026-04"
  deals250: number;
  deals500: number;
  deals1000: number;
  // محسوبة:
  grossCommissions: number;
  vat: number;
  totalIncome: number;        // للصغار
  gatewayFees: number;
  netForPlatform: number;
  partnerCommissions: number;
  netProfit: number;          // للكبار
}

export interface MonthlyDistribution {
  yearMonth: string;
  participantId: string;
  tier: ParticipantTier;
  baseShare: number;          // الحصة قبل المضاعف
  multiplierFactor: number;   // 1.0 / 0.5 / 0.25 / 0
  actualDistribution: number; // الحصة الفعلية
  phaseAtTime: MultiplierPhase;
  cumulativeContributed: number;  // وقت التوزيع
  cumulativeReceived: number;     // بعد هذا التوزيع
  multiplierAfter: number;        // بعد هذا التوزيع
}

export interface ExitScenario {
  participantId: string;
  scenario: '2026' | '2027' | '2028';
  principalToReturn: number;
  totalReceivedBeforeExit: number;
  profitRatio: number;          // totalReceived / principalToReturn
  eligible: boolean;
  reason?: string;              // سبب عدم الأهلية
}

export interface SimulationState {
  participants: Participant[];
  monthlyIncomes: MonthlyIncome[];
  distributions: MonthlyDistribution[];
  exitScenarios: ExitScenario[];
  // إعدادات
  smallTierPoolPct: number;         // 0.15 (15%)
  activationThreshold: number;      // 150000
  tierUpgradeThreshold: number;     // 100000
  multiplierCaps: [2, 3, 4];
  multiplierFactors: [1.0, 0.5, 0.25];
}
```

---

## دوال الحساب الرئيسية

```typescript
// calculations.ts

/**
 * تحسب إجمالي مساهمات مشارك حتى شهر معين
 */
export function cumulativeContribution(
  participant: Participant,
  upToYearMonth: string
): number

/**
 * تحسب نسبة المشارك التراكمية من الشريحة في شهر معين
 */
export function participantSharePct(
  participant: Participant,
  allParticipants: Participant[],
  yearMonth: string
): number

/**
 * تحسب المرحلة الحالية بناءً على المضاعف
 */
export function getPhase(multiplier: number): MultiplierPhase

/**
 * تحسب معامل التعديل (1.0 / 0.5 / 0.25 / 0)
 */
export function getMultiplierFactor(phase: MultiplierPhase): number

/**
 * تحسب التوزيع الشهري لكل المشاركين
 */
export function calculateMonthlyDistributions(
  yearMonth: string,
  income: MonthlyIncome,
  participants: Participant[],
  previousDistributions: MonthlyDistribution[],
  config: Pick<SimulationState, 'smallTierPoolPct' | 'activationThreshold' | 'tierUpgradeThreshold' | 'multiplierCaps' | 'multiplierFactors'>
): MonthlyDistribution[]

/**
 * تحسب سيناريوهات التخارج
 */
export function calculateExitScenarios(
  participants: Participant[],
  distributions: MonthlyDistribution[]
): ExitScenario[]

/**
 * تحسب بيانات الدخل من الصفقات
 */
export function calculateIncomeFromDeals(
  deals250: number,
  deals500: number,
  deals1000: number
): Omit<MonthlyIncome, 'yearMonth' | 'deals250' | 'deals500' | 'deals1000'>
```

---

## البيانات الافتراضية (من الملف)

```typescript
// defaultData.ts

export const DEFAULT_PARTICIPANTS_2026 = [
  { name: "علي",    contributions: { "2026-03": 1000, "2026-04": 1000, /* ... */ "2026-12": 1000 } },
  { name: "عصام",   contributions: { "2026-03": 1000, "2026-04": 5000, "2026-05": 0, /* ... */ } },
  { name: "بلوتو",  contributions: { "2026-03": 500, /* ... */ } },
  { name: "هليل",   contributions: { "2026-03": 1000, "2026-07": 2000, /* ... */ } },
  { name: "خالد",   contributions: { "2026-03": 2000, "2026-07": 0, "2026-08": 3000, /* ... */ } },
  { name: "سلطان",  contributions: { "2026-03": 1000, /* ... */ } },
  { name: "سالم",   contributions: { "2026-09": 15000, "2026-10": 5000, /* ... */ } },
];

export const DEFAULT_INCOME_2026: Partial<MonthlyIncome>[] = [
  { yearMonth: "2026-04", deals250: 0, deals500: 10, deals1000: 0 },
  { yearMonth: "2026-05", deals250: 50, deals500: 20, deals1000: 5 },
  { yearMonth: "2026-06", deals250: 65, deals500: 28, deals1000: 7 },
  // ...
];

export const DEFAULT_INCOME_2027: Partial<MonthlyIncome>[] = [
  { yearMonth: "2027-01", deals250: 85, deals500: 40, deals1000: 13 },
  // ...
];
```

---

## إضافة الـ Route في App.tsx

```tsx
// App.tsx — أضف هذا السطر
import Simulation from "./pages/Simulation";

// داخل AuthGuard > Layout > Switch:
<Route path="/simulation" component={Simulation} />
```

```tsx
// Layout.tsx — أضف في القائمة:
{ href: "/simulation", label: "🔮 السيميوليشن", icon: BarChart2 }
```

---

## ملاحظة الحذف

```tsx
// عند الانتهاء من السيميوليشن وتطبيق النموذج الحقيقي:
// 1. احذف هذا السطر من App.tsx:
//    <Route path="/simulation" component={Simulation} />
// 2. احذف entry من Layout.tsx
// 3. احذف مجلد src/simulation/ وملف src/pages/Simulation.tsx
// 4. لا تأثير على باقي الـ routes أو الـ API
```
