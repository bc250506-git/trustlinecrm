-- ==============================================================================
-- TRUSTLINE REAL ESTATE CRM — 2026 TEK MASTER SQL ŞEMASI & GÜNCELLEME BETİĞİ
-- ==============================================================================
-- Bu betik, Trustline CRM sisteminin TÜM tablolarını, yeni eklenen Trust 360
-- modülünü, yapay zekalı fiziki arşiv işlem kapama kolonlarını, aidat ve pul
-- takiplerini güvenli şekilde kurar ve günceller.
--
-- MEVCUT VERİLERİNİZİ SİLMEZ (IF NOT EXISTS ve ON CONFLICT kullanılır).
--
-- ÇALIŞTIRMA TALİMATI:
-- 1. Supabase Dashboard'unuza girin (https://supabase.com/dashboard)
-- 2. Projenizi seçin -> Sol menüden "SQL Editor" sekmesine tıklayın.
-- 3. "New query" butonuna basın.
-- 4. Bu dosyadaki tüm SQL kodunu kopyalayıp yapıştırın.
-- 5. Sağ alttaki yeşil "RUN" (Çalıştır) butonuna basın.
-- ==============================================================================

-- ==============================================================================
-- 1. KULLANICILAR & DANIŞMANLAR (users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT DEFAULT '',
    role TEXT DEFAULT 'AGENT', -- ADMIN (Broker) | AGENT (Danışman)
    title TEXT,
    "passwordHash" TEXT,
    "passwordSalt" TEXT,
    password_hash TEXT,
    password_salt TEXT,
    "commissionSplitRatio" NUMERIC(4,2) DEFAULT 0.60,
    commission_split_ratio NUMERIC(4,2) DEFAULT 0.60,
    active BOOLEAN DEFAULT TRUE,
    "mustChangePassword" BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    "avatarUrl" TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    permissions JSONB DEFAULT '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. MÜŞTERİ HAVUZU (customers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    "instagramHandle" TEXT,
    email TEXT,
    "birthDate" TEXT,
    source TEXT DEFAULT 'manual', -- manual, csv, meta, ycloud, portal
    category TEXT DEFAULT 'BUYER', -- BUYER, SELLER, TENANT, LANDLORD, INVESTOR
    "isAlsoBuyer" BOOLEAN DEFAULT FALSE,
    temperature TEXT DEFAULT 'warm', -- hot, warm, cold
    "isVip" BOOLEAN DEFAULT FALSE,
    region TEXT,
    "propertyType" TEXT,
    rooms TEXT,
    regions JSONB DEFAULT '[]'::jsonb,
    "propertyTypes" JSONB DEFAULT '[]'::jsonb,
    "roomsList" JSONB DEFAULT '[]'::jsonb,
    budget NUMERIC(15,2) DEFAULT 0,
    "budgetCurrency" TEXT DEFAULT 'GBP', -- GBP, EUR, USD, TRY
    notes TEXT,
    stage TEXT DEFAULT 'NEW', -- NEW, CONTACTED, SHOWING, OFFER, WON, LOST
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "isShared" BOOLEAN DEFAULT FALSE,
    "lastContactAt" TIMESTAMPTZ,
    "deletedAt" TIMESTAMPTZ,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Eksik olabilecek Müşteri Kolonları (Geriye Dönük Uyumluluk)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "fullName" TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "isAlsoBuyer" BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "isVip" BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "birthDate" TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS regions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "propertyTypes" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "roomsList" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "mergedIntoId" TEXT;

-- ==============================================================================
-- 3. PORTFÖY ENVANTERİ (properties)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    region TEXT NOT NULL,
    "propertyType" TEXT DEFAULT 'Daire',
    "listingType" TEXT DEFAULT 'sale', -- sale | rent
    price NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'GBP',
    area NUMERIC(10,2) DEFAULT 0,
    rooms TEXT,
    status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, RESERVED, SOLD, RENTED, PASSIVE, ARCHIVED
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
    "imageUrl" TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    "linkedPropertyId" TEXT,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Eksik olabilecek Portföy Kolonları
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "propertyType" TEXT DEFAULT 'Daire';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "listingType" TEXT DEFAULT 'sale';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "ownerCustomerId" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "ownerName" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "ownerPhone" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "keyHolder" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "mandateStart" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "mandateEnd" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "publicDescription" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "isOffMarket" BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "linkedPropertyId" TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

-- ==============================================================================
-- 4. AJANDA & TAKİP GÖREVLERİ (follow_ups)
-- ==============================================================================
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

-- ==============================================================================
-- 5. FİNANS & SATIŞ / KİRALAMA İŞLEMLERİ (deals)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    "dealNumber" TEXT,
    "dealType" TEXT DEFAULT 'sale', -- sale | rent
    "customerId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "propertyId" TEXT,
    "propertyTitle" TEXT,
    address TEXT,
    "propertyType" TEXT,
    area NUMERIC(10,2),
    "landType" TEXT,
    "landlordName" TEXT,
    "landlordPhone" TEXT,
    "mandateDate" TEXT,
    "depositDate" TEXT,
    "durationText" TEXT,
    "leadChannel" TEXT,
    currency TEXT DEFAULT 'GBP',
    "priceCurrency" TEXT DEFAULT 'GBP',
    "commissionCurrency" TEXT DEFAULT 'GBP',
    stage TEXT DEFAULT 'offer', -- offer, won, lost
    "askingPrice" NUMERIC(15,2) DEFAULT 0,
    "offeredPrice" NUMERIC(15,2) DEFAULT 0,
    "agreedPrice" NUMERIC(15,2) DEFAULT 0,
    deposit NUMERIC(15,2) DEFAULT 0,
    "commissionRate" NUMERIC(5,2),
    "commissionExpected" NUMERIC(15,2) DEFAULT 0,
    "commissionReceived" NUMERIC(15,2) DEFAULT 0,
    "paymentMethod" TEXT,
    "collectionDate" TEXT,
    "portfolioOrigin" TEXT DEFAULT 'advisor', -- advisor | office
    "sharingType" TEXT DEFAULT 'none', -- none | internal | external
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
    "reportDate" TEXT,
    "report_date" TEXT,
    "isHistorical" BOOLEAN DEFAULT FALSE,
    "is_historical" BOOLEAN DEFAULT FALSE,
    "archiveDocumentUrl" TEXT,
    "archive_document_url" TEXT,
    "archiveDocumentName" TEXT,
    "archive_document_name" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Deals Tablosu Yeni Kolonları (Fiziki Kağıt Form & Yapay Zeka Arşivi)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "priceCurrency" TEXT DEFAULT 'GBP';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "commissionCurrency" TEXT DEFAULT 'GBP';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "reportDate" TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "report_date" TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "isHistorical" BOOLEAN DEFAULT FALSE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "is_historical" BOOLEAN DEFAULT FALSE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "archiveDocumentUrl" TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "archive_document_url" TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "archiveDocumentName" TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "archive_document_name" TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "brokerApproval" BOOLEAN DEFAULT FALSE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "brokerApprovedAt" TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "brokerApprovedBy" TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "partnerAdvisorId" TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "partnerAdvisorName" TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS "partnerCompany" TEXT;

-- ==============================================================================
-- 6. KİRA SÖZLEŞMELERİ & AİDAT TAKİBİ (rentals)
-- ==============================================================================
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
    "paymentPeriod" TEXT DEFAULT 'monthly', -- monthly, quarterly, semi_annual, annual
    notes TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    payments JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Rentals Tablosu Eksik Kolonları (Damga Pulu, Aidat, vb.)
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "hasDues" BOOLEAN DEFAULT FALSE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "duesAmount" NUMERIC(15,2) DEFAULT 0;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "duesCurrency" TEXT DEFAULT 'GBP';
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "isStamped" BOOLEAN DEFAULT FALSE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "stampedAt" TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "paymentPeriod" TEXT DEFAULT 'monthly';
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "assignedToName" TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "tenantCustomerId" TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "landlordCustomerId" TEXT;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- ==============================================================================
-- 7. YETKİ BELGELERİ (mandates)
-- ==============================================================================
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
    "mandateType" TEXT DEFAULT 'exclusive', -- exclusive | open
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

-- ==============================================================================
-- 8. TRUST 360 KİRA & MÜLK YÖNETİMİ (trust360_contracts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS trust360_contracts (
    id TEXT PRIMARY KEY,
    "propertyId" TEXT,
    "propertyTitle" TEXT NOT NULL,
    "propertyType" TEXT DEFAULT 'Daire',
    region TEXT,
    "ownerCustomerId" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerWhatsapp" TEXT,
    "tenantName" TEXT,
    "tenantPhone" TEXT,
    "annualFee" NUMERIC(15,2) DEFAULT 450,
    currency TEXT DEFAULT 'GBP',
    "feePaymentStatus" TEXT DEFAULT 'paid', -- paid | pending
    "feePaidDate" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active', -- active, expiring_soon, expired, cancelled
    "contractNumber" TEXT,
    notes TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    expenses JSONB DEFAULT '[]'::jsonb,
    checklist JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. GÜVENLİK VE ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust360_contracts ENABLE ROW LEVEL SECURITY;

-- Eski politikaları temizleyip güncel olanları ekle
DROP POLICY IF EXISTS "Public access on users" ON users;
DROP POLICY IF EXISTS "Public access on customers" ON customers;
DROP POLICY IF EXISTS "Public access on properties" ON properties;
DROP POLICY IF EXISTS "Public access on follow_ups" ON follow_ups;
DROP POLICY IF EXISTS "Public access on deals" ON deals;
DROP POLICY IF EXISTS "Public access on rentals" ON rentals;
DROP POLICY IF EXISTS "Public access on mandates" ON mandates;
DROP POLICY IF EXISTS "Public access on trust360_contracts" ON trust360_contracts;

CREATE POLICY "Public access on users" ON users FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on customers" ON customers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on properties" ON properties FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on follow_ups" ON follow_ups FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on deals" ON deals FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on rentals" ON rentals FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on mandates" ON mandates FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on trust360_contracts" ON trust360_contracts FOR ALL TO public USING (true) WITH CHECK (true);

-- Anonim ve Authenticated rollere tam yetki tanımla
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- 10. RESMİ DANIŞMAN KADROSU (Şifreleri ve mevcut profilleri koruyarak güncelle)
-- ==============================================================================
INSERT INTO users (
    id, name, username, email, role, title, phone, "commissionSplitRatio", "mustChangePassword", must_change_password, permissions
) VALUES 
    (
        'usr-volkan',
        'Volkan Affan Kanıgür',
        'volkan.kanigur',
        '',
        'ADMIN',
        'Yönetici Ortak (Broker)',
        '+905338460080',
        1.00,
        FALSE,
        FALSE,
        '{"scope":"all","customers":true,"properties":true,"followups":true,"pipeline":true,"import":true,"finance":true,"rentals":true,"audit":true}'::jsonb
    ),
    (
        'usr-ofis',
        'Ofis Yönetimi (Broker)',
        'ofis.yonetim',
        '',
        'ADMIN',
        'Ofis Yönetimi & Broker',
        '+905428889002',
        0.60,
        FALSE,
        FALSE,
        '{"scope":"all","customers":true,"properties":true,"followups":true,"pipeline":true,"import":true,"finance":true,"rentals":true,"audit":true}'::jsonb
    ),
    (
        'usr-berk',
        'Berk Çiftçi',
        'berk.ciftci',
        '',
        'AGENT',
        'Asistan',
        '+905428823560',
        0.60,
        FALSE,
        FALSE,
        '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb
    ),
    (
        'usr-bora',
        'Bora Boran',
        'bora.boran',
        '',
        'AGENT',
        'Kıdemli Danışman',
        '+905338352910',
        0.60,
        FALSE,
        FALSE,
        '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb
    ),
    (
        'usr-hasan',
        'Hasan Yoldağ',
        'hasan.yoldag',
        '',
        'AGENT',
        'Gayrimenkul Danışmanı',
        '+905338737104',
        0.60,
        FALSE,
        FALSE,
        '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb
    ),
    (
        'usr-anil',
        'Anıl Özkan',
        'anil.ozkan',
        '',
        'AGENT',
        'Gayrimenkul Danışmanı',
        '+905488357779',
        0.60,
        FALSE,
        FALSE,
        '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb
    )
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    role = EXCLUDED.role, 
    title = EXCLUDED.title,
    phone = EXCLUDED.phone;

-- ==============================================================================
-- 11. SUPABASE REALTIME (ANLIK SENKRONİZASYON) YAYINI
-- ==============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE users, customers, properties, follow_ups, deals, rentals, mandates, trust360_contracts;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- ==============================================================================
-- 12. POSTGREST ŞEMA ÖNBELLEĞİNİ (SCHEMA CACHE) ANINDA YENİLE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
