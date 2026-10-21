-- ==============================================================================
-- TRUSTLINE CRM — SUPABASE POSTGRESQL VERİTABANI ŞEMASI (TAM VE UYUMLU)
-- ==============================================================================
-- Bu SQL betiğini Supabase Dashboard -> SQL Editor alanına yapıştırıp "Run" butonuna basarak
-- tüm tabloları, izinleri ve başlangıç verilerini tek tıkla oluşturabilirsiniz.
-- ==============================================================================

-- 1. KULLANICILAR & DANIŞMANLAR (users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'AGENT',
    title TEXT,
    "passwordHash" TEXT,
    "passwordSalt" TEXT,
    "commissionSplitRatio" NUMERIC(4,2) DEFAULT 0.60,
    active BOOLEAN DEFAULT TRUE,
    "mustChangePassword" BOOLEAN DEFAULT TRUE,
    "avatarUrl" TEXT,
    phone TEXT,
    permissions JSONB DEFAULT '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Var olan tablolar için güvenlik yükseltme sütunları (Geriye Dönük Uyumluluk):
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordSalt" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;

-- 2. MÜŞTERİLER (customers)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    "instagramHandle" TEXT,
    email TEXT,
    source TEXT DEFAULT 'manual',
    category TEXT DEFAULT 'BUYER',
    "isAlsoBuyer" BOOLEAN DEFAULT FALSE,
    temperature TEXT DEFAULT 'warm',
    "isVip" BOOLEAN DEFAULT FALSE,
    region TEXT,
    "propertyType" TEXT,
    rooms TEXT,
    regions JSONB DEFAULT '[]'::jsonb,
    "propertyTypes" JSONB DEFAULT '[]'::jsonb,
    "roomsList" JSONB DEFAULT '[]'::jsonb,
    budget NUMERIC(15,2) DEFAULT 0,
    "budgetCurrency" TEXT DEFAULT 'TRY',
    notes TEXT,
    stage TEXT DEFAULT 'NEW',
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "isShared" BOOLEAN DEFAULT FALSE,
    "lastContactAt" TIMESTAMPTZ,
    "deletedAt" TIMESTAMPTZ,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PORTFÖYLER (properties)
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    region TEXT NOT NULL,
    "propertyType" TEXT DEFAULT 'Daire',
    "listingType" TEXT DEFAULT 'sale',
    price NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    area NUMERIC(10,2) DEFAULT 0,
    rooms TEXT,
    status TEXT DEFAULT 'AVAILABLE',
    address TEXT,
    "ownerCustomerId" TEXT,
    "ownerName" TEXT,
    "ownerPhone" TEXT,
    "keyHolder" TEXT,
    location TEXT,
    "mandateStart" TEXT,
    "mandateEnd" TEXT,
    notes TEXT,
    "publicDescription" TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "isShared" BOOLEAN DEFAULT FALSE,
    "isOffMarket" BOOLEAN DEFAULT FALSE,
    "listingUrl" TEXT,
    "linkedPropertyId" TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AJANDA & TAKİPLER (follow_ups)
CREATE TABLE IF NOT EXISTS follow_ups (
    id TEXT PRIMARY KEY,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "propertyId" TEXT,
    "propertyTitle" TEXT,
    title TEXT NOT NULL,
    kind TEXT DEFAULT 'call',
    "dueAt" TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'open',
    outcome TEXT DEFAULT 'pending',
    feedback TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "isOfficeEvent" BOOLEAN DEFAULT FALSE,
    "hasSpecificTime" BOOLEAN DEFAULT FALSE,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FİNANS & SATIŞ ANLAŞMALARI (deals)
CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT,
    "propertyId" TEXT,
    "propertyTitle" TEXT,
    currency TEXT DEFAULT 'TRY',
    stage TEXT DEFAULT 'offer',
    "askingPrice" NUMERIC(15,2) DEFAULT 0,
    "offeredPrice" NUMERIC(15,2) DEFAULT 0,
    "agreedPrice" NUMERIC(15,2) DEFAULT 0,
    deposit NUMERIC(15,2) DEFAULT 0,
    "commissionExpected" NUMERIC(15,2) DEFAULT 0,
    "commissionReceived" NUMERIC(15,2) DEFAULT 0,
    "portfolioOrigin" TEXT DEFAULT 'advisor',
    "sharingType" TEXT DEFAULT 'none',
    "partnerName" TEXT,
    "partnerPhone" TEXT,
    "partnerCompany" TEXT,
    "partnerAdvisorId" TEXT,
    "partnerAdvisorName" TEXT,
    "partnerShareRate" NUMERIC(5,2) DEFAULT 0,
    "partnerShareAmount" NUMERIC(15,2) DEFAULT 0,
    "advisorShareRate" NUMERIC(5,2) DEFAULT 0,
    "advisorShareAmount" NUMERIC(15,2) DEFAULT 0,
    "officeShareRate" NUMERIC(5,2) DEFAULT 0,
    "officeShareAmount" NUMERIC(15,2) DEFAULT 0,
    "brokerApproval" BOOLEAN DEFAULT FALSE,
    "brokerApprovedAt" TIMESTAMPTZ,
    "brokerApprovedBy" TEXT,
    "paymentDue" TEXT,
    "closingDate" TEXT,
    "closingNotes" TEXT,
    notes TEXT,
    "dealDate" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. KİRA SÖZLEŞMELERİ (rentals)
CREATE TABLE IF NOT EXISTS rentals (
    id TEXT PRIMARY KEY,
    "propertyId" TEXT,
    "propertyTitle" TEXT NOT NULL,
    region TEXT,
    "tenantCustomerId" TEXT,
    "tenantName" TEXT NOT NULL,
    "tenantPhone" TEXT,
    "landlordCustomerId" TEXT,
    "landlordName" TEXT NOT NULL,
    "landlordPhone" TEXT,
    "monthlyRent" NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'GBP',
    "dueDay" INTEGER NOT NULL DEFAULT 5,
    "contractStart" TEXT,
    "contractEnd" TEXT,
    "depositAmount" NUMERIC(15,2) DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    "hasDues" BOOLEAN DEFAULT FALSE,
    "duesAmount" NUMERIC(15,2) DEFAULT 0,
    "duesCurrency" TEXT DEFAULT 'GBP',
    "isStamped" BOOLEAN DEFAULT FALSE,
    "stampedAt" TEXT,
    "paymentPeriod" TEXT DEFAULT 'monthly',
    notes TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    payments JSONB DEFAULT '[]'::jsonb
);

-- 7. YETKİ SÖZLEŞMELERİ (mandates)
CREATE TABLE IF NOT EXISTS mandates (
    id TEXT PRIMARY KEY,
    "propertyId" TEXT,
    "propertyTitle" TEXT NOT NULL,
    "propertyType" TEXT DEFAULT 'Daire',
    region TEXT NOT NULL,
    "listingPrice" NUMERIC(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'GBP',
    "ownerCustomerId" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT,
    "mandateType" TEXT DEFAULT 'exclusive',
    "commissionRate" NUMERIC(5,2) DEFAULT 5.0,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    "contractNumber" TEXT,
    notes TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. GÜVENLİK VE ERİŞİM İZİNLERİ (RLS - Row Level Security)
-- Tüm tabloların anon ve authenticated rolleri tarafından okunup yazılabilmesini sağla
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access on users" ON users;
CREATE POLICY "Public access on users" ON users FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on customers" ON customers;
CREATE POLICY "Public access on customers" ON customers FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on properties" ON properties;
CREATE POLICY "Public access on properties" ON properties FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on follow_ups" ON follow_ups;
CREATE POLICY "Public access on follow_ups" ON follow_ups FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on deals" ON deals;
CREATE POLICY "Public access on deals" ON deals FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on rentals" ON rentals;
CREATE POLICY "Public access on rentals" ON rentals FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access on mandates" ON mandates;
CREATE POLICY "Public access on mandates" ON mandates FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 9. BAŞLANGIÇ EKİP KADROSU
INSERT INTO users (id, name, username, email, role, title, phone, permissions)
VALUES 
    ('usr-volkan', 'Volkan Affan Kanıgür', 'volkan.kanigur', 'volkan@trustline.com.tr', 'ADMIN', 'Yönetici Ortak (Broker)', '+90 533 860 00 00', '{"scope":"all","customers":true,"properties":true,"followups":true,"pipeline":true,"import":true,"finance":true,"rentals":true,"audit":true}'::jsonb),
    ('usr-bora', 'Bora Boran', 'bora.boran', 'bora@trustline.com.tr', 'AGENT', 'Gayrimenkul Danışmanı', '+90 532 111 22 33', '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb),
    ('usr-hasan', 'Hasan Yoldağ', 'hasan.yoldag', 'hasan@trustline.com.tr', 'AGENT', 'Gayrimenkul Danışmanı', '+90 533 444 55 66', '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb),
    ('usr-anil', 'Anıl Özkan', 'anil.ozkan', 'anil@trustline.com.tr', 'AGENT', 'Gayrimenkul Danışmanı', '+90 535 777 88 99', '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb),
    ('usr-berk', 'Berk Çiftçi', 'berk.ciftci', 'berk@trustline.com.tr', 'AGENT', 'Asistan', '+90 533 888 99 00', '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, title = EXCLUDED.title;
