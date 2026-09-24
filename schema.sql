-- ==============================================================================
-- قاعدة بيانات منصة «رحمة» للتمريض والإسعاف المنزلي (PostgreSQL / Supabase / Neon)
-- ==============================================================================

-- 1. جدول المستخدمين (المرضى، الممرضين، المشرفين)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'nurse', 'admin')),
    governorate VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. جدول الممرضين والملفات المهنية
CREATE TABLE IF NOT EXISTS nurses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    title VARCHAR(255) NOT NULL,
    bio TEXT,
    specialties TEXT[] NOT NULL DEFAULT '{}',
    governorate VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    coverage_governorates TEXT[] NOT NULL DEFAULT '{}',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
    reviews_count INT NOT NULL DEFAULT 0,
    experience_years INT NOT NULL DEFAULT 1,
    verified BOOLEAN NOT NULL DEFAULT TRUE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    -- النظام المالي: رصيد تترحيب 100 جنيه وخصم 10 جنيه لكل جلسة
    initial_welcome_credit NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    completed_sessions_count INT NOT NULL DEFAULT 0,
    total_commission_deducted NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول حجوزات وتتبع الجلسات التمريضية
CREATE TABLE IF NOT EXISTS session_bookings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    nurse_id TEXT NOT NULL REFERENCES nurses(id) ON DELETE RESTRICT,
    nurse_name VARCHAR(255) NOT NULL,
    service_id VARCHAR(50) NOT NULL,
    service_title VARCHAR(255) NOT NULL,
    booking_date VARCHAR(50) NOT NULL,
    booking_time VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' 
        CHECK (status IN ('pending', 'confirmed', 'nurse_en_route', 'nurse_arrived', 'in_progress', 'completed_by_nurse', 'confirmed_completed', 'cancelled')),
    governorate VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    -- رمز التحقق الرقمي 4-Digit OTP
    completion_code VARCHAR(4) NOT NULL,
    arrival_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    arrived_at TIMESTAMP WITH TIME ZONE,
    -- الدفع كاش للممرض
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
    -- عمولة المنصة الثابتة (10 جنيه)
    platform_commission NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    commission_deducted BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    nurse_notes TEXT,
    vital_bp VARCHAR(20),
    vital_pulse VARCHAR(20),
    vital_temp VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول سجل معاملات المحفظة والخصومات التلقائية
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nurse_id TEXT NOT NULL REFERENCES nurses(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('welcome_credit', 'session_commission_deduction', 'admin_credit')),
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL,
    session_id TEXT REFERENCES session_bookings(id) ON DELETE SET NULL,
    balance_after NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. جدول السجلات والتقارير الطبية للمرضى
CREATE TABLE IF NOT EXISTS medical_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    record_date VARCHAR(50) NOT NULL,
    encrypted_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- فهارس لتحسين سرعة الاستعلامات والبحث
CREATE INDEX IF NOT EXISTS idx_nurses_governorate ON nurses(governorate);
CREATE INDEX IF NOT EXISTS idx_nurses_available ON nurses(available);
CREATE INDEX IF NOT EXISTS idx_sessions_nurse_id ON session_bookings(nurse_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON session_bookings(status);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_nurse ON wallet_transactions(nurse_id);
