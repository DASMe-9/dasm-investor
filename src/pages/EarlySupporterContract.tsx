import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { fetchEarlySupporterContract, signEarlySupporterContract } from "../lib/api";
import type { EarlySupporterContractData } from "../lib/api";
import { getUser } from "../lib/auth";
import {
  Heart,
  FileText,
  ShieldCheck,
  CheckSquare,
  Square,
  PenLine,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";

// ─── Consent Row (reusable) ───────────────────────────────────────────────────

function ConsentRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 w-full text-right transition-all duration-150"
    >
      <div className="flex-shrink-0 mt-0.5">
        {checked ? (
          <CheckSquare className="w-5 h-5" style={{ color: "#10b981" }} />
        ) : (
          <Square className="w-5 h-5" style={{ color: "rgba(255,255,255,0.3)" }} />
        )}
      </div>
      <span
        className="text-sm leading-relaxed"
        style={{ color: checked ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)" }}
      >
        {children}
      </span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EarlySupporterContract() {
  const params = useParams<{ id: string }>();
  const participationId = parseInt(params.id ?? "0", 10);
  useLocation(); // ensure Wouter context

  const [contract, setContract] = useState<EarlySupporterContractData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // Consents
  const [readConfirmed, setReadConfirmed]       = useState(false);
  const [acceptRisk, setAcceptRisk]             = useState(false);
  const [consentElectronic, setConsentElectronic] = useState(false);

  // Signing
  const [signing, setSigning]       = useState(false);
  const [signError, setSignError]   = useState<string | null>(null);
  const [signSuccess, setSignSuccess] = useState(false);

  const user = getUser();
  const allChecked = readConfirmed && acceptRisk && consentElectronic;

  useEffect(() => {
    if (!participationId) {
      setError("معرّف المشاركة غير صالح.");
      setLoading(false);
      return;
    }

    fetchEarlySupporterContract(participationId)
      .then((data) => {
        if (!data) {
          setError("تعذّر تحميل العقد. تأكد من أن المشاركة مرتبطة بحسابك.");
        } else {
          setContract(data);
        }
      })
      .catch(() => setError("خطأ في الاتصال بالخادم."))
      .finally(() => setLoading(false));
  }, [participationId]);

  const handleSign = async () => {
    if (!allChecked || signing) return;
    setSigning(true);
    setSignError(null);

    const result = await signEarlySupporterContract(participationId, {
      read_confirmed: true,
      accept_risk_disclosure: true,
      consent_electronic: true,
    });

    setSigning(false);

    if (result) {
      setSignSuccess(true);
    } else {
      setSignError(
        "تعذّر تسجيل التوقيع. تأكد من أن المشاركة لا تزال في حالة «بانتظار التوقيع» وحاول مرة أخرى."
      );
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#10b981" }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          جارٍ تحميل العقد...
        </p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error || !contract) {
    return (
      <div
        className="rounded-2xl p-12 text-center max-w-lg mx-auto mt-16"
        style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
      >
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: "#ef4444" }} />
        <h2 className="text-lg font-bold text-white mb-2">تعذّر تحميل العقد</h2>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
          {error || "العقد غير متاح حالياً."}
        </p>
        <Link href="/early-supporter">
          <button
            className="px-6 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
          >
            العودة لأصدقاء الدعم المبكر
          </button>
        </Link>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────

  if (signSuccess) {
    return (
      <div
        className="rounded-2xl p-14 text-center max-w-lg mx-auto mt-16"
        style={{ backgroundColor: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "rgba(16,185,129,0.12)", boxShadow: "0 0 40px rgba(16,185,129,0.25)" }}
        >
          <CheckCircle2 className="w-10 h-10" style={{ color: "#10b981" }} />
        </div>
        <h2 className="text-2xl font-black text-white mb-3">تم التوقيع بنجاح ✓</h2>
        <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
          لقد وقّعت إلكترونياً على عقد{" "}
          <span className="font-bold" style={{ color: "#10b981" }}>
            {contract.tier_label}
          </span>{" "}
          برقم{" "}
          <span className="font-mono font-bold" style={{ color: "#f59e0b" }}>
            {contract.contract_number}
          </span>
          .
        </p>
        <p className="text-xs mb-8" style={{ color: "rgba(255,255,255,0.3)" }}>
          سيتم تفعيل مشاركتك من قِبل إدارة داسم بعد مراجعة التوقيع.
        </p>
        <Link href="/early-supporter">
          <button
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{
              backgroundColor: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: "#10b981",
            }}
          >
            <ArrowRight className="w-4 h-4" />
            العودة لصفحة أصدقاء الدعم المبكر
          </button>
        </Link>
      </div>
    );
  }

  // ── Signed already (read-only view) ──────────────────────────────────────

  const isSigned = !contract.can_sign;
  const tierColor = contract.tier === "small" ? "#10b981" : "#a78bfa";
  const tierBorder = contract.tier === "small" ? "rgba(16,185,129,0.2)" : "rgba(167,139,250,0.2)";

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
        <Link href="/early-supporter">
          <button className="hover:text-white transition-colors">أصدقاء الدعم المبكر</button>
        </Link>
        <span>/</span>
        <span style={{ color: "rgba(255,255,255,0.6)" }}>
          {isSigned ? "عرض العقد" : "توقيع العقد"}
        </span>
      </div>

      {/* Header */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, rgba(${contract.tier === "small" ? "16,185,129" : "167,139,250"},0.07) 0%, rgba(8,12,20,0) 60%)`,
          border: `1px solid ${tierBorder}`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `rgba(${contract.tier === "small" ? "16,185,129" : "167,139,250"},0.1)`, border: `1px solid ${tierBorder}` }}
          >
            <Heart className="w-6 h-6" style={{ color: tierColor }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white mb-1">
              {isSigned ? "عرض عقد برنامج الدعم المبكر" : "توقيع عقد برنامج الدعم المبكر"}
            </h1>
            <div className="flex flex-wrap gap-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span>
                الشريحة:{" "}
                <span className="font-bold" style={{ color: tierColor }}>
                  {contract.tier_label}
                </span>
              </span>
              <span>
                رقم العقد:{" "}
                <span className="font-mono font-bold" style={{ color: "#f59e0b" }}>
                  {contract.contract_number}
                </span>
              </span>
              <span>
                الإصدار:{" "}
                <span className="font-bold text-white">{contract.contract_version}</span>
              </span>
              <span>
                كود المشاركة:{" "}
                <span className="font-mono">{contract.participation_code}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Signed badge */}
        {isSigned && (
          <div
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            تم التوقيع — {contract.status_label}
          </div>
        )}
      </div>

      {/* Contract Body */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <FileText className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
          <span className="text-sm font-bold text-white">نص العقد</span>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto" style={{ direction: "rtl" }}>
          <div
            className="prose prose-invert max-w-none"
            style={{ color: "rgba(255,255,255,0.75)", lineHeight: "1.9", fontSize: "14px" }}
            dangerouslySetInnerHTML={{ __html: contract.rendered_body }}
          />
        </div>
      </div>

      {/* Risk Disclosure */}
      {contract.risk_block && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)" }}
        >
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom: "1px solid rgba(245,158,11,0.08)" }}
          >
            <AlertTriangle className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>بيان إفصاح المخاطر</span>
          </div>
          <div className="p-6 max-h-52 overflow-y-auto" style={{ direction: "rtl" }}>
            <div
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.55)" }}
              dangerouslySetInnerHTML={{ __html: contract.risk_block }}
            />
          </div>
        </div>
      )}

      {/* Signature section — only when can_sign */}
      {!isSigned && (
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <PenLine className="w-4 h-4" style={{ color: "#10b981" }} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">التوقيع الإلكتروني</h2>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                أكّد موافقتك على البنود الثلاثة أدناه للتوقيع
              </p>
            </div>
          </div>

          {/* Signer info */}
          {user && (
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
              >
                {(user.first_name?.[0] || "م").toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{user.email}</p>
              </div>
              <div
                className="mr-auto text-[10px] px-2 py-1 rounded-full font-bold"
                style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                الموقّع
              </div>
            </div>
          )}

          {/* Consents */}
          <div className="space-y-4">
            <ConsentRow checked={readConfirmed} onChange={setReadConfirmed}>
              أقرّ بأنني قرأت عقد برنامج أصدقاء الدعم المبكر كاملاً وفهمت بنوده وشروطه وأحكامه، وأوافق عليها.
            </ConsentRow>
            <ConsentRow checked={acceptRisk} onChange={setAcceptRisk}>
              اطّلعتُ على بيان إفصاح المخاطر وأدرك أن هذا البرنامج مرتبط بأداء مشروع تجاري قيد النمو، والعائد متغير ولا يُضمن.
            </ConsentRow>
            <ConsentRow checked={consentElectronic} onChange={setConsentElectronic}>
              أوافق على صحة هذا التوقيع الإلكتروني وأنه يعادل التوقيع الخطي، ويُعدّ ملزماً قانوناً وفق نظام المعاملات الإلكترونية السعودي.
            </ConsentRow>
          </div>

          {/* Sign button */}
          <button
            onClick={handleSign}
            disabled={!allChecked || signing}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-sm transition-all duration-200"
            style={{
              backgroundColor: allChecked && !signing ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
              border: allChecked && !signing ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(255,255,255,0.08)",
              color: allChecked && !signing ? "#10b981" : "rgba(255,255,255,0.25)",
              cursor: allChecked && !signing ? "pointer" : "not-allowed",
              boxShadow: allChecked && !signing ? "0 0 24px rgba(16,185,129,0.12)" : "none",
            }}
          >
            {signing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جارٍ تسجيل التوقيع...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                وقّع عقد أصدقاء الدعم المبكر إلكترونياً
              </>
            )}
          </button>

          {signError && (
            <div
              className="rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
              <p className="text-sm" style={{ color: "rgba(239,68,68,0.9)" }}>{signError}</p>
            </div>
          )}

          <p className="text-[10px] text-center leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }}>
            يُسجَّل توقيعك مع طابع زمني وعنوان IP وبصمة متصفح كسجل تدقيق دائم غير قابل للحذف.
          </p>
        </div>
      )}
    </div>
  );
}
