-- ==============================================================================
-- فحص قاعدة بيانات «رحمة» — الصق في Supabase ← SQL Editor ← Run
-- يقارن ما نُشئ فعلياً بما يتوقّعه الخادم (server-backend/db-postgres.js)
-- ==============================================================================


-- ── [1] عدد الجداول — يجب أن يطبع 8 ──────────────────────────────────────────
SELECT count(*) AS expected_8_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';


-- ── [2] الجداول الناقصة (يجب ألا يطبع أي شيء) ───────────────────────────────
SELECT t.name AS MISSING_table
FROM unnest(ARRAY['users','nurses','wallets','wallet_transactions',
                 'sessions','records','otps','login_attempts']) AS t(name)
LEFT JOIN information_schema.tables i
       ON i.table_schema='public' AND i.table_name=t.name AND i.table_type='BASE TABLE'
WHERE i.table_name IS NULL;


-- ── [3] الأعمدة الناقصة — يجب ألا يطبع أي شيء ─────────────────────────────
WITH required(table_name, column_name) AS (
  VALUES
    ('users','id'),('users','name'),('users','phone'),('users','role'),
    ('users','password_hash'),('users','verified'),('users','created_at'),
    ('nurses','id'),('nurses','phone'),('nurses','verified'),('nurses','available'),
    ('nurses','wallet_balance'),('nurses','specialties'),
    ('wallets','nurse_id'),('wallets','current_balance'),
    ('wallets','completed_sessions_count'),('wallets','total_commission_deducted'),
    ('wallet_transactions','id'),('wallet_transactions','nurse_id'),
    ('wallet_transactions','type'),('wallet_transactions','amount'),
    ('wallet_transactions','balance_after'),
    ('sessions','id'),('sessions','patient_id'),('sessions','nurse_id'),
    ('sessions','status'),('sessions','completion_code'),
    ('sessions','platform_commission'),('sessions','commission_deducted'),
    ('records','id'),('records','session_id'),('records','patient_phone'),
    ('records','encrypted'),
    ('otps','id'),('otps','phone'),('otps','code_hash'),
    ('otps','attempts'),('otps','expires_at'),('otps','is_used'),
    ('login_attempts','id'),('login_attempts','phone'),('login_attempts','created_at')
)
SELECT r.table_name || '.' || r.column_name AS MISSING_column
FROM required r
LEFT JOIN information_schema.columns c
       ON c.table_schema='public' AND c.table_name=r.table_name AND c.column_name=r.column_name
WHERE c.column_name IS NULL
ORDER BY 1;


-- ── [4] قيد التفرّد الذي يمنع الخصم المزدوج (يجب: session_id = 1) ───────────
SELECT
  con.conname AS constraint_name,
  con.contype AS type,
  (SELECT count(*) FROM pg_attribute
    WHERE attrelid = con.conrelid AND attnum = ANY(con.conkey)) AS column_count
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = rel.relnamespace
WHERE ns.nspname = 'public' AND rel.relname = 'records' AND con.contype = 'u';


-- ── [5] حالة RLS لكل جدول ──────────────────────────────────────────────────
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  CASE WHEN c.relrowsecurity THEN 'محمي' ELSE 'مكشوف عبر REST' END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;


-- ── [6] الفهارس (يجب 12 على الأقل) ────────────────────────────────────────
SELECT count(*) AS index_count FROM pg_indexes WHERE schemaname = 'public';


-- ── [7] عدد السجلات ────────────────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM users)    AS users,
  (SELECT count(*) FROM nurses)   AS nurses,
  (SELECT count(*) FROM wallets)  AS wallets,
  (SELECT count(*) FROM sessions) AS sessions,
  (SELECT count(*) FROM records)  AS records,
  (SELECT count(*) FROM otps)     AS otps;


-- ==============================================================================
-- النتيجة المتوقعة:  8 جداول · 0 أعمدة ناقصة · قيد UNIQUE على records.session_id
--                     · 12+ فهرس
-- ==============================================================================
