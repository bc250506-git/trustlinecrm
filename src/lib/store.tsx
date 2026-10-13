"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  saveProperty,
  saveDeal,
  saveRental,
  saveMandate,
  setupRealtimeSync,
} from "./supabase/db";




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
  addDeal: (deal: Omit<Deal, "id" | "createdAt">) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => boolean;
  deleteDeal: (id: string) => boolean;
  addRentalContract: (contract: Omit<RentalContract, "id" | "createdAt" | "payments"> & { payments?: RentalMonthPayment[] }) => RentalContract;
  updateRentalContract: (id: string, updates: Partial<RentalContract>) => boolean;
  deleteRentalContract: (id: string) => boolean;
  toggleRentalPayment: (rentalId: string, month: number, isPaid: boolean) => void;
  uploadRentalReceipt: (rentalId: string, month: number, fileName: string) => void;
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
  // Auth & Settings
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, passwordAttempt: string) => { success: boolean; message?: string };
  logout: () => void;
  updateUserPassword: (userId: string, currentPassword: string, newPassword: string) => { success: boolean; message: string };
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
}


const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Kullanıcılar (Kalıcı şifre güncellemeleri için)
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trustline_crm_users_v3");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return initialUsers;
  });

  // Oturum durumu (Giriş yapıldı mı?)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedAuth = localStorage.getItem("trustline_crm_auth_v3");
      if (savedAuth === "true") return true;
    }
    return false; // Login ekranını göstererek başla
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("trustline_crm_current_user_v3");
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {}
      }
    }
    return initialUsers[0]; // Volkan Affan Kanıgür
  });
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialFollowUps);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [rentals, setRentals] = useState<RentalContract[]>(initialRentals);
  const [mandates, setMandates] = useState<MandateContract[]>(initialMandates);
  const [notifications, setNotifications] = useState<WorkflowNotification[]>(initialNotifications);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(initialAutomationRules);

  // Supabase Realtime Canlı Senkronizasyon (Faz 5)
  useEffect(() => {
    const cleanup = setupRealtimeSync(({ table, eventType, newRecord }) => {
      if (eventType === "INSERT" || eventType === "UPDATE") {
        if (table === "customers" && newRecord) {
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
        } else if (table === "mandates" && newRecord) {
          setMandates((prev) => {
            const exists = prev.some((m) => m.id === newRecord.id);
            return exists
              ? prev.map((m) => (m.id === newRecord.id ? { ...m, ...newRecord } : m))
              : [newRecord, ...prev];
          });
        }
      }
    });

    return cleanup;
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
    let matchesFound = 0;
    let rentAlerts = 0;
    let decayAlerts = 0;
    let mandateAlerts = 0;
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
                (n) => n.targetId === r.id && n.type === "rent_due"
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

    // 3. Portföy Yetki Sözleşmesi Yenileme Alarmı (Yetki Takip Masası)
    if (isRuleEnabled("rule-mandate-renewal")) {
      mandates.forEach((m) => {
        if (m.endDate && m.status !== "cancelled") {
          const endDate = new Date(m.endDate);
          const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 15) {
            const alreadyNotified = notifications.some(
              (n) => n.targetId === m.id && n.type === "mandate_expiring"
            );
            if (!alreadyNotified) {
              mandateAlerts++;
              newNotifications.push({
                id: `notif-mandate-${m.id}-${Date.now()}`,
                type: "mandate_expiring",
                title: `📄 Yetki Sözleşmesi Uyarısı: ${m.propertyTitle}`,
                message: `Mal sahibi ${m.ownerName} ile yapılan yetki sözleşmesi ${
                  diffDays <= 0 ? "süresi doldu!" : `${diffDays} gün içinde dolacaktır.`
                }`,
                targetTab: "mandates",
                targetId: m.id,
                whatsappPhone: m.ownerPhone,
                whatsappDraft: `Merhaba ${m.ownerName}, ${m.propertyTitle} mülkünüzün satış yetki sözleşmesi ${diffDays <= 0 ? "süresi dolmuştur" : `${diffDays} gün sonra tamamlanacaktır`}. Satış çalışmalarına hız kesmeden devam etmek ve yetki süresini uzatmak üzere görüşebilir miyiz?`,
                read: false,
                createdAt: "Az önce",
                urgency: diffDays <= 5 ? "high" : "medium",
              });
            }
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

    return { matchesFound, rentAlerts, decayAlerts, mandateAlerts };
  };


  // Load from localStorage if present in browser
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("trustline_active_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const match = initialUsers.find((u) => u.id === parsed.id);
        if (match) setCurrentUser(match);
      }
    } catch {}
  }, []);

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("trustline_active_user", JSON.stringify(user));
      localStorage.setItem("trustline_crm_current_user_v3", JSON.stringify(user));
    } catch {}
  };

  const login = (usernameOrEmail: string, passwordAttempt: string) => {
    const clean = usernameOrEmail.trim().toLowerCase();
    const found = users.find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    if (!found) {
      return { success: false, message: "Kullanıcı adı veya e-posta adresi bulunamadı!" };
    }

    const currentPass = found.password || "123";
    if (currentPass !== passwordAttempt) {
      return { success: false, message: "Girdiğiniz şifre hatalı! Lütfen tekrar deneyin." };
    }

    handleSetCurrentUser(found);
    setIsAuthenticated(true);
    try {
      localStorage.setItem("trustline_crm_auth_v3", "true");
    } catch {}
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem("trustline_crm_auth_v3");
    } catch {}
  };

  const updateUserPassword = (userId: string, currentPassword: string, newPassword: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: "Kullanıcı bulunamadı!" };
    }

    const activePass = user.password || "123";
    if (activePass !== currentPassword) {
      return { success: false, message: "Mevcut şifreniz hatalı! Eski şifrenizi doğru girdiğinizden emin olun." };
    }

    if (!newPassword || newPassword.trim().length < 3) {
      return { success: false, message: "Yeni şifre en az 3 karakterden oluşmalıdır." };
    }

    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, password: newPassword } : u
    );
    setUsers(updatedUsers);
    try {
      localStorage.setItem("trustline_crm_users_v3", JSON.stringify(updatedUsers));
    } catch {}

    if (currentUser.id === userId) {
      const updatedUser = { ...currentUser, password: newPassword };
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
      localStorage.setItem("trustline_crm_users_v3", JSON.stringify(updatedUsers));
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

  // Danışmanın kendi satış süreci/kanbanı (Kimse birbirininkini göremez)
  const visibleDeals = isBroker
    ? deals
    : deals.filter((d) => d.createdById === currentUser.id);

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
  const canManageDeal = (d: Deal) => isBroker || d.createdById === currentUser.id;
  const canManageRental = (r: RentalContract) => isBroker || r.assignedToId === currentUser.id;

  const updateCustomer = (id: string, updates: Partial<Customer>): boolean => {
    const cust = customers.find((c) => c.id === id);
    if (!cust) return false;
    if (!canManageCustomer(cust)) {
      alert("Bu müşteri başka bir danışmana aittir. Yalnızca sahibi veya ofis düzenleyebilir.");
      return false;
    }
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
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
    return true;
  };

  const toggleCustomerShare = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isShared: !c.isShared, updatedAt: new Date().toISOString() } : c
      )
    );
  };

  // Property handlers
  const addProperty = (propData: Omit<Property, "id" | "createdAt" | "updatedAt">): Property => {
    // Mülk sahibi customer havuzunda ise otomatik satıcı kategorisine senkronize et
    if (propData.ownerCustomerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === propData.ownerCustomerId
            ? { ...c, category: "SELLER", updatedAt: new Date().toISOString() }
            : c
        )
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
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
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
    return true;
  };

  const togglePropertyShare = (id: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isShared: !p.isShared, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  // FollowUp handlers
  const addFollowUp = (data: Omit<FollowUp, "id" | "createdAt">) => {
    const newFollowUp: FollowUp = {
      ...data,
      id: `flw-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setFollowUps((prev) => [newFollowUp, ...prev]);

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
        return {
          ...f,
          dueAt: tomorrow.toISOString(),
          status: "open",
        };
      })
    );
  };

  const completeFollowUp = (id: string, outcome: string, feedback?: string) => {
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              status: "done",
              outcome: outcome as any,
              feedback: feedback || f.feedback,
            }
          : f
      )
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
    return true;
  };

  // Deals
  const updateDealStage = (
    id: string,
    newStage: "offer" | "won" | "lost",
    closingNotes?: string
  ) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              stage: newStage,
              closingNotes: closingNotes || d.closingNotes,
              closingDate:
                newStage === "won" || newStage === "lost"
                  ? new Date().toISOString().split("T")[0]
                  : d.closingDate,
            }
          : d
      )
    );
  };

  const addDeal = (dealData: Omit<Deal, "id" | "createdAt">) => {
    const newDeal: Deal = {
      ...dealData,
      id: `deal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDeals((prev) => [newDeal, ...prev]);
  };

  const updateDeal = (id: string, updates: Partial<Deal>): boolean => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return false;
    if (!canManageDeal(deal)) {
      alert("Bu satış/komisyon anlaşması size ait değildir. Yalnızca sahibi veya ofis düzenleyebilir.");
      return false;
    }
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
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
    return true;
  };

  // Rentals
  const addRentalContract = (
    contractData: Omit<RentalContract, "id" | "createdAt" | "payments"> & { payments?: RentalMonthPayment[] }
  ): RentalContract => {
    const id = `rnt-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const assignedUser = users.find((u) => u.id === (contractData.assignedToId || currentUser.id)) || currentUser;
    const finalAssignedToId = isBroker ? (contractData.assignedToId || currentUser.id) : currentUser.id;
    const finalAssignedToName = isBroker ? (assignedUser.name || currentUser.name) : currentUser.name;

    const payments: RentalMonthPayment[] = contractData.payments || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
      const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      const maxDay = daysInMonths[m - 1];
      const adjDay = Math.min(contractData.dueDay || 5, maxDay);
      const mStr = m < 10 ? `0${m}` : `${m}`;
      const dStr = adjDay < 10 ? `0${adjDay}` : `${adjDay}`;
      return {
        month: m,
        amount: contractData.monthlyRent,
        currency: contractData.currency,
        dueDate: `2026-${mStr}-${dStr}`,
        status: "unpaid" as const,
        paidAmount: 0,
      };
    });

    const newContract: RentalContract = {
      ...contractData,
      id,
      assignedToId: finalAssignedToId,
      assignedToName: finalAssignedToName,
      createdAt,
      payments,
    };

    setRentals((prev) => [newContract, ...prev]);
    return newContract;
  };

  const updateRentalContract = (id: string, updates: Partial<RentalContract>): boolean => {
    const rental = rentals.find((r) => r.id === id);
    if (!rental) return false;
    if (!canManageRental(rental)) {
      alert("Bu kira sözleşmesi size ait değildir. Yalnızca sahibi veya ofis düzenleyebilir.");
      return false;
    }
    setRentals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
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
    return true;
  };

  const toggleRentalPayment = (
    rentalId: string,
    month: number,
    isPaid: boolean
  ) => {
    setRentals((prev) =>
      prev.map((r) => {
        if (r.id !== rentalId) return r;
        if (!isBroker && r.assignedToId !== currentUser.id) return r;
        return {
          ...r,
          payments: r.payments.map((p) => {
            if (p.month !== month) return p;
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
      })
    );
  };

  const uploadRentalReceipt = (
    rentalId: string,
    month: number,
    fileName: string
  ) => {
    setRentals((prev) =>
      prev.map((r) => {
        if (r.id !== rentalId) return r;
        if (!isBroker && r.assignedToId !== currentUser.id) return r;
        return {
          ...r,
          payments: r.payments.map((p) =>
            p.month === month
              ? {
                  ...p,
                  receiptName: fileName,
                  receiptUrl: `https://fake-supabase-storage.co/receipts/${fileName}`,
                }
              : p
          ),
        };
      })
    );
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
        prev.map((p) =>
          p.id === newMandate.propertyId
            ? {
                ...p,
                mandateStart: newMandate.startDate,
                mandateEnd: newMandate.endDate,
                ownerCustomerId: newMandate.ownerCustomerId || p.ownerCustomerId,
                ownerName: newMandate.ownerName || p.ownerName,
                ownerPhone: newMandate.ownerPhone || p.ownerPhone,
              }
            : p
        )
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
    setMandates((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
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
    return true;
  };

  const visibleMandates = isBroker
    ? mandates
    : mandates.filter((m) => m.assignedToId === currentUser.id);

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
