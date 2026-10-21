-- ==============================================================================
-- TRUSTLINE REAL ESTATE CRM — GÜNCELLEME VE KOLON SENKRONİZASYON SQL BETİĞİ
-- ==============================================================================
-- Bu betik, mevcut verilerinizi ASLA SİLMEZ veya BOZMAZ.
-- Son eklenen özellikler (Aidat takibi, Sorumlu danışman kilidi/ataması,
-- Çift ilan eşleştirme, Alıcı/Satıcı adayı, Pasif/Arşivleme vb.) için
-- eksik olabilecek tüm sütunları güvenli şekilde (IF NOT EXISTS) ekler.
--
-- TALİMAT:
-- 1. Supabase Dashboard'a girin: https://supabase.com/dashboard
-- 2. Projenizi seçin -> Sol menüden "SQL Editor" sekmesine tıklayın.
-- 3. "New query" butonuna tıklayıp bu kodların tamamını yapıştırın.
-- 4. Sağ alttaki yeşil "RUN" (Çalıştır) butonuna basın.
-- ==============================================================================

-- 1. KİRA SÖZLEŞMELERİ (rentals) — Aidat, Damga Pulu, Ödeme Periyodu ve Danışman
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS "hasDues" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS "duesAmount" NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS "duesCurrency" TEXT DEFAULT 'GBP';
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS "isStamped" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS "stampedAt" TEXT;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS "paymentPeriod" TEXT DEFAULT 'monthly';
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS "assignedToName" TEXT;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS "tenantCustomerId" TEXT;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS "landlordCustomerId" TEXT;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Snake_case uyumluluk alternatifleri (Bazı Supabase kurulumları için)
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS has_dues BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS dues_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS dues_currency TEXT DEFAULT 'GBP';
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS is_stamped BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS stamped_at TEXT;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS payment_period TEXT DEFAULT 'monthly';
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS assigned_to_id TEXT;
ALTER TABLE IF EXISTS rentals ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;


-- 2. PORTFÖYLER (properties) — Pasif/Arşiv Statüsü, Çift İlan Eşi, İlansız (Off-Market), Danışman
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "linkedPropertyId" TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "isOffMarket" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "assignedToName" TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "ownerCustomerId" TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "ownerName" TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "ownerPhone" TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "keyHolder" TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "listingUrl" TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "publicDescription" TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'AVAILABLE';

-- Snake_case uyumluluk alternatifleri
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS linked_property_id TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS is_off_market BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS assigned_to_id TEXT;
ALTER TABLE IF EXISTS properties ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;


-- 3. MÜŞTERİLER (customers) — Aynı Zamanda Alıcı mı, Danışman Ataması, Kriter Listeleri
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "isAlsoBuyer" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "birthDate" TEXT;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "assignedToName" TEXT;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "isVip" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS regions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "propertyTypes" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "roomsList" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "budgetCurrency" TEXT DEFAULT 'GBP';
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS "mergedIntoId" TEXT;

-- Snake_case uyumluluk alternatifleri
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS is_also_buyer BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS assigned_to_id TEXT;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;


-- 4. YETKİ BELGELERİ & SÖZLEŞMELER (mandates) — Danışman ve Dosya No
ALTER TABLE IF EXISTS mandates ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE IF EXISTS mandates ADD COLUMN IF NOT EXISTS "assignedToName" TEXT;
ALTER TABLE IF EXISTS mandates ADD COLUMN IF NOT EXISTS "contractNumber" TEXT;
ALTER TABLE IF EXISTS mandates ADD COLUMN IF NOT EXISTS "propertyId" TEXT;
ALTER TABLE IF EXISTS mandates ADD COLUMN IF NOT EXISTS "ownerCustomerId" TEXT;

-- Snake_case uyumluluk alternatifleri
ALTER TABLE IF EXISTS mandates ADD COLUMN IF NOT EXISTS assigned_to_id TEXT;
ALTER TABLE IF EXISTS mandates ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
ALTER TABLE IF EXISTS mandates ADD COLUMN IF NOT EXISTS contract_number TEXT;


-- 5. FİNANS & İŞLEM KAPAMA (deals) — Broker Onayı, Paylaşım Danışmanı ve Hak Edişler
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "dealNumber" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "dealType" TEXT DEFAULT 'sale';
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "propertyType" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS area NUMERIC(10,2);
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "landType" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "landlordName" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "landlordPhone" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "mandateDate" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "depositDate" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "durationText" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "leadChannel" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "commissionRate" NUMERIC(5,2);
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "collectionDate" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "paymentDue" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "closingDate" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "dealDate" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "createdByName" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "brokerApproval" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "brokerApprovedAt" TIMESTAMPTZ;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "brokerApprovedBy" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "sharingType" TEXT DEFAULT 'none';
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "portfolioOrigin" TEXT DEFAULT 'advisor';
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "partnerName" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "partnerPhone" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "partnerCompany" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "partnerAdvisorId" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "partnerAdvisorName" TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "partnerShareRate" NUMERIC(5,2) DEFAULT 0;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "partnerShareAmount" NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "advisorShareRate" NUMERIC(5,2) DEFAULT 0;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "advisorShareAmount" NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "officeShareRate" NUMERIC(5,2) DEFAULT 0;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "officeShareAmount" NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS "closingNotes" TEXT;

-- Snake_case uyumluluk alternatifleri
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS deal_number TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS deal_type TEXT DEFAULT 'sale';
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS landlord_name TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS landlord_phone TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS mandate_date TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS deposit_date TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS duration_text TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS lead_channel TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2);
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS collection_date TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS payment_due TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS closing_date TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS deal_date TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS broker_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS broker_approved_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS deals ADD COLUMN IF NOT EXISTS broker_approved_by TEXT;


-- 6. AJANDA & TAKİPLER (follow_ups) — Danışman ve Ofis Etkinliği
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS "propertyTitle" TEXT;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS "assignedToName" TEXT;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS "isOfficeEvent" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS "hasSpecificTime" BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS "createdByName" TEXT;

-- Snake_case uyumluluk alternatifleri
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS property_title TEXT;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS assigned_to_id TEXT;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS is_office_event BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS has_specific_time BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS created_by_id TEXT;
ALTER TABLE IF EXISTS follow_ups ADD COLUMN IF NOT EXISTS created_by_name TEXT;


-- 7. KULLANICILAR (users) — Danışman Hak Ediş & Yetki Sütunları
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS "commissionSplitRatio" NUMERIC(4,2) DEFAULT 0.60;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"scope":"own","customers":true,"properties":true,"followups":true,"pipeline":true,"import":false,"finance":false,"rentals":false,"audit":false}'::jsonb;


-- 8. GÜVENLİK VE ERİŞİM İZİNLERİ (RLS - Row Level Security)
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mandates ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access on users' AND tablename = 'users') THEN
        CREATE POLICY "Public access on users" ON users FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access on customers' AND tablename = 'customers') THEN
        CREATE POLICY "Public access on customers" ON customers FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access on properties' AND tablename = 'properties') THEN
        CREATE POLICY "Public access on properties" ON properties FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access on follow_ups' AND tablename = 'follow_ups') THEN
        CREATE POLICY "Public access on follow_ups" ON follow_ups FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access on deals' AND tablename = 'deals') THEN
        CREATE POLICY "Public access on deals" ON deals FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access on rentals' AND tablename = 'rentals') THEN
        CREATE POLICY "Public access on rentals" ON rentals FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public access on mandates' AND tablename = 'mandates') THEN
        CREATE POLICY "Public access on mandates" ON mandates FOR ALL TO public USING (true) WITH CHECK (true);
    END IF;
END $$;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
