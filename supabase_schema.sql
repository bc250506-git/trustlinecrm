-- ==============================================================================
-- TRUSTLINE REAL ESTATE CRM — MASTER POSTGRESQL VERİTABANI ŞEMASI (V4.1 PRODUCTION CLEAN)
-- ==============================================================================
-- Bu betik, Trustline CRM sisteminin tüm tablolarını, güvenlik kurallarını (RLS),
-- gerçek danışman kadrosunu ve canlı gerçek kullanıma hazır BOMBOŞ temiz tabloları kurar.
--
-- Mock/sahte veri İÇERMEZ. Sistem sıfırdan sizin gerçek kullanımınıza hazırdır.
--
-- ÇALIŞTIRMA TALİMATI:
-- 1. Supabase Dashboard -> Projenize girin (https://supabase.com/dashboard)
-- 2. Sol menüden "SQL Editor" sekmesine tıklayın.
-- 3. "New Query" butonuna basın.
-- 4. Aşağıdaki tüm SQL kodunu yapıştırın ve "RUN" (Çalıştır) butonuna tıklayın.
-- ==============================================================================

-- 0. TEMİZ BAŞLANGIÇ (TÜM ESKİ VE ARTIK TABLOLARI, TİPLERİ SIFIRLA)
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS rental_receipts CASCADE;
DROP TABLE IF EXISTS mandates CASCADE;
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS property_photos CASCADE;
DROP TABLE IF EXISTS property_price_history CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS property_status CASCADE;
DROP TYPE IF EXISTS customer_category CASCADE;
DROP TYPE IF EXISTS pipeline_stage CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS currency_code CASCADE;

-- ==============================================================================
-- 1. KULLANICILAR & DANIŞMANLAR (users)
-- ==============================================================================
CREATE TABLE users (
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
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    "instagramHandle" TEXT,
    email TEXT,
    "birthDate" TEXT,
    source TEXT DEFAULT 'manual', -- manual, csv, meta, ycloud, portal
    category TEXT DEFAULT 'BUYER', -- BUYER, SELLER, TENANT, LANDLORD, INVESTOR
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

-- ==============================================================================
-- 3. PORTFÖY ENVANTERİ (properties)
-- ==============================================================================
CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    region TEXT NOT NULL, -- Girne, Lefkoşa, İskele, Gazimağusa, vb.
    "propertyType" TEXT DEFAULT 'Daire', -- Daire, Villa, Arsa, Ticari, vb.
    "listingType" TEXT DEFAULT 'sale', -- sale (Satılık) | rent (Kiralık)
    price NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'GBP',
    area NUMERIC(10,2) DEFAULT 0,
    rooms TEXT, -- 1+1, 2+1, 3+1, vb.
    status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, RESERVED, SOLD, RENTED, PASSIVE, ARCHIVED
    address TEXT,
    "ownerCustomerId" TEXT,
    "ownerName" TEXT,
    "ownerPhone" TEXT,
    "keyHolder" TEXT, -- Ofis Kasası, Danışmanda, Mal Sahibinde, vb.
    location TEXT,
    "mandateStart" TEXT,
    "mandateEnd" TEXT,
    notes TEXT,
    "publicDescription" TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "isShared" BOOLEAN DEFAULT FALSE,
    "isOffMarket" BOOLEAN DEFAULT FALSE, -- Gizli / İlansız Portföy
    "listingUrl" TEXT,
    "imageUrl" TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    "linkedPropertyId" TEXT, -- Çift İlan (Aynı mülkün diğer Satılık/Kiralık ilanı)
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. AJANDA & TAKİP GÖREVLERİ (follow_ups)
-- ==============================================================================
CREATE TABLE follow_ups (
    id TEXT PRIMARY KEY,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "propertyId" TEXT,
    "propertyTitle" TEXT,
    title TEXT NOT NULL,
    kind TEXT DEFAULT 'call', -- call, meeting, showing, office_event, other
    "dueAt" TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'open', -- open, done, cancelled
    outcome TEXT DEFAULT 'pending', -- pending, attended, no_show, liked, uninterested, offered
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
CREATE TABLE deals (
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
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. KİRA SÖZLEŞMELERİ & ÖDEME PLANI (rentals)
-- ==============================================================================
CREATE TABLE rentals (
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
    "isStamped" BOOLEAN DEFAULT FALSE,
    "stampedAt" TEXT,
    "paymentPeriod" TEXT DEFAULT 'monthly', -- monthly, quarterly, semi_annual, annual
    notes TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    payments JSONB DEFAULT '[]'::jsonb
);

-- ==============================================================================
-- 7. YETKİ BELGELERİ & SÖZLEŞMELER (mandates)
-- ==============================================================================
CREATE TABLE mandates (
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
    status TEXT DEFAULT 'active', -- active, expiring_soon, expired, cancelled
    "contractNumber" TEXT,
    notes TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. GÜVENLİK, YETKİ VE ERİŞİM İZİNLERİ (RLS - Row Level Security)
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access on users" ON users FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on customers" ON customers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on properties" ON properties FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on follow_ups" ON follow_ups FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on deals" ON deals FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on rentals" ON rentals FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access on mandates" ON mandates FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- 9. GERÇEK TRUSTLINE EKİP KADROSU (MAİLLER BOŞ, GÜNCEL TELEFONLAR)
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
        TRUE,
        TRUE,
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
        TRUE,
        TRUE,
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
        TRUE,
        TRUE,
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
        TRUE,
        TRUE,
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
        TRUE,
        TRUE,
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
        TRUE,
        TRUE,
        '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb
    )
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    role = EXCLUDED.role, 
    title = EXCLUDED.title,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

-- ==============================================================================
-- 10. REALTIME (ANLIK SENKRONİZASYON) YAYINI ETKİNLEŞTİRME
-- ==============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE users, customers, properties, follow_ups, deals, rentals, mandates;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- ==============================================================================
-- 11. SUPABASE POSTGREST ŞEMA ÖNBELLEĞİNİ (SCHEMA CACHE) ANINDA YENİLE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
