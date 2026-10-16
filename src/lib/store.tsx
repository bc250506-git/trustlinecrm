"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  User,
  Customer,
  Property,
  FollowUp,
  Deal,
  RentalContract,
  RentalMonthPayment,
  PipelineStage,
  WorkflowNotification,
  AutomationRule,
  MandateContract,
  Currency,
} from "./types";
import {
  initialUsers,
  initialProperties,
  initialCustomers,
  initialFollowUps,
  initialDeals,
  initialRentals,
  initialAutomationRules,
  initialNotifications,
  initialMandates,
} from "./mockData";
import {
  saveCustomer,
  deleteCustomerFromDb,
  saveProperty,
  deletePropertyFromDb,
  saveDeal,
  deleteDealFromDb,
  saveRental,
  deleteRentalFromDb,
  saveMandate,
  deleteMandateFromDb,
  saveFollowUp,
  deleteFollowUpFromDb,
  getCustomers,
  getProperties,
  getDeals,
  getRentals,
  getMandates,
  getFollowUps,
  setupRealtimeSync,
  getUsersFromSupabase,
  saveUserCredentialsToSupabase,
  seedAllDataToSupabase,
} from "./supabase/db";
import {
  verifyPassword,
  hashPasswordWithSalt,
  generateSalt,
  validatePasswordStrength,
} from "./security/authCrypto";
import {
  NormalizedBackupData,
  mergeEntityList,
} from "./backup/restoreEngine";
import {
  SnapshotItem,
  getLocalSnapshots,
  saveSnapshot,
  deleteSnapshot,
  checkAndCreateDailySnapshot,
} from "./backup/snapshotEngine";

interface StoreContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  customers: Customer[];
  myCustomers: Customer[];
  sharedCustomers: Customer[];
  properties: Property[];
  myProperties: Property[];
  sharedProperties: Property[];
  followUps: FollowUp[];
  deals: Deal[];
  myDeals: Deal[];
  rentals: RentalContract[];
  mandates: MandateContract[];
  // Otomasyon & Bildirimler (Faz 2)
  notifications: WorkflowNotification[];

  automationRules: AutomationRule[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  toggleAutomationRule: (id: string) => void;
  triggerAutomationEngine: () => {
    matchesFound: number;
    rentAlerts: number;
    decayAlerts: number;
    mandateAlerts: number;
    contractAlerts?: number;
    birthdayAlerts?: number;
    agendaAlerts?: number;
    overdueAlerts?: number;
    dealCollectionAlerts?: number;
    brokerApprovalAlerts?: number;
    internalDealAlerts?: number;
    staleAlerts?: number;
    missingMandateAlerts?: number;
  };
  // Actions
  addCustomer: (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => boolean;
  toggleCustomerShare: (id: string) => void;
  addProperty: (property: Omit<Property, "id" | "createdAt" | "updatedAt">) => Property;
  updateProperty: (id: string, updates: Partial<Property>) => boolean;
  deleteProperty: (id: string) => boolean;
  togglePropertyShare: (id: string) => void;
  addFollowUp: (followUp: Omit<FollowUp, "id" | "createdAt">) => void;
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => void;
  deleteFollowUp: (id: string) => boolean;
  postponeFollowUp: (id: string) => void;
  completeFollowUp: (id: string, outcome: string, feedback?: string) => void;
  updateDealStage: (id: string, newStage: "offer" | "won" | "lost", closingNotes?: string) => void;
  addDeal: (deal: Omit<Deal, "id" | "createdAt"> & { createdAt?: string }) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => boolean;
  deleteDeal: (id: string) => boolean;
  addRentalContract: (contract: Omit<RentalContract, "id" | "createdAt" | "payments"> & { payments?: RentalMonthPayment[] }) => RentalContract;
  updateRentalContract: (id: string, updates: Partial<RentalContract>) => boolean;
  deleteRentalContract: (id: string) => boolean;
  toggleRentalPayment: (rentalId: string, monthOrPeriodKey: number | string, isPaid: boolean, dueDate?: string) => void;
  uploadRentalReceipt: (rentalId: string, monthOrPeriodKey: number | string, fileName: string, dueDate?: string) => void;
  renewRentalContract: (rentalId: string) => boolean;
  relistRentalProperty: (rentalId: string) => boolean;
  loseRentalProperty: (rentalId: string) => boolean;
  reactivateProperty: (propertyId: string) => boolean;
  // Permissions & Role
  canManageCustomer: (customer: Customer) => boolean;
  canManageProperty: (property: Property) => boolean;
  canManageFollowUp: (followUp: FollowUp) => boolean;
  canManageDeal: (deal: Deal) => boolean;
  canManageRental: (rental: RentalContract) => boolean;
  canManageMandate: (mandate: MandateContract) => boolean;
  addMandateContract: (mandate: Omit<MandateContract, "id" | "createdAt">) => MandateContract;
  updateMandateContract: (id: string, updates: Partial<MandateContract>) => boolean;
  deleteMandateContract: (id: string) => boolean;
  isBroker: boolean;
  // Auth & Settings (Kriptografik ve Bulut Senkronizasyonlu)
  isAuthenticated: boolean;
  login: (
    usernameOrEmail: string,
    passwordAttempt: string
  ) => Promise<{ success: boolean; mustActivate?: boolean; user?: User; message?: string }>;
  activateUserPassword: (
    userId: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUserPassword: (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  // Yedekleme & Geri Yükleme Motoru (Granular Restore & Snapshots)
  restoreBackup: (
    data: NormalizedBackupData,
    mode: "merge" | "clean"
  ) => Promise<{
    success: boolean;
    message: string;
    stats: {
      customers: number;
      properties: number;
      deals: number;
      rentals: number;
      mandates: number;
      followUps: number;
    };
  }>;
  snapshots: SnapshotItem[];
  createManualSnapshot: (name: string, description: string) => void;
  restoreSnapshot: (snapshotId: string) => Promise<{ success: boolean; message: string }>;
  removeSnapshot: (snapshotId: string) => void;
}


const USERS_STORAGE_KEY = "trustline_crm_users_kktc_v1";
const PROPERTIES_STORAGE_KEY = "trustline_crm_properties_kktc_v1";
const CURRENT_USER_STORAGE_KEY = "trustline_crm_current_user_kktc_v1";
const AUTH_STORAGE_KEY = "trustline_crm_auth_v3";

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Kullanıcılar (Kalıcı şifre güncellemeleri için)
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("trustline_crm_users_v3");
        const saved = localStorage.getItem(USERS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return initialUsers;
  });

  // Oturum durumu (Giriş yapıldı mı?)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedAuth === "true") return true;
    }
    return false; // Login ekranını göstererek başla
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("trustline_crm_current_user_v3");
        const savedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        if (savedUser) {
          return JSON.parse(savedUser);
        }
      } catch (e) {}
    }
    return initialUsers[0]; // Volkan Affan Kanıgür
  });
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [properties, setProperties] = useState<Property[]>(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("trustline_crm_properties_v3");
        const saved = localStorage.getItem(PROPERTIES_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return initialProperties;
  });
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialFollowUps);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [rentals, setRentals] = useState<RentalContract[]>(initialRentals);
  const [mandates, setMandates] = useState<MandateContract[]>(initialMandates);
  const [notifications, setNotifications] = useState<WorkflowNotification[]>(initialNotifications);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(initialAutomationRules);

  useEffect(() => {
    if (typeof window !== "undefined" && properties.length > 0) {
      try {
        localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(properties));
      } catch (e) {}
    }
  }, [properties]);

  // Supabase Realtime Canlı Senkronizasyon (Faz 5) ve Kullanıcı Kimlikleri
  useEffect(() => {
    let isMounted = true;

    // 1. Buluttaki en güncel kullanıcı ve kimlik bilgilerini çek
    getUsersFromSupabase()
      .then((cloudUsers) => {
        if (!isMounted || !cloudUsers || cloudUsers.length === 0) return;
        setUsers((prev) => {
          const map = new Map(prev.map((u) => [u.id, u]));
          for (const cu of cloudUsers) {
            const existing = map.get(cu.id);
            if (existing) {
              const hasLocalPassword = Boolean(existing.passwordHash && existing.passwordSalt);
              const hasCloudPassword = Boolean(cu.passwordHash && cu.passwordSalt);
              map.set(cu.id, {
                ...existing,
                ...cu,
                passwordHash: cu.passwordHash || existing.passwordHash,
                passwordSalt: cu.passwordSalt || existing.passwordSalt,
                mustChangePassword: hasCloudPassword
                  ? cu.mustChangePassword
                  : hasLocalPassword
                  ? false
                  : (cu.mustChangePassword ?? existing.mustChangePassword ?? true),
              });
            } else {
              map.set(cu.id, cu);
            }
          }
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      })
      .catch(() => {});

    // 2. Canlı veritabanındaki tüm güncel operasyonel verileri (müşteriler, portföyler, işlemler, kiralar vb.) otomatik çek
    Promise.all([
      getCustomers(),
      getProperties(),
      getDeals(),
      getRentals(),
      getMandates(),
      getFollowUps(),
    ])
      .then(([cloudCust, cloudProp, cloudDeals, cloudRent, cloudMand, cloudFollow]) => {
        if (!isMounted) return;
        if (cloudCust) setCustomers(cloudCust);
        if (cloudProp) setProperties(cloudProp);
        if (cloudDeals) setDeals(cloudDeals);
        if (cloudRent) setRentals(cloudRent);
        if (cloudMand) setMandates(cloudMand);
        if (cloudFollow) setFollowUps(cloudFollow);
      })
      .catch(() => {});

    // 3. Realtime WebSocket Dinleyicisi (Çoklu cihaz anında senkronizasyon)
    const cleanup = setupRealtimeSync(({ table, eventType, newRecord, oldRecord }) => {
      if (eventType === "INSERT" || eventType === "UPDATE") {
        if (table === "users" && newRecord) {
          setUsers((prev) => {
            const existing = prev.find((u) => u.id === newRecord.id);
            const cloudHash = newRecord.passwordHash || newRecord.password_hash;
            const cloudSalt = newRecord.passwordSalt || newRecord.password_salt;
            const effectiveHash = cloudHash || existing?.passwordHash;
            const effectiveSalt = cloudSalt || existing?.passwordSalt;
            const hasPassword = Boolean(effectiveHash && effectiveSalt);

            const updated: User = {
              ...(existing || {}),
              ...newRecord,
              passwordHash: effectiveHash,
              passwordSalt: effectiveSalt,
              mustChangePassword: hasPassword
                ? (cloudHash ? (newRecord.mustChangePassword ?? newRecord.must_change_password ?? false) : false)
                : (newRecord.mustChangePassword ?? newRecord.must_change_password ?? true),
            };
            const exists = Boolean(existing);
            const nextUsers = exists
              ? prev.map((u) => (u.id === updated.id ? updated : u))
              : [...prev, updated];
            try {
              localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
            } catch {}
            return nextUsers;
          });
        } else if (table === "customers" && newRecord) {
          setCustomers((prev) => {
            const exists = prev.some((c) => c.id === newRecord.id);
            return exists
              ? prev.map((c) => (c.id === newRecord.id ? { ...c, ...newRecord } : c))
              : [newRecord, ...prev];
          });
        } else if (table === "properties" && newRecord) {
          setProperties((prev) => {
            const exists = prev.some((p) => p.id === newRecord.id);
            return exists
              ? prev.map((p) => (p.id === newRecord.id ? { ...p, ...newRecord } : p))
              : [newRecord, ...prev];
          });
        } else if (table === "deals" && newRecord) {
          setDeals((prev) => {
            const exists = prev.some((d) => d.id === newRecord.id);
            return exists
              ? prev.map((d) => (d.id === newRecord.id ? { ...d, ...newRecord } : d))
              : [newRecord, ...prev];
          });
        } else if (table === "rentals" && newRecord) {
          setRentals((prev) => {
            const exists = prev.some((r) => r.id === newRecord.id);
            return exists
              ? prev.map((r) => (r.id === newRecord.id ? { ...r, ...newRecord } : r))
              : [newRecord, ...prev];
          });
        } else if (table === "mandates" && newRecord) {
          setMandates((prev) => {
            const exists = prev.some((m) => m.id === newRecord.id);
            return exists
              ? prev.map((m) => (m.id === newRecord.id ? { ...m, ...newRecord } : m))
              : [newRecord, ...prev];
          });
        } else if (table === "follow_ups" && newRecord) {
          setFollowUps((prev) => {
            const exists = prev.some((f) => f.id === newRecord.id);
            return exists
              ? prev.map((f) => (f.id === newRecord.id ? { ...f, ...newRecord } : f))
              : [newRecord, ...prev];
          });
        }
      } else if (eventType === "DELETE") {
        const deletedId = (oldRecord as any)?.id;
        if (deletedId) {
          if (table === "customers") setCustomers((prev) => prev.filter((c) => c.id !== deletedId));
          else if (table === "properties") setProperties((prev) => prev.filter((p) => p.id !== deletedId));
          else if (table === "deals") setDeals((prev) => prev.filter((d) => d.id !== deletedId));
          else if (table === "rentals") setRentals((prev) => prev.filter((r) => r.id !== deletedId));
          else if (table === "mandates") setMandates((prev) => prev.filter((m) => m.id !== deletedId));
          else if (table === "follow_ups") setFollowUps((prev) => prev.filter((f) => f.id !== deletedId));
        }
      }
    });

    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  const markNotificationAsRead = (id: string) => {

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleAutomationRule = (id: string) => {
    setAutomationRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              enabled: !r.enabled,
              lastTriggeredAt: !r.enabled ? "Şimdi (Aktif Edildi)" : r.lastTriggeredAt,
            }
          : r
      )
    );
  };

  // Akıllı Otomasyon ve Tarama Motoru
  const triggerAutomationEngine = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    let matchesFound = 0;
    let rentAlerts = 0;
    let decayAlerts = 0;
    let mandateAlerts = 0;
    let contractAlerts = 0;
    let birthdayAlerts = 0;
    let agendaAlerts = 0;
    let overdueAlerts = 0;
    let dealCollectionAlerts = 0;
    let brokerApprovalAlerts = 0;
    let internalDealAlerts = 0;
    let staleAlerts = 0;
    let missingMandateAlerts = 0;
    const newNotifications: WorkflowNotification[] = [];

    const isRuleEnabled = (id: string) =>
      automationRules.find((r) => r.id === id)?.enabled ?? true;

    // 1. Kira Vadesi Hatırlatma Robotu
    if (isRuleEnabled("rule-rent-reminder")) {
      rentals.forEach((r) => {
        if (!r.active) return;
        r.payments.forEach((p) => {
          if (p.status === "unpaid" || p.status === "overdue") {
            const dueDate = new Date(p.dueDate);
            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 3) {
              const alreadyNotified = notifications.some(
                (n) => n.targetId === r.id && n.type === "rent_due" && n.id.includes(`-${p.month}-`)
              );
              if (!alreadyNotified) {
                rentAlerts++;
                newNotifications.push({
                  id: `notif-rent-${r.id}-${p.month}-${Date.now()}`,
                  type: "rent_due",
                  title: `⏰ Kira Vadesi: ${r.tenantName} (${p.amount} ${p.currency})`,
                  message: `${r.propertyTitle} mülkünün ${p.month}. ay kira vadesine ${
                    diffDays <= 0 ? "GECİKMEDE" : `${diffDays} gün kaldı`
                  }.`,
                  targetTab: "rentals",
                  targetId: r.id,
                  whatsappPhone: r.tenantPhone,
                  whatsappDraft: `Merhaba ${r.tenantName}, ${r.propertyTitle} için ${p.dueDate} vadeli ${p.amount} ${p.currency} kira ödemeniz yaklaşmıştır. Ofis IBAN: GB29NWBK60161331926819 (Trustline Real Estate). Dekontunuzu WhatsApp'tan iletebilirsiniz. Teşekkür ederiz.`,
                  read: false,
                  createdAt: "Az önce",
                  urgency: "high",
                });
              }
            }
          }
        });
      });
    }

    // 2. Sıcak Müşteri 10 Gün Soğuma Bekçisi
    if (isRuleEnabled("rule-lead-decay")) {
      customers.forEach((c) => {
        if (c.temperature === "hot" || c.temperature === "warm") {
          const lastDate = c.lastContactAt ? new Date(c.lastContactAt) : new Date(c.createdAt);
          const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays >= 10) {
            const alreadyNotified = notifications.some(
              (n) => n.targetId === c.id && n.type === "lead_decay"
            );
            if (!alreadyNotified) {
              decayAlerts++;
              newNotifications.push({
                id: `notif-decay-${c.id}-${Date.now()}`,
                type: "lead_decay",
                title: `🧊 Müşteri Soğuma Uyarısı: ${c.fullName}`,
                message: `${c.fullName} ile ${diffDays} gündür hiçbir temas kurulmadı. Satış kaybı riski yüksek!`,
                targetTab: "customers",
                targetId: c.id,
                whatsappPhone: c.whatsapp || c.phone,
                whatsappDraft: `Merhaba ${c.fullName}, Trustline Real Estate'den arıyorum. KKTC'de aradığınız portföy kriterlerinize uygun yeni portföylerimiz havuza dahil oldu. Kısa bir değerlendirme görüşmesi yapabilir miyiz?`,
                read: false,
                createdAt: "Az önce",
                urgency: "high",
              });
            }
          }
        }
      });
    }

    // 3. Portföy Yetki Sözleşmesi Yenileme Alarmı (Kademeli: 60 Gün Sarı Bilgilendirme / 30 Gün Kırmızı Acil)
    if (isRuleEnabled("rule-mandate-renewal")) {
      mandates.forEach((m) => {
        if (m.endDate && m.status !== "cancelled") {
          const endDate = new Date(m.endDate);
          const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 60) {
            const isCritical = diffDays <= 30;
            const notifType = "mandate_expiring";

            const hasCriticalNotif = notifications.some(
              (n) => n.targetId === m.id && n.type === notifType && n.urgency === "high"
            );
            const hasAnyNotif = notifications.some(
              (n) => n.targetId === m.id && n.type === notifType
            );

            const shouldNotify = isCritical ? !hasCriticalNotif : !hasAnyNotif;

            if (shouldNotify) {
              mandateAlerts++;
              newNotifications.push({
                id: `notif-mandate-${m.id}-${isCritical ? "high" : "med"}-${Date.now()}`,
                type: notifType,
                title: isCritical
                  ? `🚨 ACİL: Yetki Sözleşmesi Sona Eriyor (30 Gün): ${m.propertyTitle}`
                  : `📄 Yetki Sözleşmesi Bilgilendirmesi (60 Gün): ${m.propertyTitle}`,
                message: isCritical
                  ? `Mal sahibi ${m.ownerName} ile yapılan tek yetki sözleşmesinin bitişine ${
                      diffDays <= 0 ? "SÜRESİ DOLDU!" : `yalnızca ${diffDays} gün kaldı!`
                    } Acil yetki uzatma görüşmesi yapın.`
                  : `Mal sahibi ${m.ownerName} ile yapılan yetki sözleşmesinin bitişine ${diffDays} gün kaldı. Yenileme için hazırlık yapın.`,
                targetTab: "mandates",
                targetId: m.id,
                whatsappPhone: m.ownerPhone,
                whatsappDraft: `Merhaba ${m.ownerName}, ${m.propertyTitle} mülkünüzün satış yetki sözleşmesi ${
                  diffDays <= 0 ? "süresi dolmuştur" : `${diffDays} gün sonra tamamlanacaktır`
                }. Satış çalışmalarına hız kesmeden devam etmek ve yetki süresini uzatmak üzere görüşebilir miyiz?`,
                read: false,
                createdAt: isCritical ? "Acil (30 Gün)" : "Bilgilendirme (60 Gün)",
                urgency: isCritical ? "high" : "medium",
              });
            }
          }
        }
      });
    }

    // 4. Kira Sözleşmesi Bitiş Alarmı (Kademeli: 60 Gün Sarı Bilgilendirme / 30 Gün Kırmızı Acil)
    if (isRuleEnabled("rule-contract-expiration")) {
      rentals.forEach((r) => {
        if (!r.active || !r.contractEnd) return;
        const end = new Date(r.contractEnd);
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 60) {
          const isCritical = diffDays <= 30;
          const notifType = "contract_expiring";

          const hasCriticalNotif = notifications.some(
            (n) => n.targetId === r.id && n.type === notifType && n.urgency === "high"
          );
          const hasAnyNotif = notifications.some(
            (n) => n.targetId === r.id && n.type === notifType
          );

          const shouldNotify = isCritical ? !hasCriticalNotif : !hasAnyNotif;

          if (shouldNotify) {
            contractAlerts++;
            newNotifications.push({
              id: `notif-contract-${r.id}-${isCritical ? "high" : "med"}-${Date.now()}`,
              type: notifType,
              title: isCritical
                ? `🚨 ACİL: Kira Sözleşmesi Sona Eriyor (30 Gün): ${r.propertyTitle}`
                : `📑 Kira Sözleşmesi Bilgilendirmesi (60 Gün): ${r.propertyTitle}`,
              message: isCritical
                ? `${r.tenantName} ile yapılan kira sözleşmesinin bitişine ${
                    diffDays <= 0 ? "SÜRESİ DOLDU!" : `yalnızca ${diffDays} gün kaldı!`
                  } Kiralama masasından 3 aksiyondan birini (Yenile / Aktife Al / Kaldır) uygulayın.`
                : `${r.tenantName} ile yapılan kira sözleşmesinin bitişine ${diffDays} gün kaldı. Yenileme koşullarını değerlendirin.`,
              targetTab: "rentals",
              targetId: r.id,
              whatsappPhone: r.tenantPhone,
              whatsappDraft: `Merhaba ${r.tenantName}, ${r.propertyTitle} mülkünüzün kira sözleşmesi ${
                diffDays <= 0 ? "tamamlanmıştır" : `${diffDays} gün sonra sona erecektir`
              }. Yeni dönem kira sözleşmesi yenileme koşullarını görüşmek üzere sizi ofisimize davet ediyoruz. Teşekkür ederiz.`,
              read: false,
              createdAt: isCritical ? "Acil (30 Gün)" : "Bilgilendirme (60 Gün)",
              urgency: isCritical ? "high" : "medium",
            });
          }
        }
      });
    }

    // 5. Müşteri Doğum Günü Kutlama Robotu
    if (isRuleEnabled("rule-customer-birthday")) {
      customers.forEach((c) => {
        if (!c.birthDate) return;
        const parts = c.birthDate.split("-");
        if (parts.length >= 3) {
          const bMonth = parseInt(parts[1], 10);
          const bDay = parseInt(parts[2], 10);
          if (now.getMonth() + 1 === bMonth && now.getDate() === bDay) {
            const yearKey = now.getFullYear();
            const alreadyNotified = notifications.some(
              (n) => n.targetId === c.id && n.type === "birthday" && n.id.includes(`bday-${c.id}-${yearKey}`)
            );
            if (!alreadyNotified) {
              birthdayAlerts++;
              newNotifications.push({
                id: `notif-bday-${c.id}-${yearKey}`,
                type: "birthday",
                title: `🎂 Doğum Günü: ${c.fullName}`,
                message: `Bugün ${c.fullName} müşterinizin doğum günü! Müşteri ilişkilerini güçlendirmek için kutlama mesajı iletin.`,
                targetTab: "customers",
                targetId: c.id,
                whatsappPhone: c.whatsapp || c.phone,
                whatsappDraft: `Sayın ${c.fullName}, Trustline Gayrimenkul ailesi olarak yeni yaşınızı en içten dileklerimizle kutlar; sevdiklerinizle birlikte sağlıklı, huzurlu ve bol kazanç dolu nice mutlu yıllar dileriz. 🎂🎉`,
                read: false,
                createdAt: "Bugün",
                urgency: "high",
              });
            }
          }
        }
      });
    }

    // 6. Günün Ajandası & Randevu Özeti Robotu
    if (isRuleEnabled("rule-daily-agenda")) {
      const userTodayTasks = followUps.filter((f) => {
        if (f.status !== "open") return false;
        const taskDate = f.dueAt?.split("T")[0];
        const isAssigned = currentUser.role === "ADMIN" || f.assignedToId === currentUser.id;
        return taskDate === todayStr && isAssigned;
      });

      if (userTodayTasks.length > 0) {
        const todayNotifId = `notif-agenda-today-${todayStr}-${currentUser.id}`;
        const alreadyNotified = notifications.some((n) => n.id === todayNotifId);
        if (!alreadyNotified) {
          agendaAlerts++;
          const showings = userTodayTasks.filter((t) => t.kind === "showing").length;
          const calls = userTodayTasks.filter((t) => t.kind === "call").length;
          const others = userTodayTasks.length - showings - calls;
          const parts = [
            showings > 0 ? `${showings} yer gösterme` : null,
            calls > 0 ? `${calls} telefon araması` : null,
            others > 0 ? `${others} toplantı / randevu` : null,
          ]
            .filter(Boolean)
            .join(", ");

          newNotifications.push({
            id: todayNotifId,
            type: "daily_agenda",
            title: `📅 Günün Ajandası: Bugün ${userTodayTasks.length} Göreviniz Var`,
            message: `Bugün takviminizde ${parts || `${userTodayTasks.length} randevu/görev`} planlanmıştır. Başarılı bir iş günü dileriz.`,
            targetTab: "calendar",
            read: false,
            createdAt: "Bugün 09:00",
            urgency: "medium",
          });
        }
      }
    }

    // 7. Gecikmiş / Tamamlanmamış Randevu Alarmı
    if (isRuleEnabled("rule-overdue-agenda")) {
      const overdueTasks = followUps.filter((f) => {
        if (f.status !== "open") return false;
        const taskDate = f.dueAt?.split("T")[0];
        const isAssigned = currentUser.role === "ADMIN" || f.assignedToId === currentUser.id;
        return taskDate && taskDate < todayStr && isAssigned;
      });

      overdueTasks.forEach((f) => {
        const notifId = `notif-overdue-${f.id}`;
        const alreadyNotified = notifications.some(
          (n) => n.targetId === f.id && n.type === "overdue_appointment"
        );
        if (!alreadyNotified) {
          overdueAlerts++;
          newNotifications.push({
            id: notifId,
            type: "overdue_appointment",
            title: `⚠️ Gecikmiş Randevu / Görev: ${f.title}`,
            message: `${f.customerName ? `${f.customerName} müşterisiyle planlanan ` : ""}${f.title} görevinin vadesi (${f.dueAt?.split("T")[0]}) geçmiş ancak tamamlanmamıştır!`,
            targetTab: "calendar",
            targetId: f.id,
            whatsappPhone: f.customerPhone,
            whatsappDraft: f.customerPhone
              ? `Merhaba ${f.customerName || "Sayın Müşterimiz"}, daha önce planladığımız randevumuz hakkında size ulaşmak istedim. Uygun bir zamanınızda görüşebilir miyiz?`
              : undefined,
            read: false,
            createdAt: "Gecikmede",
            urgency: "high",
          });
        }
      });
    }

    // 8. İşlem Kapama / Komisyon Tahsilat Vadesi Alarmı
    if (isRuleEnabled("rule-deal-collection-due")) {
      deals.forEach((deal) => {
        if (deal.stage !== "lost" && deal.paymentDue) {
          const isDue = deal.paymentDue <= todayStr;
          const balance = (deal.commissionExpected || 0) - (deal.commissionReceived || 0);
          if (isDue && balance > 0) {
            const isAssigned =
              currentUser.role === "ADMIN" ||
              deal.createdById === currentUser.id ||
              deal.partnerAdvisorId === currentUser.id;
            if (isAssigned) {
              const notifId = `notif-deal-due-${deal.id}`;
              const alreadyNotified = notifications.some(
                (n) => n.targetId === deal.id && n.type === "deal_collection_due"
              );
              if (!alreadyNotified) {
                dealCollectionAlerts++;
                newNotifications.push({
                  id: notifId,
                  type: "deal_collection_due",
                  title: `💰 Komisyon Tahsilat Vadesi: ${deal.title}`,
                  message: `${deal.dealNumber || "İşlem"} için beklenen ${balance.toLocaleString("tr-TR")} ${deal.currency} bakiye komisyon tahsilatının vadesi (${deal.paymentDue}) dolmuştur!`,
                  targetTab: "finance",
                  targetId: deal.id,
                  whatsappPhone: deal.customerPhone || deal.landlordPhone,
                  whatsappDraft: deal.customerPhone
                    ? `Merhaba ${deal.customerName || "Sayın Müşterimiz"}, Trustline Real Estate bünyesinde gerçekleşen ${deal.title} işleminin bakiye hizmet bedeli tahsilat vadesi gelmiştir. Ödeme detayları için iletişime geçebilirsiniz. Teşekkürler.`
                    : undefined,
                  read: false,
                  createdAt: "Vadesi Geldi",
                  urgency: "high",
                });
              }
            }
          }
        }
      });
    }

    // 9. Broker Onayı Bekleyen İşlem Alarmı (Yönetici Bildirimi)
    if (isRuleEnabled("rule-broker-pending-approval") && currentUser.role === "ADMIN") {
      deals.forEach((deal) => {
        const isPending = !deal.brokerApprovedAt && !deal.brokerApproval;
        if (isPending) {
          const notifId = `notif-broker-approval-${deal.id}`;
          const alreadyNotified = notifications.some(
            (n) => n.targetId === deal.id && n.type === "pending_broker_approval"
          );
          if (!alreadyNotified) {
            brokerApprovalAlerts++;
            newNotifications.push({
              id: notifId,
              type: "pending_broker_approval",
              title: `🛡️ Broker Onayı Bekleyen İşlem: ${deal.title}`,
              message: `${deal.createdByName || "Danışman"} yeni bir işlem kapattı (${deal.agreedPrice?.toLocaleString("tr-TR")} ${deal.currency}). Komisyon bölüşümü ve resmi ofis onayı için denetiminizi bekliyor.`,
              targetTab: "finance",
              targetId: deal.id,
              read: false,
              createdAt: "Onay Bekliyor",
              urgency: "high",
            });
          }
        }
      });
    }

    // 9.5 Şirket İçi Ortak İşlem & Komisyon Paylaşım Bildirimi (2. Danışman Hak Ediş Teyidi)
    if (isRuleEnabled("rule-internal-deal-notify")) {
      deals.forEach((deal) => {
        if (deal.sharingType === "internal" && deal.partnerAdvisorId) {
          const isTargetUser =
            currentUser.role === "ADMIN" ||
            currentUser.id === deal.partnerAdvisorId ||
            currentUser.id === deal.createdById;
          if (!isTargetUser) return;

          const notifId = `notif-internal-shared-${deal.id}`;
          const alreadyNotified = notifications.some(
            (n) => n.targetId === deal.id && n.id.startsWith("notif-internal-")
          );

          if (!alreadyNotified) {
            internalDealAlerts++;
            const isApproved = Boolean(deal.brokerApproval);
            newNotifications.push({
              id: notifId,
              type: isApproved ? "deal_approved" : "deal_shared",
              title: isApproved
                ? `🤝 Ortak İşlem Onaylandı: ${deal.title}`
                : `🤝 Ortak İşlem (Onay Bekliyor): ${deal.title}`,
              message: `${deal.createdByName || "Danışman"} ile yürüttüğünüz ortak işlemde (${deal.agreedPrice?.toLocaleString("tr-TR")} ${deal.currency}) 2. Danışman (Müşteri Bacağı) olarak kayıtlısınız. ${
                isApproved
                  ? `Broker onayladı! Hak edişiniz: ${deal.partnerShareAmount?.toLocaleString("tr-TR")} ${deal.currency} (%${deal.partnerShareRate || 25}).`
                  : `Broker onayı bekleniyor. Onaylandığında hak edişiniz: ${deal.partnerShareAmount?.toLocaleString("tr-TR")} ${deal.currency} olarak yansıyacaktır.`
              }`,
              targetTab: "finance",
              targetId: deal.id,
              read: false,
              createdAt: "Aktif İşlem",
              urgency: isApproved ? "medium" : "high",
            });
          }
        }
      });
    }

    // 10. Hareketsiz / Yaşlanan Portföy Alarmı (30+ Gün)
    if (isRuleEnabled("rule-stale-property")) {
      properties.forEach((p) => {
        if (p.status !== "AVAILABLE" || p.deletedAt) return;
        const isAssigned = currentUser.role === "ADMIN" || p.assignedToId === currentUser.id;
        if (!isAssigned) return;

        const lastDate = p.updatedAt ? new Date(p.updatedAt) : new Date(p.createdAt);
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 30) {
          const notifId = `notif-stale-${p.id}`;
          const alreadyNotified = notifications.some(
            (n) => n.targetId === p.id && n.type === "stale_property"
          );
          if (!alreadyNotified) {
            staleAlerts++;
            newNotifications.push({
              id: notifId,
              type: "stale_property",
              title: `⏳ Hareketsiz Portföy (30+ Gün): ${p.title}`,
              message: `${p.title} portföyü ${diffDays} gündür hareketsizdir. Mal sahibi (${p.ownerName || "Bilinmiyor"}) ile fiyat revizyonu veya yeni tanıtım stratejisi görüşün.`,
              targetTab: "properties",
              targetId: p.id,
              whatsappPhone: p.ownerPhone,
              whatsappDraft: p.ownerPhone
                ? `Merhaba ${p.ownerName || "Sayın Mülk Sahibimiz"}, ${p.title} portföyümüzle ilgili piyasa hareketlerini ve müşteri dönüşlerini değerlendirmek üzere kısa bir telefon görüşmesi yapabilir miyiz?`
                : undefined,
              read: false,
              createdAt: "30+ gün hareketsiz",
              urgency: "medium",
            });
          }
        }
      });
    }

    // 11. Tek Yetki Sözleşmesi Eksik Portföy Uyarısı
    if (isRuleEnabled("rule-missing-mandate")) {
      properties.forEach((p) => {
        if (p.status !== "AVAILABLE" || p.deletedAt) return;
        const isAssigned = currentUser.role === "ADMIN" || p.assignedToId === currentUser.id;
        if (!isAssigned) return;

        const hasMandate = mandates.some(
          (m) =>
            (m.propertyId === p.id ||
              (m.propertyTitle &&
                p.title &&
                m.propertyTitle.trim().toLowerCase() === p.title.trim().toLowerCase())) &&
            m.status !== "cancelled"
        );

        if (!hasMandate) {
          const notifId = `notif-missing-mandate-${p.id}`;
          const alreadyNotified = notifications.some(
            (n) => n.targetId === p.id && n.type === "missing_mandate"
          );
          if (!alreadyNotified) {
            missingMandateAlerts++;
            newNotifications.push({
              id: notifId,
              type: "missing_mandate",
              title: `📑 Tek Yetki Belgesi Eksik: ${p.title}`,
              message: `${p.title} portföyünüz yayında ancak sisteme Tek Yetki Sözleşmesi eklenmemiştir. Mal sahibi (${p.ownerName || "Bilinmiyor"}) ile tek yetkili aracılık protokolü imzalayın.`,
              targetTab: "mandates",
              targetId: p.id,
              whatsappPhone: p.ownerPhone,
              whatsappDraft: p.ownerPhone
                ? `Merhaba ${p.ownerName || "Sayın Mülk Sahibimiz"}, ${p.title} gayrimenkulünüz için ofisimizin kurumsal tek yetkili pazarlama çalışmalarını başlatmak ve yetki belgesini imzalamak üzere görüşebilir miyiz?`
                : undefined,
              read: false,
              createdAt: "Yetki Belgesiz",
              urgency: "medium",
            });
          }
        }
      });
    }

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev]);
    }

    setAutomationRules((prev) =>
      prev.map((r) => ({ ...r, lastTriggeredAt: "Az önce çalıştırıldı" }))
    );

    return {
      matchesFound,
      rentAlerts,
      decayAlerts,
      mandateAlerts,
      contractAlerts,
      birthdayAlerts,
      agendaAlerts,
      overdueAlerts,
      dealCollectionAlerts,
      brokerApprovalAlerts,
      internalDealAlerts,
      staleAlerts,
      missingMandateAlerts,
    };
  };

  // Otomasyon Motoru Güncel Fonksiyon Referansı (Stale Closure Önleyici)
  const triggerRef = useRef(triggerAutomationEngine);
  useEffect(() => {
    triggerRef.current = triggerAutomationEngine;
  });

  // Periyodik Canlı Otomasyon ve Zaman Uyarı Robotu (Item 5)
  // 1. Sayfa yüklendiğinde otomatik ilk tarama
  // 2. Her 60 saniyede bir periyodik canlı re-sync
  // 3. Sekme odaklandığında / sekme görünür olduğunda otomatik tetikleme
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      if (triggerRef.current) triggerRef.current();
    }, 1200);

    const intervalTimer = setInterval(() => {
      if (triggerRef.current) triggerRef.current();
    }, 60000);

    const handleRecheck = () => {
      if (document.visibilityState === "visible" && triggerRef.current) {
        triggerRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleRecheck);
    window.addEventListener("focus", handleRecheck);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      document.removeEventListener("visibilitychange", handleRecheck);
      window.removeEventListener("focus", handleRecheck);
    };
  }, []);


  // Load from localStorage if present in browser
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("trustline_active_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const match = users.find((u) => u.id === parsed.id) || parsed;
        if (match) setCurrentUser(match);
      }
    } catch {}
  }, [users]);

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("trustline_active_user", JSON.stringify(user));
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    } catch {}
  };

  const login = async (usernameOrEmail: string, passwordAttempt: string) => {
    const clean = usernameOrEmail.trim().toLowerCase();

    // 1. Güncel kullanıcıyı bul
    let found = users.find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    // Buluttan taze kontrol yap (başka cihazda şifre değiştiyse anında yakala)
    try {
      const cloudUsers = await getUsersFromSupabase();
      if (cloudUsers && cloudUsers.length > 0) {
        const freshMatch = cloudUsers.find(
          (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
        );
        if (freshMatch) {
          const hasLocalPassword = Boolean(found?.passwordHash && found?.passwordSalt);
          const hasCloudPassword = Boolean(freshMatch.passwordHash && freshMatch.passwordSalt);
          const mergedUser: User = {
            ...(found || {}),
            ...freshMatch,
            passwordHash: freshMatch.passwordHash || found?.passwordHash,
            passwordSalt: freshMatch.passwordSalt || found?.passwordSalt,
            mustChangePassword: hasCloudPassword
              ? freshMatch.mustChangePassword
              : hasLocalPassword
              ? false
              : (freshMatch.mustChangePassword ?? found?.mustChangePassword ?? true),
          } as User;
          found = mergedUser;
          setUsers((prev) => prev.map((u) => (u.id === freshMatch.id ? mergedUser : u)));
        }
      }
    } catch {}

    if (!found) {
      return { success: false, message: "Kullanıcı adı veya e-posta adresi bulunamadı!" };
    }

    // ŞART 4: İlk Giriş Aktivasyon Zorunluluğu
    // Eğer şifre hash'i henüz yoksa veya mustChangePassword true ise doğrudan aktivasyona yönlendir
    if (found.mustChangePassword || !found.passwordHash || !found.passwordSalt) {
      return {
        success: false,
        mustActivate: true,
        user: found,
        message: "Hesap aktivasyonu gereklidir. Lütfen yeni güçlü şifrenizi belirleyin.",
      };
    }

    // ŞART 1 & 3: Kaynak kodda fallback ("123") YOK! Kriptografik Salted Hash Doğrulaması (PBKDF2)
    const isValid = await verifyPassword(
      passwordAttempt,
      found.passwordSalt,
      found.passwordHash
    );

    if (!isValid) {
      return { success: false, message: "Girdiğiniz şifre hatalı! Lütfen tekrar kontrol edin." };
    }

    handleSetCurrentUser(found);
    setIsAuthenticated(true);
    try {
      localStorage.setItem("trustline_crm_auth_v3", "true");
    } catch {}
    return { success: true };
  };

  const activateUserPassword = async (userId: string, newPassword: string) => {
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return { success: false, message: strength.message || "Geçersiz şifre!" };
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, message: "Kullanıcı bulunamadı!" };
    }

    // Kriptografik Rastgele Salt ve PBKDF2 Hash Üretimi (Bulut & Çoklu Cihaz)
    const salt = generateSalt(16);
    const hash = await hashPasswordWithSalt(newPassword, salt);

    const updatedUser: User = {
      ...targetUser,
      passwordHash: hash,
      passwordSalt: salt,
      mustChangePassword: false,
    };

    // 1. Bulut Senkronizasyonu (Supabase - Laptop/Mobil/Tablet anında geçerli)
    try {
      await saveUserCredentialsToSupabase(userId, hash, salt);
    } catch (err) {
      console.warn("Supabase credentials save error:", err);
    }

    // 2. Lokal State & Storage Güncelleme
    const updatedUsers = users.map((u) => (u.id === userId ? updatedUser : u));
    setUsers(updatedUsers);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch {}

    // Kullanıcı oturumunu hemen aç
    handleSetCurrentUser(updatedUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem("trustline_crm_auth_v3", "true");
    } catch {}

    return {
      success: true,
      message: "Şifreniz başarıyla kaydedildi ve hesabınız aktive edildi! Hoş geldiniz.",
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem("trustline_crm_auth_v3");
    } catch {}
  };

  const updateUserPassword = async (userId: string, currentPassword: string, newPassword: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: "Kullanıcı bulunamadı!" };
    }

    // Mevcut şifreyi kriptografik olarak kontrol et
    if (user.passwordSalt && user.passwordHash) {
      const isCurrentValid = await verifyPassword(
        currentPassword,
        user.passwordSalt,
        user.passwordHash
      );
      if (!isCurrentValid) {
        return { success: false, message: "Mevcut şifreniz hatalı! Eski şifrenizi doğru girdiğinizden emin olun." };
      }
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return { success: false, message: strength.message || "Yeni şifre en az 6 karakterden oluşmalıdır." };
    }

    // Yeni Rastgele Salt ve Yeni Hash
    const newSalt = generateSalt(16);
    const newHash = await hashPasswordWithSalt(newPassword, newSalt);

    const updatedUser: User = {
      ...user,
      passwordHash: newHash,
      passwordSalt: newSalt,
      mustChangePassword: false,
    };

    // Bulut Senkronizasyonu (Supabase)
    try {
      await saveUserCredentialsToSupabase(userId, newHash, newSalt);
    } catch (err) {
      console.warn("Supabase credentials save error:", err);
    }

    // Lokal State Güncelleme
    const updatedUsers = users.map((u) => (u.id === userId ? updatedUser : u));
    setUsers(updatedUsers);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch {}

    if (currentUser.id === userId) {
      handleSetCurrentUser(updatedUser);
    }

    return {
      success: true,
      message: "Şifreniz başarıyla güncellendi! Eski şifreniz kalıcı olarak devre dışı bırakıldı. Artık yeni şifreniz geçerlidir.",
    };
  };

  const updateUserProfile = (userId: string, updates: Partial<User>) => {
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, ...updates } : u
    );
    setUsers(updatedUsers);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch {}

    if (currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      handleSetCurrentUser(updatedUser);
    }
  };

  const isBroker = currentUser.role === "ADMIN";

  // Kişisel ve Paylaşılan Havuzlar (Danışman İzolasyonu & Ortak Paylaşım)
  const myCustomers = isBroker
    ? customers.filter((c) => !c.deletedAt)
    : customers.filter((c) => !c.deletedAt && c.assignedToId === currentUser.id);

  const sharedCustomers = isBroker
    ? customers.filter((c) => !c.deletedAt && c.isShared)
    : customers.filter(
        (c) => !c.deletedAt && c.assignedToId !== currentUser.id && c.isShared
      );

  const myProperties = isBroker
    ? properties.filter((p) => !p.deletedAt)
    : properties.filter((p) => !p.deletedAt && p.assignedToId === currentUser.id);

  const sharedProperties = isBroker
    ? properties.filter((p) => !p.deletedAt && p.isShared)
    : properties.filter(
        (p) => !p.deletedAt && p.assignedToId !== currentUser.id && p.isShared
      );

  // Genel listeleme havuzu (Kişisel + Paylaşılan)
  const visibleCustomers = isBroker
    ? customers.filter((c) => !c.deletedAt)
    : customers.filter(
        (c) => !c.deletedAt && (c.assignedToId === currentUser.id || c.isShared)
      );

  const visibleProperties = isBroker
    ? properties.filter((p) => !p.deletedAt)
    : properties.filter(
        (p) => !p.deletedAt && (p.assignedToId === currentUser.id || p.isShared)
      );

  // Danışmanın kendi ajanda/takibi (Kimse birbirininkini göremez, ancak OFİS ETKİNLİKLERİ tüm ekibin ajandasında görünür)
  const visibleFollowUps = isBroker
    ? followUps
    : followUps.filter((f) => f.assignedToId === currentUser.id || f.isOfficeEvent);

  // Danışmanın kendi satış süreci/kanbanı (Kimse birbirininkini göremez, ancak iç paylaşımlı ortak işlemler her iki danışmanda da görünür)
  const visibleDeals = isBroker
    ? deals
    : deals.filter(
        (d) => d.createdById === currentUser.id || d.partnerAdvisorId === currentUser.id
      );

  // Customer handlers
  const addCustomer = (customerData: Omit<Customer, "id" | "createdAt" | "updatedAt">): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cst-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    saveCustomer(newCustomer).catch(() => {});
    return newCustomer;
  };


  // Permission helpers
  const canManageCustomer = (c: Customer) => isBroker || c.assignedToId === currentUser.id;
  const canManageProperty = (p: Property) => isBroker || p.assignedToId === currentUser.id;
  const canManageFollowUp = (f: FollowUp) => isBroker || f.assignedToId === currentUser.id || f.createdById === currentUser.id;
  const canManageDeal = (d: Deal) => isBroker || d.createdById === currentUser.id || d.partnerAdvisorId === currentUser.id;
  const canManageRental = (r: RentalContract) => isBroker || r.assignedToId === currentUser.id;

  const updateCustomer = (id: string, updates: Partial<Customer>): boolean => {
    const cust = customers.find((c) => c.id === id);
    if (!cust) return false;
    if (!canManageCustomer(cust)) {
      alert("Bu müşteri başka bir danışmana aittir. Yalnızca sahibi veya ofis düzenleyebilir.");
      return false;
    }
    const updatedCustomer: Customer = {
      ...cust,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? updatedCustomer : c))
    );
    saveCustomer(updatedCustomer).catch(() => {});
    return true;
  };

  const deleteCustomer = (id: string): boolean => {
    const cust = customers.find((c) => c.id === id);
    if (!cust) return false;
    if (!canManageCustomer(cust)) {
      alert("Bu müşteri başka bir danışmana aittir. Yalnızca sahibi veya ofis silebilir.");
      return false;
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    deleteCustomerFromDb(id).catch(() => {});
    return true;
  };

  const toggleCustomerShare = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    if (!cust) return;
    const updatedCustomer: Customer = {
      ...cust,
      isShared: !cust.isShared,
      updatedAt: new Date().toISOString(),
    };
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? updatedCustomer : c))
    );
    saveCustomer(updatedCustomer).catch(() => {});
  };

  // Property handlers
  const addProperty = (propData: Omit<Property, "id" | "createdAt" | "updatedAt">): Property => {
    // Mülk sahibi customer havuzunda ise otomatik satıcı kategorisine senkronize et
    if (propData.ownerCustomerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === propData.ownerCustomerId) {
            const upd = { ...c, category: "SELLER" as const, updatedAt: new Date().toISOString() };
            saveCustomer(upd).catch(() => {});
            return upd;
          }
          return c;
        })
      );
    }

    const newProperty: Property = {
      ...propData,
      id: `prp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProperties((prev) => [newProperty, ...prev]);
    saveProperty(newProperty).catch(() => {});


    // Otomatik Eşleşme Bildirimi Robotu
    const matchRule = automationRules.find((r) => r.id === "rule-auto-match");
    if ((matchRule?.enabled ?? true) && newProperty.status === "AVAILABLE") {
      const matched = customers.filter((c) => {
        if (c.category !== "BUYER") return false;
        const budgetFits = c.budget ? newProperty.price <= c.budget * 1.25 : true;
        const regionFits = newProperty.region.toLowerCase().includes(c.region.split("/")[0].trim().toLowerCase());
        return budgetFits && regionFits;
      });

      if (matched.length > 0) {
        const buyerNames = matched.slice(0, 2).map((b) => b.fullName).join(" ve ");
        setNotifications((prev) => [
          {
            id: `notif-match-${newProperty.id}-${Date.now()}`,
            type: "match",
            title: `⚡ Yeni Eşleşme: ${newProperty.title}`,
            message: `Yeni eklenen portföy, alıcı müşterileriniz ${buyerNames}${
              matched.length > 2 ? ` ve ${matched.length - 2} diğer alıcı` : ""
            } ile yüksek oranda eşleşiyor.`,
            targetTab: "matchmaker",
            targetId: newProperty.id,
            read: false,
            createdAt: "Az önce",
            urgency: "medium",
          },
          ...prev,
        ]);
      }
    }

    return newProperty;
  };


  const updateProperty = (id: string, updates: Partial<Property>): boolean => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return false;
    if (!canManageProperty(prop)) {
      alert("Bu portföy başka bir danışmana aittir. Yalnızca sahibi veya ofis düzenleyebilir.");
      return false;
    }
    const updatedProperty: Property = {
      ...prop,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? updatedProperty : p))
    );
    saveProperty(updatedProperty).catch(() => {});
    return true;
  };

  const deleteProperty = (id: string): boolean => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return false;
    if (!canManageProperty(prop)) {
      alert("Bu portföy başka bir danışmana aittir. Yalnızca sahibi veya ofis silebilir.");
      return false;
    }
    setProperties((prev) => prev.filter((p) => p.id !== id));
    deletePropertyFromDb(id).catch(() => {});
    return true;
  };

  const togglePropertyShare = (id: string) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;
    const updatedProperty: Property = {
      ...prop,
      isShared: !prop.isShared,
      updatedAt: new Date().toISOString(),
    };
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? updatedProperty : p))
    );
    saveProperty(updatedProperty).catch(() => {});
  };

  // FollowUp handlers
  const addFollowUp = (data: Omit<FollowUp, "id" | "createdAt">) => {
    const newFollowUp: FollowUp = {
      ...data,
      id: `flw-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setFollowUps((prev) => [newFollowUp, ...prev]);
    saveFollowUp(newFollowUp).catch(() => {});

    // Eğer Ofis Etkinliği ise tüm ekibe sistem bildirimi oluştur
    if (newFollowUp.isOfficeEvent) {
      const newNotif: WorkflowNotification = {
        id: `notif-office-${Date.now()}`,
        type: "office_event",
        title: `🏢 Yeni Ofis Etkinliği: ${newFollowUp.title}`,
        message: `${newFollowUp.createdByName || "Ofis Yönetimi"} tarafından tüm ekibin ajandasına ortak etkinlik/toplantı eklendi.`,
        targetTab: "calendar",
        targetId: newFollowUp.id,
        read: false,
        createdAt: new Date().toISOString(),
        urgency: "high",
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  const updateFollowUp = (id: string, updates: Partial<FollowUp>) => {
    const existing = followUps.find((f) => f.id === id);
    if (existing) {
      const updated = { ...existing, ...updates };
      saveFollowUp(updated).catch(() => {});
    }
    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  // PRD 4.6: "Yarına Ertele" butonu (saat/tarih atomik güncellenir)
  const postponeFollowUp = (id: string) => {
    setFollowUps((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const currentDue = new Date(f.dueAt);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(currentDue.getHours() || 10, currentDue.getMinutes() || 0, 0, 0);
        const updated: FollowUp = {
          ...f,
          dueAt: tomorrow.toISOString(),
          status: "open",
        };
        saveFollowUp(updated).catch(() => {});
        return updated;
      })
    );
  };

  const completeFollowUp = (id: string, outcome: string, feedback?: string) => {
    setFollowUps((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const updated: FollowUp = {
          ...f,
          status: "done",
          outcome: outcome as any,
          feedback: feedback || f.feedback,
        };
        saveFollowUp(updated).catch(() => {});
        return updated;
      })
    );
  };

  const deleteFollowUp = (id: string): boolean => {
    const flw = followUps.find((f) => f.id === id);
    if (!flw) return false;
    if (!canManageFollowUp(flw)) {
      alert("Bu takip görevi size ait değildir. Yalnızca sahibi veya ofis silebilir.");
      return false;
    }
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
    deleteFollowUpFromDb(id).catch(() => {});
    return true;
  };

  // Deals
  const updateDealStage = (
    id: string,
    newStage: "offer" | "won" | "lost",
    closingNotes?: string
  ) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated: Deal = {
          ...d,
          stage: newStage,
          closingNotes: closingNotes || d.closingNotes,
          closingDate:
            newStage === "won" || newStage === "lost"
              ? new Date().toISOString().split("T")[0]
              : d.closingDate,
        };
        saveDeal(updated).catch(() => {});
        return updated;
      })
    );
  };

  const addDeal = (dealData: Omit<Deal, "id" | "createdAt"> & { createdAt?: string }) => {
    const dealDateIso = dealData.closingDate
      ? `${dealData.closingDate}T12:00:00.000Z`
      : new Date().toISOString();
    const newDeal: Deal = {
      ...dealData,
      id: `deal-${Date.now()}`,
      createdAt: dealData.createdAt || dealDateIso,
    };
    setDeals((prev) => [newDeal, ...prev]);
    saveDeal(newDeal).catch(() => {});

    // Eğer iç paylaşımlı bir işlemse ve 2. Danışman seçildiyse anlık bildirim oluştur
    if (newDeal.sharingType === "internal" && newDeal.partnerAdvisorId) {
      const isApproved = Boolean(newDeal.brokerApproval);
      const notif: WorkflowNotification = {
        id: `notif-internal-shared-${newDeal.id}`,
        type: isApproved ? "deal_approved" : "deal_shared",
        title: isApproved
          ? `🤝 Yeni Ortak İşlem (Onaylandı): ${newDeal.title}`
          : `🤝 Yeni Ortak İşlem Eklendi: ${newDeal.title}`,
        message: `${newDeal.createdByName || "Danışman"} sizi "${newDeal.title}" işleminde 2. Danışman (Müşteri Bacağı) olarak belirledi.${
          isApproved
            ? ` İşlem Broker tarafından onaylanmıştır. Hak edişiniz: ${newDeal.partnerShareAmount?.toLocaleString("tr-TR")} ${newDeal.currency}.`
            : ` Broker onayı sonrası hak edişiniz: ${newDeal.partnerShareAmount?.toLocaleString("tr-TR")} ${newDeal.currency} olarak hesabınıza yansıyacaktır.`
        }`,
        targetTab: "finance",
        targetId: newDeal.id,
        read: false,
        createdAt: "Az önce",
        urgency: "high",
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  const updateDeal = (id: string, updates: Partial<Deal>): boolean => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return false;
    if (!canManageDeal(deal)) {
      alert("Bu satış/komisyon anlaşması size ait değildir. Yalnızca sahibi veya ofis düzenleyebilir.");
      return false;
    }

    // Broker onayı verildiğinde (önceden onaysızken şimdi onaylandıysa)
    if (updates.brokerApproval === true && !deal.brokerApproval) {
      const mergedDeal = { ...deal, ...updates };
      const newNotifs: WorkflowNotification[] = [];

      // 1. İkinci Danışmana (İç Paylaşım Müşteri Bacağı) otomatik onay & hak ediş bildirimi
      if (mergedDeal.sharingType === "internal" && mergedDeal.partnerAdvisorId) {
        newNotifs.push({
          id: `notif-internal-approved-${mergedDeal.id}-${Date.now()}`,
          type: "deal_approved",
          title: `🤝 Ortak İşlem Onaylandı: ${mergedDeal.title}`,
          message: `${mergedDeal.createdByName || "Danışman"} ile yürüttüğünüz iç paylaşımlı işlem Broker (${currentUser.name}) tarafından incelenip onaylandı. Hesabınıza yansıyan hak edişiniz: ${mergedDeal.partnerShareAmount?.toLocaleString("tr-TR")} ${mergedDeal.currency} (%${mergedDeal.partnerShareRate || 25}).`,
          targetTab: "finance",
          targetId: mergedDeal.id,
          read: false,
          createdAt: "Az önce",
          urgency: "high",
        });
      }

      // 2. Birinci Danışmana (Portföy Sahibi) onay bildirimi
      if (mergedDeal.createdById && mergedDeal.createdById !== currentUser.id) {
        newNotifs.push({
          id: `notif-deal-approved-${mergedDeal.id}-${Date.now()}`,
          type: "deal_approved",
          title: `✅ İşlem Onaylandı: ${mergedDeal.title}`,
          message: `Kapatmış olduğunuz "${mergedDeal.title}" satışı Broker (${currentUser.name}) tarafından onaylandı. Hak edişiniz: ${mergedDeal.advisorShareAmount?.toLocaleString("tr-TR")} ${mergedDeal.currency}.`,
          targetTab: "finance",
          targetId: mergedDeal.id,
          read: false,
          createdAt: "Az önce",
          urgency: "high",
        });
      }

      if (newNotifs.length > 0) {
        setNotifications((prev) => [...newNotifs, ...prev]);
      }
    }

    const updatedDeal: Deal = { ...deal, ...updates };
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? updatedDeal : d))
    );
    saveDeal(updatedDeal).catch(() => {});
    return true;
  };

  const deleteDeal = (id: string): boolean => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return false;
    if (!canManageDeal(deal)) {
      alert("Bu satış/komisyon anlaşması size ait değildir. Yalnızca sahibi veya ofis silebilir.");
      return false;
    }
    setDeals((prev) => prev.filter((d) => d.id !== id));
    deleteDealFromDb(id).catch(() => {});
    return true;
  };

  /**
   * Sözleşme başlangıç ve bitiş tarihlerine tam sadık kalarak
   * ilgili aylar için ödeme taksitleri üretir (3 ay ise 3, 6 ay ise 6 taksit).
   */
  const generateRentalPayments = (
    contractStart: string,
    contractEnd: string,
    dueDay: number,
    monthlyRent: number,
    currency: Currency,
    existingPayments?: RentalMonthPayment[]
  ): RentalMonthPayment[] => {
    const startDate = new Date(contractStart || "2026-01-01");
    const endDate = new Date(contractEnd || "2026-12-31");
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const payments: RentalMonthPayment[] = [];

    let currentYear = startDate.getFullYear();
    let currentMonth = startDate.getMonth() + 1; // 1-12

    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth() + 1; // 1-12

    while (
      currentYear < endYear ||
      (currentYear === endYear && currentMonth <= endMonth)
    ) {
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const adjDay = Math.min(Math.max(dueDay, 1), daysInMonth);
      const mStr = String(currentMonth).padStart(2, "0");
      const dStr = String(adjDay).padStart(2, "0");
      const dueDate = `${currentYear}-${mStr}-${dStr}`;
      const periodKey = `${currentYear}-${mStr}`;

      const existing = existingPayments?.find(
        (p) =>
          p.periodKey === periodKey ||
          p.dueDate === dueDate ||
          (p.dueDate && p.dueDate.startsWith(periodKey)) ||
          (existingPayments && existingPayments.length <= 12 && p.month === currentMonth && !p.year && String(currentYear) === "2026")
      );

      if (existing) {
        payments.push({
          ...existing,
          month: currentMonth,
          year: currentYear,
          periodKey,
          amount: existing.amount || monthlyRent,
          currency: existing.currency || currency,
          dueDate,
        });
      } else {
        const isOverdue = dueDate < todayStr;
        payments.push({
          month: currentMonth,
          year: currentYear,
          periodKey,
          amount: monthlyRent,
          currency,
          dueDate,
          status: isOverdue ? "overdue" : "unpaid",
          paidAmount: 0,
        });
      }

      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }

      if (payments.length > 120) break;
    }

    return payments;
  };

  // Rentals & Dinamik Taksit Motoru
  const addRentalContract = (
    contractData: Omit<RentalContract, "id" | "createdAt" | "payments"> & { payments?: RentalMonthPayment[] }
  ): RentalContract => {
    const id = `rnt-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const assignedUser = users.find((u) => u.id === (contractData.assignedToId || currentUser.id)) || currentUser;
    const finalAssignedToId = isBroker ? (contractData.assignedToId || currentUser.id) : currentUser.id;
    const finalAssignedToName = isBroker ? (assignedUser.name || currentUser.name) : currentUser.name;

    const payments: RentalMonthPayment[] =
      contractData.payments && contractData.payments.length > 0
        ? contractData.payments
        : generateRentalPayments(
            contractData.contractStart || "2026-01-01",
            contractData.contractEnd || "2026-12-31",
            contractData.dueDay || 5,
            contractData.monthlyRent,
            contractData.currency
          );

    const newContract: RentalContract = {
      ...contractData,
      id,
      assignedToId: finalAssignedToId,
      assignedToName: finalAssignedToName,
      createdAt,
      payments,
    };

    setRentals((prev) => [newContract, ...prev]);
    saveRental(newContract).catch(() => {});
    return newContract;
  };

  const updateRentalContract = (id: string, updates: Partial<RentalContract>): boolean => {
    const rental = rentals.find((r) => r.id === id);
    if (!rental) return false;
    if (!canManageRental(rental)) {
      alert("Bu kira sözleşmesi size ait değildir. Yalnızca sahibi veya ofis düzenleyebilir.");
      return false;
    }

    const updatedContractStart = updates.contractStart ?? rental.contractStart;
    const updatedContractEnd = updates.contractEnd ?? rental.contractEnd;
    const updatedDueDay = updates.dueDay ?? rental.dueDay;
    const updatedMonthlyRent = updates.monthlyRent ?? rental.monthlyRent;
    const updatedCurrency = updates.currency ?? rental.currency;

    const shouldRegenerate =
      updates.contractStart !== undefined ||
      updates.contractEnd !== undefined ||
      updates.dueDay !== undefined ||
      updates.monthlyRent !== undefined ||
      updates.currency !== undefined;

    const newPayments =
      shouldRegenerate && !updates.payments
        ? generateRentalPayments(
            updatedContractStart,
            updatedContractEnd,
            updatedDueDay,
            updatedMonthlyRent,
            updatedCurrency,
            rental.payments
          )
        : (updates.payments ?? rental.payments);

    const updatedRental: RentalContract = {
      ...rental,
      ...updates,
      payments: newPayments,
    };

    setRentals((prev) =>
      prev.map((r) => (r.id === id ? updatedRental : r))
    );
    saveRental(updatedRental).catch(() => {});
    return true;
  };

  const deleteRentalContract = (id: string): boolean => {
    const rental = rentals.find((r) => r.id === id);
    if (!rental) return false;
    if (!canManageRental(rental)) {
      alert("Bu kira sözleşmesi size ait değildir. Yalnızca sahibi veya ofis silebilir.");
      return false;
    }
    setRentals((prev) => prev.filter((r) => r.id !== id));
    deleteRentalFromDb(id).catch(() => {});
    return true;
  };

  const toggleRentalPayment = (
    rentalId: string,
    monthOrPeriodKey: number | string,
    isPaid: boolean,
    dueDate?: string
  ) => {
    setRentals((prev) =>
      prev.map((r) => {
        if (r.id !== rentalId) return r;
        if (!isBroker && r.assignedToId !== currentUser.id) return r;
        const updatedRental: RentalContract = {
          ...r,
          payments: r.payments.map((p) => {
            const matches =
              typeof monthOrPeriodKey === "string"
                ? p.periodKey === monthOrPeriodKey || p.dueDate === monthOrPeriodKey || (p.dueDate && p.dueDate.startsWith(monthOrPeriodKey))
                : dueDate
                ? p.dueDate === dueDate || p.month === monthOrPeriodKey
                : p.month === monthOrPeriodKey;

            if (!matches) return p;
            if (isPaid) {
              return {
                ...p,
                status: "paid",
                paidAmount: p.amount,
                paidDate: new Date().toISOString().split("T")[0],
              };
            }
            return {
              ...p,
              status: "unpaid",
              paidAmount: 0,
              paidDate: undefined,
            };
          }),
        };
        saveRental(updatedRental).catch(() => {});
        return updatedRental;
      })
    );
  };

  const uploadRentalReceipt = (
    rentalId: string,
    monthOrPeriodKey: number | string,
    fileName: string,
    dueDate?: string
  ) => {
    setRentals((prev) =>
      prev.map((r) => {
        if (r.id !== rentalId) return r;
        if (!isBroker && r.assignedToId !== currentUser.id) return r;
        const updatedRental: RentalContract = {
          ...r,
          payments: r.payments.map((p) => {
            const matches =
              typeof monthOrPeriodKey === "string"
                ? p.periodKey === monthOrPeriodKey || p.dueDate === monthOrPeriodKey || (p.dueDate && p.dueDate.startsWith(monthOrPeriodKey))
                : dueDate
                ? p.dueDate === dueDate || p.month === monthOrPeriodKey
                : p.month === monthOrPeriodKey;
            if (!matches) return p;
            return {
              ...p,
              receiptName: fileName,
              receiptUrl: `https://fake-supabase-storage.co/receipts/${fileName}`,
            };
          }),
        };
        saveRental(updatedRental).catch(() => {});
        return updatedRental;
      })
    );
  };

  const renewRentalContract = (rentalId: string): boolean => {
    const rental = rentals.find((r) => r.id === rentalId);
    if (!rental) return false;
    if (!canManageRental(rental)) {
      alert("Bu kira sözleşmesini yenileme yetkiniz bulunmuyor.");
      return false;
    }

    const currentEnd = new Date(rental.contractEnd || new Date().toISOString().split("T")[0]);
    const newEnd = new Date(currentEnd);
    newEnd.setFullYear(newEnd.getFullYear() + 1);

    const newEndStr = newEnd.toISOString().split("T")[0];

    const extendedPayments = generateRentalPayments(
      rental.contractStart,
      newEndStr,
      rental.dueDay,
      rental.monthlyRent,
      rental.currency,
      rental.payments
    );

    const updated: RentalContract = {
      ...rental,
      contractEnd: newEndStr,
      active: true,
      payments: extendedPayments,
    };

    setRentals((prev) => prev.map((r) => (r.id === rentalId ? updated : r)));
    saveRental(updated).catch(() => {});
    return true;
  };

  const relistRentalProperty = (rentalId: string): boolean => {
    const rental = rentals.find((r) => r.id === rentalId);
    if (!rental) return false;
    if (!canManageRental(rental)) {
      alert("Bu işlem için yetkiniz bulunmuyor.");
      return false;
    }

    // Kira sözleşmesini pasife al (kira takibinden düşür)
    const updatedRental: RentalContract = {
      ...rental,
      active: false,
    };
    setRentals((prev) => prev.map((r) => (r.id === rentalId ? updatedRental : r)));
    saveRental(updatedRental).catch(() => {});

    // Bağlı portföyü bul ve durumunu AVAILABLE yap
    const prop = properties.find(
      (p) =>
        p.id === rental.propertyId ||
        p.title.toLowerCase().trim() === rental.propertyTitle.toLowerCase().trim()
    );
    if (prop) {
      const updatedProp: Property = {
        ...prop,
        status: "AVAILABLE",
        deletedAt: null,
      };
      setProperties((prev) => prev.map((p) => (p.id === prop.id ? updatedProp : p)));
      saveProperty(updatedProp).catch(() => {});
    }

    return true;
  };

  const loseRentalProperty = (rentalId: string): boolean => {
    const rental = rentals.find((r) => r.id === rentalId);
    if (!rental) return false;
    if (!canManageRental(rental)) {
      alert("Bu işlem için yetkiniz bulunmuyor.");
      return false;
    }

    // Kira sözleşmesini sistemden kaldır
    setRentals((prev) => prev.filter((r) => r.id !== rentalId));
    deleteRentalFromDb(rentalId).catch(() => {});

    // Bağlı portföyü sistemden tamamen kaldır
    const prop = properties.find(
      (p) =>
        p.id === rental.propertyId ||
        p.title.toLowerCase().trim() === rental.propertyTitle.toLowerCase().trim()
    );
    if (prop) {
      const updatedProp: Property = {
        ...prop,
        status: "ARCHIVED",
        deletedAt: new Date().toISOString(),
      };
      setProperties((prev) => prev.filter((p) => p.id !== prop.id));
      saveProperty(updatedProp).catch(() => {});
    }

    return true;
  };

  const reactivateProperty = (propertyId: string): boolean => {
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) return false;
    if (!canManageProperty(prop)) {
      alert("Bu portföyü aktifleştirme yetkiniz bulunmuyor.");
      return false;
    }

    const updatedProp: Property = {
      ...prop,
      status: "AVAILABLE",
      deletedAt: null,
    };

    setProperties((prev) => prev.map((p) => (p.id === propertyId ? updatedProp : p)));
    saveProperty(updatedProp).catch(() => {});
    return true;
  };

  const visibleRentals = isBroker
    ? rentals
    : rentals.filter((r) => r.assignedToId === currentUser.id);

  // Mandates
  const canManageMandate = (mandate: MandateContract) => {
    if (isBroker) return true;
    return mandate.assignedToId === currentUser.id;
  };

  const addMandateContract = (
    data: Omit<MandateContract, "id" | "createdAt">
  ): MandateContract => {
    const newMandate: MandateContract = {
      ...data,
      id: `mnd-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMandates((prev) => [newMandate, ...prev]);
    saveMandate(newMandate).catch(() => {});

    // İlişkili portföyü senkronize et
    if (newMandate.propertyId) {
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id === newMandate.propertyId) {
            const updatedP: Property = {
              ...p,
              mandateStart: newMandate.startDate,
              mandateEnd: newMandate.endDate,
              ownerCustomerId: newMandate.ownerCustomerId || p.ownerCustomerId,
              ownerName: newMandate.ownerName || p.ownerName,
              ownerPhone: newMandate.ownerPhone || p.ownerPhone,
            };
            saveProperty(updatedP).catch(() => {});
            return updatedP;
          }
          return p;
        })
      );
    }

    return newMandate;
  };

  const updateMandateContract = (id: string, updates: Partial<MandateContract>): boolean => {
    const mandate = mandates.find((m) => m.id === id);
    if (!mandate) return false;
    if (!canManageMandate(mandate)) {
      alert("Bu yetki sözleşmesi size ait değildir. Yalnızca sahibi veya ofis düzenleyebilir.");
      return false;
    }
    const updatedMandate: MandateContract = { ...mandate, ...updates };
    setMandates((prev) =>
      prev.map((m) => (m.id === id ? updatedMandate : m))
    );
    saveMandate(updatedMandate).catch(() => {});
    return true;
  };

  const deleteMandateContract = (id: string): boolean => {
    const mandate = mandates.find((m) => m.id === id);
    if (!mandate) return false;
    if (!canManageMandate(mandate)) {
      alert("Bu yetki sözleşmesi size ait değildir. Yalnızca sahibi veya ofis silebilir.");
      return false;
    }
    setMandates((prev) => prev.filter((m) => m.id !== id));
    deleteMandateFromDb(id).catch(() => {});
    return true;
  };

  const visibleMandates = isBroker
    ? mandates
    : mandates.filter((m) => m.assignedToId === currentUser.id);

  // Güvenlik Kasası (Snapshots) State
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>(() => getLocalSnapshots());

  // Günlük otomatik snapshot alıcı
  useEffect(() => {
    checkAndCreateDailySnapshot({
      customers,
      properties,
      deals,
      rentals,
      mandates,
      followUps,
    });
    setSnapshots(getLocalSnapshots());
  }, []);

  const createManualSnapshot = (name: string, description: string) => {
    saveSnapshot(name, description, "manual", {
      customers,
      properties,
      deals,
      rentals,
      mandates,
      followUps,
    });
    setSnapshots(getLocalSnapshots());
  };

  const removeSnapshot = (snapshotId: string) => {
    deleteSnapshot(snapshotId);
    setSnapshots(getLocalSnapshots());
  };

  const restoreBackup = async (
    data: NormalizedBackupData,
    mode: "merge" | "clean"
  ) => {
    // 1. Önce kurtarma noktası snapshot'ı al (Güvenlik Protokolü)
    saveSnapshot(
      `Geri Yükleme Öncesi Kurtarma Noktası (${new Date().toLocaleTimeString("tr-TR")})`,
      `${mode === "merge" ? "Eksikleri Tamamla" : "Tam Temiz Geri Yükleme"} işlemi öncesi otomatik sistem yedeği`,
      "auto_pre_restore",
      {
        customers,
        properties,
        deals,
        rentals,
        mandates,
        followUps,
      }
    );
    setSnapshots(getLocalSnapshots());

    let finalCustomers: Customer[];
    let finalProperties: Property[];
    let finalDeals: Deal[];
    let finalRentals: RentalContract[];
    let finalMandates: MandateContract[];
    let finalFollowUps: FollowUp[];

    if (mode === "merge") {
      finalCustomers = mergeEntityList(customers, data.customers).merged;
      finalProperties = mergeEntityList(properties, data.properties).merged;
      finalDeals = mergeEntityList(deals, data.deals).merged;
      finalRentals = mergeEntityList(rentals, data.rentals).merged;
      finalMandates = mergeEntityList(mandates, data.mandates).merged;
      finalFollowUps = mergeEntityList(followUps, data.followUps).merged;
    } else {
      // Clean restore
      finalCustomers = data.customers;
      finalProperties = data.properties;
      finalDeals = data.deals;
      finalRentals = data.rentals;
      finalMandates = data.mandates;
      finalFollowUps = data.followUps;
    }

    // State'leri güncelle
    setCustomers(finalCustomers);
    setProperties(finalProperties);
    setDeals(finalDeals);
    setRentals(finalRentals);
    setMandates(finalMandates);
    setFollowUps(finalFollowUps);

    // Supabase Buluta Sessizce Eşitle
    try {
      await seedAllDataToSupabase({
        customers: finalCustomers,
        properties: finalProperties,
        deals: finalDeals,
        rentals: finalRentals,
        mandates: finalMandates,
      });
    } catch (err) {
      console.warn("Supabase backup sync error:", err);
    }

    return {
      success: true,
      message:
        mode === "merge"
          ? "Eksik veriler mevcut kayıtlarla başarıyla harmanlandı ve geri yüklendi!"
          : "Sistem, seçilen yedeğin alındığı ana kusursuz olarak geri döndürüldü!",
      stats: {
        customers: finalCustomers.length,
        properties: finalProperties.length,
        deals: finalDeals.length,
        rentals: finalRentals.length,
        mandates: finalMandates.length,
        followUps: finalFollowUps.length,
      },
    };
  };

  const restoreSnapshot = async (snapshotId: string) => {
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return { success: false, message: "Snapshot bulunamadı!" };

    const res = await restoreBackup(snap.data, "clean");
    return { success: res.success, message: res.message };
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        users,
        customers: visibleCustomers,
        myCustomers,
        sharedCustomers,
        properties: visibleProperties,
        myProperties,
        sharedProperties,
        followUps: visibleFollowUps,
        deals: visibleDeals,
        myDeals: visibleDeals,
        rentals: visibleRentals,
        mandates: visibleMandates,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        toggleCustomerShare,
        addProperty,
        updateProperty,
        deleteProperty,
        togglePropertyShare,
        addFollowUp,
        updateFollowUp,
        deleteFollowUp,
        postponeFollowUp,
        completeFollowUp,
        updateDealStage,
        addDeal,
        updateDeal,
        deleteDeal,
        addRentalContract,
        updateRentalContract,
        deleteRentalContract,
        toggleRentalPayment,
        uploadRentalReceipt,
        renewRentalContract,
        relistRentalProperty,
        loseRentalProperty,
        reactivateProperty,
        canManageCustomer,
        canManageProperty,
        canManageFollowUp,
        canManageDeal,
        canManageRental,
        canManageMandate,
        addMandateContract,
        updateMandateContract,
        deleteMandateContract,
        isBroker,
        isAuthenticated,
        login,
        activateUserPassword,
        logout,
        updateUserPassword,
        updateUserProfile,
        notifications,
        automationRules,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        toggleAutomationRule,
        triggerAutomationEngine,
        restoreBackup,
        snapshots,
        createManualSnapshot,
        restoreSnapshot,
        removeSnapshot,
      }}
    >

      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
