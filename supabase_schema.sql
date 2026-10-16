-- ==============================================================================
-- TRUSTLINE REAL ESTATE CRM — MASTER POSTGRESQL VERİTABANI ŞEMASI (V4.0 ULTIMATE)
-- ==============================================================================
-- Bu betik, Trustline CRM sisteminin tüm tablolarını, ilişkilerini, kolonlarını,
-- güvenlik kurallarını (RLS) ve başlangıç KKTC verilerini sıfırdan ve eksiksiz kurar.
--
-- ÇALIŞTIRMA TALİMATI:
-- 1. Supabase Dashboard -> Projenize girin.
-- 2. Sol menüden "SQL Editor" sekmesine tıklayın.
-- 3. "New Query" butonuna basın.
-- 4. Aşağıdaki tüm SQL kodunu yapıştırın ve "RUN" butonuna tıklayın.
-- ==============================================================================

-- 0. TEMİZ BAŞLANGIÇ (ESKİ TABLOLARI VE ŞEMA ÖNBELLEĞİNİ SIFIRLA)
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS mandates CASCADE;
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==============================================================================
-- 1. KULLANICILAR & DANIŞMANLAR (users)
-- ==============================================================================
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
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
    "avatarUrl" TEXT,
    avatar_url TEXT,
    phone TEXT,
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
    "propertyType" TEXT DEFAULT 'Daire', -- Daire, Villa, Arsa, vb.
    "listingType" TEXT DEFAULT 'sale', -- sale (Satılık) | rent (Kiralık)
    price NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'GBP',
    area NUMERIC(10,2) DEFAULT 0,
    rooms TEXT, -- 1+1, 2+1, 3+1, vb.
    status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, RESERVED, SOLD, RENTED, PASSIVE
    address TEXT,
    "ownerCustomerId" TEXT,
    "ownerName" TEXT,
    "ownerPhone" TEXT,
    "keyHolder" TEXT, -- Ofis Kasası, Danışmanda, Kapıcıda, vb.
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
    "dealNumber" TEXT, -- TR-2026-001 vb.
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
    "leadChannel" TEXT, -- Branda, Tavsiye, YouTube, vb.
    currency TEXT DEFAULT 'GBP',
    stage TEXT DEFAULT 'offer', -- offer, won, lost
    "askingPrice" NUMERIC(15,2) DEFAULT 0,
    "offeredPrice" NUMERIC(15,2) DEFAULT 0,
    "agreedPrice" NUMERIC(15,2) DEFAULT 0,
    deposit NUMERIC(15,2) DEFAULT 0,
    "commissionRate" NUMERIC(5,2),
    "commissionExpected" NUMERIC(15,2) DEFAULT 0,
    "commissionReceived" NUMERIC(15,2) DEFAULT 0,
    "paymentMethod" TEXT, -- Nakit, Havale/EFT, Çek
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
    "mandateType" TEXT DEFAULT 'exclusive', -- exclusive | general
    "commissionRate" NUMERIC(5,2) DEFAULT 5.0,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, expired, cancelled
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
-- 9. BAŞLANGIÇ EKİP KADROSU (USERS)
-- ==============================================================================
INSERT INTO users (id, name, username, email, role, title, phone, "commissionSplitRatio", "mustChangePassword", must_change_password, permissions)
VALUES 
    ('usr-volkan', 'Volkan Affan Kanıgür', 'volkan.kanigur', 'volkan@trustline.com.tr', 'ADMIN', 'Yönetici Ortak (Broker)', '+90 533 860 00 00', 0.60, TRUE, TRUE, '{"scope":"all","customers":true,"properties":true,"followups":true,"pipeline":true,"import":true,"finance":true,"rentals":true,"audit":true}'::jsonb),
    ('usr-bora', 'Bora Boran', 'bora.boran', 'bora@trustline.com.tr', 'AGENT', 'Gayrimenkul Danışmanı', '+90 532 111 22 33', 0.60, TRUE, TRUE, '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb),
    ('usr-hasan', 'Hasan Yoldağ', 'hasan.yoldag', 'hasan@trustline.com.tr', 'AGENT', 'Gayrimenkul Danışmanı', '+90 533 444 55 66', 0.60, TRUE, TRUE, '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb),
    ('usr-anil', 'Anıl Özkan', 'anil.ozkan', 'anil@trustline.com.tr', 'AGENT', 'Gayrimenkul Danışmanı', '+90 535 777 88 99', 0.60, TRUE, TRUE, '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb),
    ('usr-berk', 'Berk Çiftçi', 'berk.ciftci', 'berk@trustline.com.tr', 'AGENT', 'Asistan', '+90 533 888 99 00', 0.60, TRUE, TRUE, '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    role = EXCLUDED.role, 
    title = EXCLUDED.title,
    phone = EXCLUDED.phone;

-- ==============================================================================
-- 10. BAŞLANGIÇ KKTC MÜŞTERİ HAVUZU (CUSTOMERS)
-- ==============================================================================
INSERT INTO customers (id, "fullName", phone, whatsapp, email, source, category, temperature, "isVip", region, "propertyType", rooms, budget, "budgetCurrency", stage, "assignedToId", "assignedToName", notes)
VALUES
    ('cust-1', 'Mehmet Demir', '+90 533 850 11 22', '+90 533 850 11 22', 'mehmet.demir@gmail.com', 'meta', 'BUYER', 'hot', TRUE, 'Girne Merkez', 'Daire', '2+1', 145000, 'GBP', 'OFFER', 'usr-volkan', 'Volkan Affan Kanıgür', 'Yatırımlık kira getirisi yüksek daire arıyor.'),
    ('cust-2', 'Alexander Petrov', '+7 916 555 44 33', '+7 916 555 44 33', 'petrov.alex@yandex.ru', 'portal', 'BUYER', 'hot', TRUE, 'İskele Long Beach', 'Daire', '1+1', 95000, 'GBP', 'SHOWING', 'usr-bora', 'Bora Boran', 'Denize sıfır sitede tatil evi ve oturum izni planlıyor.'),
    ('cust-3', 'Fatma Yılmaz', '+90 542 888 77 66', '+90 542 888 77 66', 'fatmayilmaz@kktc.net', 'manual', 'SELLER', 'warm', FALSE, 'Alsancak', 'Villa', '3+1', 320000, 'GBP', 'CONTACTED', 'usr-hasan', 'Hasan Yoldağ', 'Alsancak dağ manzaralı müstakil villasını satmak istiyor.'),
    ('cust-4', 'John Smith', '+44 7700 900123', '+44 7700 900123', 'john.smith@ukmail.co.uk', 'meta', 'BUYER', 'warm', TRUE, 'Esentepe', 'Villa', '3+1', 450000, 'GBP', 'SHOWING', 'usr-anil', 'Anıl Özkan', 'Golf sahasına yakın havuzlu lüks villa arayışında.'),
    ('cust-5', 'Ayşe Güven', '+90 533 812 34 56', '+90 533 812 34 56', 'ayseguven@hotmail.com', 'manual', 'TENANT', 'hot', FALSE, 'Lefkoşa Gönyeli', 'Daire', '2+1', 650, 'GBP', 'NEW', 'usr-berk', 'Berk Çiftçi', 'Üniversiteye ve anayola yakın kiralık daire bakıyor.')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 11. BAŞLANGIÇ KKTC PORTFÖY ENVANTERİ (PROPERTIES)
-- ==============================================================================
INSERT INTO properties (id, title, region, "propertyType", "listingType", price, currency, area, rooms, status, address, "ownerName", "ownerPhone", "keyHolder", "assignedToId", "assignedToName", "isShared", "isOffMarket", "publicDescription")
VALUES
    ('prop-1', 'Girne Kaşgar Mah. 2+1 Deniz Manzaralı Lüks Daire', 'Girne Merkez', 'Daire', 'sale', 135000, 'GBP', 95, '2+1', 'AVAILABLE', 'Kaşgar Court No:4 Girne', 'Mustafa Kara', '+90 533 870 99 88', 'Ofis Kasasında', 'usr-volkan', 'Volkan Affan Kanıgür', FALSE, FALSE, 'Denize sıfır, eşyalı, tapusu hazır, Türk koçanlı fırsat daire.'),
    ('prop-2', 'İskele Long Beach 1+1 Rezidans Havuzlu Sitede', 'İskele Long Beach', 'Daire', 'sale', 89000, 'GBP', 60, '1+1', 'AVAILABLE', 'Grand Sapphire Resort B Blok D:45', 'Dmitry Ivanov', '+7 903 111 22 33', 'Site Güvenliğinde', 'usr-bora', 'Bora Boran', TRUE, FALSE, 'Yüksek kira getirili, otel konseptli sitede tatil evi.'),
    ('prop-3', 'Alsancak Dağ ve Deniz Manzaralı Özel Havuzlu Müstakil Villa', 'Alsancak', 'Villa', 'sale', 295000, 'GBP', 220, '3+1', 'AVAILABLE', 'Yeşiltepe Sokak No:12 Alsancak', 'Fatma Yılmaz', '+90 542 888 77 66', 'Danışmanda (Hasan)', 'usr-hasan', 'Hasan Yoldağ', FALSE, FALSE, 'Müstakil 600m2 arsa içinde, taş şömineli, özel otoparklı villa.'),
    ('prop-4', 'Esentepe Denize Sıfır Bahçeli Lüks 3+1 Villa', 'Esentepe', 'Villa', 'sale', 420000, 'GBP', 280, '3+1', 'AVAILABLE', 'Sea Breeze Sitesi No:7 Esentepe', 'David Brown', '+44 7911 123456', 'Ofis Kasasında', 'usr-anil', 'Anıl Özkan', FALSE, TRUE, 'İlansız (Off-market) özel portföy, sonsuzluk havuzlu lüks mülk.'),
    ('prop-5', 'Lefkoşa Yenikent 2+1 Sıfır Geniş Kiralık Daire', 'Lefkoşa Gönyeli', 'Daire', 'rent', 600, 'GBP', 105, '2+1', 'AVAILABLE', 'Belediye Blv. Huzur Apt. No:3 Gönyeli', 'Kemal Tan', '+90 533 844 55 66', 'Mal Sahibinde', 'usr-berk', 'Berk Çiftçi', FALSE, FALSE, 'Asansörlü, kapalı otoparklı, anayola ve marketlere yürüme mesafesinde.')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 12. BAŞLANGIÇ FİNANS & ORTAKLIK İŞLEMLERİ (DEALS)
-- ==============================================================================
INSERT INTO deals (
    id, title, "dealNumber", "dealType", "customerId", "customerName", "customerPhone",
    "propertyId", "propertyTitle", currency, stage, "agreedPrice", deposit, "commissionRate",
    "commissionReceived", "paymentMethod", "portfolioOrigin", "sharingType",
    "partnerAdvisorId", "partnerAdvisorName", "partnerShareRate", "partnerShareAmount",
    "advisorShareRate", "advisorShareAmount", "officeShareRate", "officeShareAmount",
    "brokerApproval", "brokerApprovedAt", "brokerApprovedBy", "closingDate", "createdById", "createdByName"
) VALUES
    (
        'deal-1',
        'Girne Kaşgar 2+1 Satış İşlemi (Ofis İçi Ortak Danışman Paylaşımlı)',
        'TR-2026-001',
        'sale',
        'cust-1',
        'Mehmet Demir',
        '+90 533 850 11 22',
        'prop-1',
        'Girne Kaşgar Mah. 2+1 Deniz Manzaralı Lüks Daire',
        'GBP',
        'won',
        135000,
        15000,
        5.0,
        6750,
        'Havale/EFT',
        'office',
        'internal',
        'usr-bora',
        'Bora Boran',
        25.0,
        1687.50,
        35.0,
        2362.50,
        40.0,
        2700.00,
        TRUE,
        NOW(),
        'Volkan Affan Kanıgür',
        '2026-03-25',
        'usr-volkan',
        'Volkan Affan Kanıgür'
    ),
    (
        'deal-2',
        'İskele Long Beach Rezidans Tek Danışman Satışı',
        'TR-2026-002',
        'sale',
        'cust-2',
        'Alexander Petrov',
        '+7 916 555 44 33',
        'prop-2',
        'İskele Long Beach 1+1 Rezidans Havuzlu Sitede',
        'GBP',
        'won',
        89000,
        10000,
        5.0,
        4450,
        'Nakit',
        'advisor',
        'none',
        NULL,
        NULL,
        0,
        0,
        60.0,
        2670.00,
        40.0,
        1780.00,
        TRUE,
        NOW(),
        'Volkan Affan Kanıgür',
        '2026-04-02',
        'usr-bora',
        'Bora Boran'
    )
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 13. BAŞLANGIÇ KİRA VE YETKİ SÖZLEŞMELERİ (RENTALS & MANDATES)
-- ==============================================================================
INSERT INTO rentals (
    id, "propertyId", "propertyTitle", region, "tenantName", "tenantPhone",
    "landlordName", "landlordPhone", "monthlyRent", currency, "dueDay",
    "contractStart", "contractEnd", "depositAmount", active, "assignedToId", "assignedToName", payments
) VALUES (
    'rent-1',
    'prop-5',
    'Lefkoşa Yenikent 2+1 Sıfır Geniş Kiralık Daire',
    'Lefkoşa Gönyeli',
    'Ayşe Güven',
    '+90 533 812 34 56',
    'Kemal Tan',
    '+90 533 844 55 66',
    600,
    'GBP',
    5,
    '2026-01-01',
    '2026-12-31',
    1200,
    TRUE,
    'usr-berk',
    'Berk Çiftçi',
    '[
        {"month": 1, "year": 2026, "dueDate": "2026-01-05", "amount": 600, "paidAmount": 600, "status": "paid", "currency": "GBP"},
        {"month": 2, "year": 2026, "dueDate": "2026-02-05", "amount": 600, "paidAmount": 600, "status": "paid", "currency": "GBP"},
        {"month": 3, "year": 2026, "dueDate": "2026-03-05", "amount": 600, "paidAmount": 600, "status": "paid", "currency": "GBP"},
        {"month": 4, "year": 2026, "dueDate": "2026-04-05", "amount": 600, "paidAmount": 600, "status": "paid", "currency": "GBP"},
        {"month": 5, "year": 2026, "dueDate": "2026-05-05", "amount": 600, "paidAmount": 0, "status": "unpaid", "currency": "GBP"}
    ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO mandates (
    id, "propertyId", "propertyTitle", "propertyType", region, "listingPrice", currency,
    "ownerName", "ownerPhone", "mandateType", "commissionRate", "startDate", "endDate", status, "contractNumber", "assignedToId", "assignedToName"
) VALUES (
    'mand-1',
    'prop-1',
    'Girne Kaşgar Mah. 2+1 Deniz Manzaralı Lüks Daire',
    'Daire',
    'Girne Merkez',
    135000,
    'GBP',
    'Mustafa Kara',
    '+90 533 870 99 88',
    'exclusive',
    5.0,
    '2026-01-10',
    '2026-07-10',
    'active',
    'YTK-2026-001',
    'usr-volkan',
    'Volkan Affan Kanıgür'
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 14. SUPABASE POSTGREST ŞEMA ÖNBELLEĞİNİ (SCHEMA CACHE) ANINDA YENİLE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
