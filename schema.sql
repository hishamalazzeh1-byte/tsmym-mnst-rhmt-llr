-- ==============================================================================
-- منصة «رحمة» — مخطط قاعدة بيانات الإنتاج (PostgreSQL 14+)
-- ------------------------------------------------------------------------------
-- متوافق مع server-backend/db-postgres.js
-- يُطبَّق على Neon / Supabase / RDS / أي PostgreSQL مُدار:
--   psql "$DATABASE_URL" -f schema.sql
--
-- ملاحظة: كل المعرّفات تُولَّد في التطبيق (Node) بصيغة <prefix>-<time>-<random>،
-- لذا لا نحتاج pgcrypto ولا أي امتداد إضافي — والمخطط يعمل على أي PostgreSQL 14+
-- بما فيها Supabase مباشرة.
-- =============================================================================

-- ── 1. المستخدمون (مريض / ممرض / إدارة) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               TEXT PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    phone            VARCHAR(20)  NOT NULL UNIQUE,
    email            VARCHAR(255) UNIQUE,
    password_hash    TEXT,
    role             VARCHAR(20)  NOT NULL DEFAULT 'patient'
                         CHECK (role IN ('patient', 'nurse', 'admin')),
    national_id      VARCHAR(20),
    syndicate_number VARCHAR(50),
    governorate      VARCHAR(100),
    area             VARCHAR(100),
    address          TEXT,
    gender           VARCHAR(10),
    verified         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ── 2. الملفات المهنية للممرضين ─────────────────────────────────────────────
-- id = users.id: الممرض والمستخدم سجل واحد، ما يبسّط البحث والتفويض
CREATE TABLE IF NOT EXISTS nurses (
    id                       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name                     VARCHAR(255) NOT NULL,
    phone                    VARCHAR(20)  NOT NULL,
    gender                   VARCHAR(10)  NOT NULL DEFAULT 'female'
                                 CHECK (gender IN ('male', 'female')),
    title                    VARCHAR(255) NOT NULL DEFAULT 'ممرض مسجل',
    bio                      TEXT,
    specialties              TEXT[]        NOT NULL DEFAULT '{}',
    languages                TEXT[]        NOT NULL DEFAULT '{العربية}',
    governorate              VARCHAR(100) NOT NULL DEFAULT '',
    area                     VARCHAR(100) NOT NULL DEFAULT '',
    coverage_governorates    TEXT[]        NOT NULL DEFAULT '{}',
    latitude                 DOUBLE PRECISION,
    longitude                DOUBLE PRECISION,
    rating                   NUMERIC(3,2)  NOT NULL DEFAULT 0,
    reviews                  INT           NOT NULL DEFAULT 0,
    experience_years         INT           NOT NULL DEFAULT 0,
    -- الاعتماد المهني بيد الإدارة فقط: لا يُمنح بالتسجيل ولا بتأكيد الرمز
    verified                 BOOLEAN       NOT NULL DEFAULT FALSE,
    available                BOOLEAN       NOT NULL DEFAULT FALSE,
    completed_sessions_count INT           NOT NULL DEFAULT 0,
    wallet_balance           NUMERIC(10,2) NOT NULL DEFAULT 0,
    syndicate_number         VARCHAR(50),
    created_at               TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nurses_governorate ON nurses(governorate);
CREATE INDEX IF NOT EXISTS idx_nurses_available   ON nurses(available);
CREATE INDEX IF NOT EXISTS idx_nurses_verified    ON nurses(verified);

-- ── 4. حركات المحفظة ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id           TEXT PRIMARY KEY,
    nurse_id     TEXT NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
    type         VARCHAR(40) NOT NULL
                     CHECK (type IN ('welcome_credit','session_commission_deduction','wallet_recharge')),
    amount       NUMERIC(10,2) NOT NULL,
    description  TEXT NOT NULL,
    session_id   TEXT,
    balance_after NUMERIC(10,2) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_nurse ON wallet_transactions(nurse_id, created_at DESC);

-- ── 5. الجلسات التمريضية ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id                 TEXT PRIMARY KEY,
    patient_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
    patient_name       VARCHAR(255) NOT NULL,
    patient_phone      VARCHAR(20)  NOT NULL,
    nurse_id           TEXT NOT NULL REFERENCES nurses(id) ON DELETE RESTRICT,
    nurse_name         VARCHAR(255) NOT NULL,
    service            VARCHAR(255) NOT NULL,
    service_id         VARCHAR(50),
    date               VARCHAR(50)  NOT NULL,
    time               VARCHAR(50)  NOT NULL,
    status             VARCHAR(50)  NOT NULL DEFAULT 'confirmed'
                           CHECK (status IN ('pending','confirmed','nurse_en_route','nurse_arrived',
                                             'in_progress','completed_by_nurse','confirmed_completed','cancelled')),
    governorate        VARCHAR(100) NOT NULL DEFAULT '',
    area               VARCHAR(100) NOT NULL DEFAULT '',
    address            TEXT NOT NULL DEFAULT '',
    coordinates        JSONB,
    -- رمز تحقق الجلسة: مُشفَّر بـ AES-256-GCM (لا يُخزَّن نصاً صريحاً)
    completion_code    TEXT NOT NULL,
    verification_code  TEXT,
    arrival_confirmed  BOOLEAN      NOT NULL DEFAULT FALSE,
    arrived_at         TIMESTAMPTZ,
    platform_commission NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    commission_deducted BOOLEAN     NOT NULL DEFAULT FALSE,
    completed_at       TIMESTAMPTZ,
    confirmed_at       TIMESTAMPTZ,
    nurse_notes        TEXT,
    vital_signs        JSONB,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_nurse   ON sessions(nurse_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_phone   ON sessions(patient_phone);
CREATE INDEX IF NOT EXISTS idx_sessions_status  ON sessions(status);

CREATE INDEX IF NOT EXISTS idx_nurses_specialties ON nurses USING GIN(specialties);

-- ── 3. المحافظ (رصيد الترحيب والخصومات) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
    nurse_id                 TEXT PRIMARY KEY REFERENCES nurses(id) ON DELETE CASCADE,
    nurse_name               VARCHAR(255) NOT NULL DEFAULT '',
    initial_welcome_credit   NUMERIC(10,2) NOT NULL DEFAULT 100.00,

-- ── 6. السجلات الطبية ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS records (
    id            TEXT PRIMARY KEY,
    -- قيد التفرّد هنا هو ما يمنع الخصم المزدوج على مستوى قاعدة البيانات
    session_id    TEXT NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
    patient_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
    patient_phone VARCHAR(20) NOT NULL,
    title         VARCHAR(255) NOT NULL,
    type          VARCHAR(50)  NOT NULL DEFAULT 'تقرير',
    date          VARCHAR(20)  NOT NULL,
    encrypted     BOOLEAN      NOT NULL DEFAULT TRUE,
    notes         TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_records_patient ON records(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_phone   ON records(patient_phone);

-- ── 7. رموز التحقق (OTP) ────────────────────────────────────────────────────
-- لا يُخزَّن الرمز كنص صريح أبداً: نخزّن التجزئة + salt فقط
CREATE TABLE IF NOT EXISTS otps (
    id           TEXT PRIMARY KEY,
    phone        VARCHAR(20) NOT NULL,
    code_hash    TEXT NOT NULL,
    salt         TEXT NOT NULL,
    attempts     INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    expires_at   TIMESTAMPTZ NOT NULL,
    is_used      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone, created_at DESC);

-- ── 8. محاولات الدخول الفاشلة (حماية من التخمين) ───────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
    id         TEXT PRIMARY KEY,
    phone      VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_phone ON login_attempts(phone, created_at DESC);

-- ==============================================================================
-- نهاية المخطط — 8 جداول: users · nurses · wallets · wallet_transactions
--                   sessions · records · otps · login_attempts
-- للتحقق بعد التشغيل:
--   select count(*) from information_schema.tables where table_schema = 'public';
--   -- يجب أن يطبع 8
-- ==============================================================================

    current_balance          NUMERIC(10,2) NOT NULL DEFAULT 100.00,
    completed_sessions_count INT           NOT NULL DEFAULT 0,
    total_commission_deducted NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at               TIMESTAMPTZ   NOT NULL DEFAULT now()
);