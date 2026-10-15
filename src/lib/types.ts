export type UserRole = "ADMIN" | "AGENT";

export type PipelineStage =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "LISTING_SENT"
  | "APPOINTMENT"
  | "SHOWING"
  | "OFFER"
  | "WON"
  | "LOST";

export type Currency = "TRY" | "USD" | "EUR" | "GBP";

export type CustomerCategory = "BUYER" | "SELLER" | "TENANT";

export type PropertyStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "RENTED"
  | "ARCHIVED";

export interface UserPermissions {
  scope: "all" | "own";
  customers: boolean;
  properties: boolean;
  followups: boolean;
  pipeline: boolean;
  import: boolean;
  finance: boolean;
  rentals: boolean;
  audit: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  title?: string; // "Asistan", "Yönetici Ortak (Broker)", "Gayrimenkul Danışmanı"
  // Kriptografik Güvenlik (Düz metin şifre ASLA tutulmaz)
  passwordHash?: string; // PBKDF2 SHA-256 Kriptolu Hash
  passwordSalt?: string; // Kullanıcıya özel kriptografik rastgele tuz
  commissionSplitRatio?: number; // 1.0 = %100 komisyon danışmanın (bölüşüm yok), 0.6 = %60 danışman / %40 ofis
  active: boolean;
  mustChangePassword?: boolean; // İlk girişte kendi şifresini belirleme zorunluluğu
  avatarUrl?: string;
  phone?: string;
  permissions: UserPermissions;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  instagramHandle?: string;
  email?: string;
  birthDate?: string; // YYYY-MM-DD (Opsiyonel Doğum Tarihi)
  source: string; // manual, csv, meta, ycloud
  category: CustomerCategory;
  temperature: "hot" | "warm" | "cold";
  isVip: boolean;
  region: string;
  propertyType: string;
  rooms?: string;
  regions?: string[];
  propertyTypes?: string[];
  roomsList?: string[];
  budget: number;
  budgetCurrency: Currency;
  notes?: string;
  stage: PipelineStage;
  assignedToId?: string;
  assignedToName?: string;
  isShared?: boolean;
  lastContactAt?: string;
  deletedAt?: string | null;
  mergedIntoId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  url: string;
  shareable: boolean;
}

export interface PropertyPriceHistory {
  id: number;
  propertyId: string;
  oldPrice?: number;
  oldCurrency?: Currency;
  price: number;
  currency: Currency;
  actorId?: string;
  actorName?: string;
  createdAt: string;
}

export interface Property {
  id: string;
  title: string;
  region: string;
  propertyType: string;
  listingType: "sale" | "rent";
  price: number;
  currency: Currency;
  area: number;
  rooms: string;
  status: PropertyStatus;
  address: string;
  ownerCustomerId?: string;
  ownerName: string;
  ownerPhone: string;
  keyHolder?: string;
  location?: string;
  mandateStart?: string;
  mandateEnd?: string;
  notes?: string;
  publicDescription?: string;
  assignedToId?: string;
  assignedToName?: string;
  isShared?: boolean;
  isOffMarket?: boolean; // İlansız / Özel Portföy (Off-Market)
  listingUrl?: string; // Varsa portal/ilan linki
  photos: PropertyPhoto[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  propertyId?: string;
  propertyTitle?: string;
  title: string;
  kind: "call" | "meeting" | "showing" | "office_event" | "other";
  dueAt: string;
  status: "open" | "done" | "cancelled";
  outcome: "pending" | "attended" | "no_show" | "liked" | "uninterested" | "offered";
  feedback?: string;
  assignedToId?: string;
  assignedToName?: string;
  isOfficeEvent?: boolean;
  hasSpecificTime?: boolean;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
}

export type DealSharingType = "none" | "external" | "internal";

export interface Deal {
  id: string;
  title: string;
  dealNumber?: string; // İşlem / Portföy No
  dealType?: "sale" | "rent"; // Satış / Kiralama
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  propertyId: string;
  propertyTitle?: string;
  address?: string;
  propertyType?: string; // Ofis, Daire, Villa, Apartman, Arsa, Dükkan
  area?: number; // Arazi / Net m²
  landType?: "commercial" | "residential"; // Ticari / Villalık
  landlordName?: string;
  landlordPhone?: string;
  mandateDate?: string; // Yetki belgesi alınan tarih
  depositDate?: string; // Depozito tarihi
  durationText?: string; // Satış/kiralama süresi (örn: "45 Gün", "2 Ay")
  leadChannel?: string; // Alıcının ulaştığı kanal (Branda, Telefon, Tavsiye, Web, Sosyal Medya, Saha Çalışması, YouTube, Yüz Yüze Sunum, Etkinlik, İlan Siteleri, Portföy Videosu, Reklam Alanları)
  currency: Currency;
  stage: "offer" | "won" | "lost";
  askingPrice: number;
  offeredPrice: number;
  agreedPrice: number;
  deposit: number;
  commissionRate?: number; // % komisyon oranı
  commissionExpected: number;
  commissionReceived: number;
  paymentMethod?: string; // Nakit, Havale/EFT, Çek
  collectionDate?: string; // Tahsilat tarihi
  portfolioOrigin: "advisor" | "office"; // Danışman Kendi Portföyü / Ofis Portföyü
  sharingType?: DealSharingType; // none (Tek Danışman), external (Dış Ofis ile), internal (Şirket içi Danışman ile)
  partnerName?: string; // Ortak Danışman / Ofis Adı
  partnerPhone?: string;
  partnerCompany?: string; // Dış Ofis Adı
  partnerAdvisorId?: string; // Şirket içi ortak danışman ID
  partnerAdvisorName?: string;
  partnerShareRate?: number; // Ortak pay oranı %
  partnerShareAmount?: number; // Ortak pay tutarı
  advisorShareRate?: number; // Satış GD pay oranı %
  advisorShareAmount?: number; // Satış GD pay tutarı
  officeShareRate?: number; // Trustline Ofis pay oranı %
  officeShareAmount?: number; // Trustline Ofis pay tutarı
  brokerApproval?: boolean; // Broker Onayı
  brokerApprovedAt?: string;
  brokerApprovedBy?: string;
  paymentDue?: string;
  closingDate?: string;
  closingNotes?: string;
  notes?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
}

export interface RentalMonthPayment {
  month: number; // 1-12
  year?: number; // Yıl (örn: 2026, 2027)
  periodKey?: string; // YYYY-MM
  amount: number;
  currency: Currency;
  dueDate: string; // YYYY-MM-DD
  status: "paid" | "unpaid" | "overdue";
  paidAmount: number;
  paidDate?: string;
  receiptUrl?: string;
  receiptName?: string;
}

export interface RentalContract {
  id: string;
  propertyId?: string;
  propertyTitle: string;
  region: string;
  tenantCustomerId?: string;
  tenantName: string;
  tenantPhone: string;
  landlordCustomerId?: string;
  landlordName: string;
  landlordPhone: string;
  monthlyRent: number;
  currency: Currency;
  dueDay: number; // 1-31
  contractStart: string;
  contractEnd: string;
  depositAmount: number;
  active: boolean;
  notes?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt?: string;
  payments: RentalMonthPayment[];
}

export interface MandateContract {
  id: string;
  propertyId?: string;
  propertyTitle: string;
  propertyType: string;
  region: string;
  listingPrice: number;
  currency: Currency;
  ownerCustomerId?: string;
  ownerName: string;
  ownerPhone: string;
  mandateType: "exclusive" | "open"; // Tek Yetkili / Genel Yetki
  commissionRate: number; // örn: 5
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: "active" | "expiring_soon" | "expired" | "cancelled";
  contractNumber?: string;
  notes?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
}

export interface WorkflowNotification {
  id: string;
  type: "match" | "rent_due" | "rent_paid" | "lead_decay" | "mandate_expiring" | "contract_expiring" | "birthday" | "office_event";
  title: string;
  message: string;
  targetTab?: "matchmaker" | "rentals" | "mandates" | "customers" | "properties" | "calendar";
  targetId?: string;
  whatsappPhone?: string;
  whatsappDraft?: string;
  read: boolean;
  createdAt: string;
  urgency: "high" | "medium" | "info";
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "rental" | "matchmaker" | "lead" | "mandate" | "birthday";
  lastTriggeredAt?: string;
}

