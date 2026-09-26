-- ==============================================================================
-- تفعيل Row Level Security — إلزامي لتطبيق صحي
-- ==============================================================================
-- لماذا هذا إلزامي وليس اختيارياً؟
--
-- جداول Supabase بلا RLS تكون مقروءة عبر REST API لكل من يملك مفتاح
-- anon — وهو مفتاح عام يُشحن داخل حزمة العميل ويظهر في DevTools.
-- عملياً: أي شخص على الإنترنت يقرأ أسماء المرضى وأرقام هواتفهم
-- وأرقامهم القومية وسجلاتهم الطبية، بلا كلمة مرور.
--
-- بعد التفعيل: خادمنا يتصل بـ PostgreSQL مباشرة، فيعمل طبيعياً.
-- أما REST فيُرفض — وهذا هو المطلوب.
--
-- الصق في Supabase ← SQL Editor ← Run
-- ==============================================================================


-- ── [1] تفعيل RLS على كل الجداول ──────────────────────────────────────────
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otps                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts      ENABLE ROW LEVEL SECURITY;

-- إجبار RLS حتى على صاحب الجدول (يمنع تجاوز السياسات من داخل البوابة)
ALTER TABLE public.users               FORCE ROW LEVEL SECURITY;
ALTER TABLE public.nurses              FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wallets             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions            FORCE ROW LEVEL SECURITY;
ALTER TABLE public.records             FORCE ROW LEVEL SECURITY;
ALTER TABLE public.otps                FORCE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts      FORCE ROW LEVEL SECURITY;


-- ── [2] لا نُنشئ سياسات عامة ──────────────────────────────────────────────
-- التطبيق لا يمر عبر REST أصلاً، بل عبر Express + اتصال مباشر.
-- أي استعلام من anon أو authenticated سيُرفض بـ 401/403 — وهذا هو المطلوب.
-- إن احتجت لاحقاً قراءة مباشرة من الواجهة، أضف سياسات محددة للجدول
-- والصفوف المطلوبة فقط. لا تفتح الجداول بالكامل.


-- ── [3] تحقّق: يجب أن يطبع 8 صفوف بـ true في العمودين ─────────────────────
SELECT
  c.relname        AS table_name,
  c.relrowsecurity  AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;


-- ── [4] اختبار الحجب ──────────────────────────────────────────────────────
-- افتح في المتصفح بدون أي مفتاح:
--   https://<project-ref>.supabase.co/rest/v1/users
-- المتوقّع: 401 Unauthorized
-- لو رأيت بيانات = RLS غير مفعّل.
