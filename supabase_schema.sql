-- ==============================================================================
-- TRUSTLINE CRM 4.0 — SUPABASE POSTGRESQL VERİTABANI ŞEMASI
-- ==============================================================================
-- Bu betiği Supabase Dashboard -> SQL Editor alanına yapıştırıp "Run" butonuna basarak
-- tüm tabloları, ilişkileri ve indeksleri doğrudan oluşturabilirsiniz.
-- ==============================================================================

-- 1. ENUM TİPLERİ
CREATE TYPE user_role AS ENUM ('ADMIN', 'AGENT');
CREATE TYPE pipeline_stage AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'LISTING_SENT', 'APPOINTMENT', 'SHOWING', 'OFFER', 'WON', 'LOST');
CREATE TYPE currency_code AS ENUM ('TRY', 'USD', 'EUR', 'GBP');
CREATE TYPE customer_category AS ENUM ('BUYER', 'SELLER', 'TENANT');
CREATE TYPE property_status AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'ARCHIVED');

-- 2. KULLANICILAR & DANIŞMANLAR
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'AGENT',
    active BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    phone TEXT,
    permissions JSONB DEFAULT '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MÜŞTERİLER (CUSTOMERS & VIP)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE,
    whatsapp TEXT UNIQUE,
    instagram_handle TEXT,
    email TEXT,
    source TEXT DEFAULT 'manual',
    category customer_category DEFAULT 'BUYER',
    temperature TEXT DEFAULT 'warm',
    is_vip BOOLEAN DEFAULT FALSE,
    region TEXT,
    property_type TEXT,
    budget NUMERIC(15,2),
    budget_currency currency_code DEFAULT 'TRY',
    notes TEXT,
    stage pipeline_stage DEFAULT 'NEW',
    assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
    last_contact_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    merged_into_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PORTFÖYLER (PROPERTIES)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    region TEXT NOT NULL,
    property_type TEXT DEFAULT 'Daire',
    listing_type TEXT DEFAULT 'sale', -- sale | rent
    price NUMERIC(15,2) NOT NULL,
    currency currency_code DEFAULT 'TRY',
    area NUMERIC(10,2),
    rooms TEXT,
    status property_status DEFAULT 'AVAILABLE',
    address TEXT,
    owner_name TEXT,
    owner_phone TEXT,
    key_holder TEXT,
    location TEXT,
    mandate_start DATE,
    mandate_end DATE,
    notes TEXT,
    public_description TEXT DEFAULT '',
    assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PORTFÖY FOTOĞRAFLARI (STORAGE METADATA)
CREATE TABLE IF NOT EXISTS property_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    shareable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FİYAT GEÇMİŞİ (AUDIT)
CREATE TABLE IF NOT EXISTS property_price_history (
    id BIGSERIAL PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    old_price NUMERIC(15,2),
    old_currency currency_code,
    price NUMERIC(15,2) NOT NULL,
    currency currency_code NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TAKİPLER & AJANDA (FOLLOW UPS)
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    kind TEXT DEFAULT 'call', -- call, meeting, showing, other
    due_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'open', -- open, done, cancelled
    outcome TEXT DEFAULT 'pending',
    feedback TEXT DEFAULT '',
    assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FİNANS & SATIŞ ANLAŞMALARI (DEALS)
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id),
    property_id UUID REFERENCES properties(id),
    currency currency_code DEFAULT 'TRY',
    stage TEXT DEFAULT 'offer',
    asking_price NUMERIC(15,2) DEFAULT 0,
    offered_price NUMERIC(15,2) DEFAULT 0,
    agreed_price NUMERIC(15,2) DEFAULT 0,
    deposit NUMERIC(15,2) DEFAULT 0,
    commission_expected NUMERIC(15,2) DEFAULT 0,
    commission_received NUMERIC(15,2) DEFAULT 0,
    portfolio_origin TEXT NOT NULL, -- advisor (%60/%40) | office (%50/%50)
    payment_due DATE,
    closing_date DATE,
    notes TEXT,
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. KİRA SÖZLEŞMELERİ & ÇİZELGE (RENTALS)
CREATE TABLE IF NOT EXISTS rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_key TEXT UNIQUE,
    data JSONB NOT NULL, -- Kiracı, ev sahibi, kira tutarı, vadeler, ödemeler
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rental_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
    due_date TEXT NOT NULL,
    file_url TEXT NOT NULL,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rental_id, due_date)
);

-- 10. İNDEKSLEME VE PERFORMANS
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_assigned ON customers(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(region);
CREATE INDEX IF NOT EXISTS idx_followups_due ON follow_ups(due_at);

-- 12. YETKİ SÖZLEŞMELERİ (MANDATES)
CREATE TABLE IF NOT EXISTS mandates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    property_title TEXT NOT NULL,
    property_type TEXT DEFAULT 'Daire',
    region TEXT NOT NULL,
    listing_price NUMERIC(15,2) DEFAULT 0,
    currency currency_code DEFAULT 'GBP',
    owner_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    owner_name TEXT NOT NULL,
    owner_phone TEXT,
    mandate_type TEXT DEFAULT 'exclusive', -- exclusive | open
    commission_rate NUMERIC(5,2) DEFAULT 5.0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active', -- active | expiring_soon | expired | cancelled
    contract_number TEXT,
    notes TEXT,
    assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mandates_status ON mandates(status);
CREATE INDEX IF NOT EXISTS idx_mandates_end_date ON mandates(end_date);
CREATE INDEX IF NOT EXISTS idx_mandates_assigned ON mandates(assigned_to_id);

-- 11. BAŞLANGIÇ EKİP KADROSU (SEED DATA)
INSERT INTO users (name, username, email, role, phone, permissions)
VALUES 
    ('Ofis (Tüm Yetkiler)', 'ofis.yonetim', 'ofis@trustline.com.tr', 'ADMIN', '+90 212 287 00 00', '{"scope":"all","customers":true,"properties":true,"followups":true,"pipeline":true,"import":true,"finance":true,"rentals":true,"audit":true}'::jsonb),
    ('Bora Boran', 'bora.boran', 'bora@trustline.com.tr', 'AGENT', '+90 532 111 22 33', '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb),
    ('Hasan Yoldağ', 'hasan.yoldag', 'hasan@trustline.com.tr', 'AGENT', '+90 533 444 55 66', '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb),
    ('Anıl Özkan', 'anil.ozkan', 'anil@trustline.com.tr', 'AGENT', '+90 535 777 88 99', '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb)
ON CONFLICT (username) DO NOTHING;

