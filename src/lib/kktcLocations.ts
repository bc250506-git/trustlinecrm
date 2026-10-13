// KKTC (Kuzey Kıbrıs Türk Cumhuriyeti) İlçe, Bölge ve Mahalle Hiyerarşisi

export interface KKTCLocation {
  district: string;
  regions: {
    name: string;
    neighborhoods?: string[];
  }[];
}

export const KKTC_LOCATIONS: KKTCLocation[] = [
  {
    district: "Girne",
    regions: [
      {
        name: "Girne Merkez",
        neighborhoods: ["Aşağı Girne", "Yukarı Girne", "Türk Mahallesi", "Karakum"],
      },
      {
        name: "Alsancak",
        neighborhoods: ["Alsancak Sahil", "Yeşiltepe", "Milli Park Civarı"],
      },
      {
        name: "Lapta",
        neighborhoods: ["Lapta Sahil Yolu", "Başpınar", "Tepebaşı Yolu"],
      },
      {
        name: "Çatalköy",
        neighborhoods: ["Shayna Koyu", "Arapköy", "Köy İçi"],
      },
      {
        name: "Bellapais (Beylerbeyi)",
        neighborhoods: ["Manastır Civarı", "Köy İçi"],
      },
      {
        name: "Ozanköy",
        neighborhoods: ["Köy Meydanı", "Zeytinlik Yolu"],
      },
      {
        name: "Doğanköy",
        neighborhoods: ["Liman Yolu", "Köy İçi"],
      },
      {
        name: "Zeytinlik",
        neighborhoods: ["Festival Alanı", "Boğaz Yolu"],
      },
      {
        name: "Karaoğlanoğlu",
        neighborhoods: ["Kervansaray Koyu", "GAÜ Kampüs Civarı"],
      },
      {
        name: "Edremit",
        neighborhoods: ["Karaman Yolu", "Köy İçi"],
      },
      {
        name: "Karşıyaka",
        neighborhoods: ["Güzelyalı Koyu", "Kozanköy Yolu"],
      },
      {
        name: "Esentepe",
        neighborhoods: ["Bahçeli", "Karaağaç", "Alagadi Kaplumbağa Sahili"],
      },
      {
        name: "Kayalar & Sadrazamköy",
        neighborhoods: ["Kayalar Sahil", "Sadrazamköy Feneri"],
      },
    ],
  },
  {
    district: "Lefkoşa",
    regions: [
      {
        name: "Gönyeli",
        neighborhoods: ["Yenikent", "Belediye Evleri", "Gönyeli Çemberi"],
      },
      {
        name: "Küçük Kaymaklı",
        neighborhoods: ["Terminal Civarı", "Lefkoşa Türk Belediyesi Civarı"],
      },
      {
        name: "Ortaköy",
        neighborhoods: ["Dr. Burhan Nalbantoğlu Hastanesi Bölgesi", "Köy İçi"],
      },
      {
        name: "Kumsal & Dereboyu",
        neighborhoods: ["Mehmet Akif Caddesi (Dereboyu)", "Gülseren Caddesi"],
      },
      {
        name: "Köşklüçiftlik",
        neighborhoods: ["Bakanlıklar Bölgesi", "Cumhurbaşkanlığı Civarı"],
      },
      {
        name: "Marmara & Taşkınköy",
        neighborhoods: ["Metropol Yolu", "Taşkınköy Spor Kulübü Civarı"],
      },
      {
        name: "Yenişehir & Çağlayan",
        neighborhoods: ["Atatürk Kültür Merkezi Bölgesi", "Park Civarı"],
      },
      {
        name: "Surlariçi (Tarihi Merkez)",
        neighborhoods: ["Arasta", "Sarayönü", "Büyük Han Bölgesi"],
      },
      {
        name: "Alayköy",
        neighborhoods: ["Sanayi Bölgesi", "Köy İçi"],
      },
      {
        name: "Hamitköy",
        neighborhoods: ["Dumlupınar", "Hamitköy Tepe"],
      },
      {
        name: "Haspolat",
        neighborhoods: ["Uluslararası Kıbrıs Üniversitesi Kampüsü", "Sanayi Bölgesi"],
      },
      {
        name: "Değirmenlik",
        neighborhoods: ["Minareliköy", "Demirhan", "Düzova", "Cihangir", "Meriç", "Balıkesir"],
      },
    ],
  },
  {
    district: "Gazimağusa",
    regions: [
      {
        name: "Sakarya",
        neighborhoods: ["City Mall Bölgesi", "DAÜ Doğu Kampüsü"],
      },
      {
        name: "Karakol",
        neighborhoods: ["Salamis Yolu Ana Cadde", "Gülseren Koyu"],
      },
      {
        name: "Çanakkale",
        neighborhoods: ["Gölet Civarı", "Anıt Tepe"],
      },
      {
        name: "Baykal & Dumlupınar",
        neighborhoods: ["Tren Yolu", "Stadyum Bölgesi"],
      },
      {
        name: "Maraş",
        neighborhoods: ["Kapalı Maraş Sahil Hattı", "Açık Maraş Konutları"],
      },
      {
        name: "Suriçi (Tarihi Mağusa)",
        neighborhoods: ["Othello Kalesi Civarı", "Lala Mustafa Paşa Camii Meydanı"],
      },
      {
        name: "Yeniboğaziçi",
        neighborhoods: ["Salamis Bay", "Bedi's Plajı", "Köy İçi"],
      },
      {
        name: "Tuzla & Mutluyaka",
        neighborhoods: ["Tuzla Girişi", "Gazi Caddesi"],
      },
      {
        name: "Tatlısu",
        neighborhoods: ["Küçük Erenköy", "Sahil Siteleri"],
      },
      {
        name: "Geçitkale & Serdarlı",
        neighborhoods: ["Havaalanı Civarı", "Köy İçi"],
      },
      {
        name: "Vadili, Akdoğan & Beyarmudu",
        neighborhoods: ["Akdoğan Merkez", "Beyarmudu Sınır Bölgesi"],
      },
    ],
  },
  {
    district: "İskele",
    regions: [
      {
        name: "Long Beach",
        neighborhoods: ["Ötüken Sahili", "Kuzucuk Sahil Hattı", "Rezidanslar Bölgesi"],
      },
      {
        name: "İskele Merkez",
        neighborhoods: ["Kral Yolu", "Ecevit Caddesi", "Bahçeler"],
      },
      {
        name: "Boğaz & Boğaziçi",
        neighborhoods: ["Balıkçı Limanı", "Marina Sahil Şeridi"],
      },
      {
        name: "Bafra Turizm Bölgesi",
        neighborhoods: ["5 Yıldızlı Resort Oteller", "Tatil Köyleri"],
      },
      {
        name: "Mehmetçik & Kumyalı",
        neighborhoods: ["Balalan", "Kumyalı Balıkçı Barınağı"],
      },
      {
        name: "Yenierenköy",
        neighborhoods: ["Karpaz Gate Marina", "Köy İçi"],
      },
      {
        name: "Dipkarpaz",
        neighborhoods: ["Zafer Burnu Yolu", "Altın Kumsal", "Apostolos Andreas"],
      },
      {
        name: "Kalecik",
        neighborhoods: ["Tesisler Bölgesi", "Sahil"],
      },
    ],
  },
  {
    district: "Güzelyurt",
    regions: [
      {
        name: "Güzelyurt Merkez",
        neighborhoods: ["Piyale Paşa", "İsmet Paşa", "Kapalı Çarşı"],
      },
      {
        name: "Bostancı",
        neighborhoods: ["Aşağı Bostancı", "Yukarı Bostancı Sınır"],
      },
      {
        name: "Kalkanlı",
        neighborhoods: ["ODTÜ Kuzey Kıbrıs Kampüsü", "Anıt Zeytinler Vadisi"],
      },
      {
        name: "Yayla & Akçay",
        neighborhoods: ["Yayla Sahili", "Akçay Köy İçi"],
      },
      {
        name: "Zümrütköy & Aydınköy",
        neighborhoods: ["Zümrütköy Merkez", "Aydınköy Portakal Bahçeleri"],
      },
      {
        name: "Serhatköy & Gayretköy",
        neighborhoods: ["Köy İçi", "Güneş Enerji Santrali Bölgesi"],
      },
    ],
  },
  {
    district: "Lefke",
    regions: [
      {
        name: "Gemikonağı",
        neighborhoods: ["Lefke Avrupa Üniversitesi Kampüsü", "Tarihi İskele Limanı"],
      },
      {
        name: "Gaziveren",
        neighborhoods: ["Afrodit Sahil Siteleri", "Wellness & Resort Bölgesi"],
      },
      {
        name: "Lefke Merkez",
        neighborhoods: ["Tarihi Konaklar", "Mahkemeler", "Hurmalık"],
      },
      {
        name: "Yedidalga",
        neighborhoods: ["Balıkçı Limanı", "Soli Antik Kenti Civarı"],
      },
      {
        name: "Bağlıköy & Bademliköy",
        neighborhoods: ["Eko Köy Meydanı", "Vouni Sarayı Yolu"],
      },
      {
        name: "Yeşilırmak",
        neighborhoods: ["Çilek Tarlaları", "Limnitis Koyu", "Sınır Kapısı"],
      },
      {
        name: "Doğancı & Taşpınar",
        neighborhoods: ["Köy İçi", "Karpuz Tarlaları Bölgesi"],
      },
    ],
  },
];

// Tüm KKTC İlçe Listesi
export const KKTC_DISTRICTS = KKTC_LOCATIONS.map((l) => l.district);

// Belirli bir ilçenin bölgelerini getir
export function getRegionsByDistrict(district: string): string[] {
  const match = KKTC_LOCATIONS.find(
    (l) => l.district.toLowerCase() === district.toLowerCase()
  );
  if (!match) return [];
  return match.regions.map((r) => r.name);
}

// Belirli bir ilçe ve bölgenin mahallelerini getir
export function getNeighborhoodsByRegion(district: string, regionName: string): string[] {
  const districtMatch = KKTC_LOCATIONS.find(
    (l) => l.district.toLowerCase() === district.toLowerCase()
  );
  if (!districtMatch) return [];
  const regionMatch = districtMatch.regions.find(
    (r) => r.name.toLowerCase() === regionName.toLowerCase()
  );
  return regionMatch?.neighborhoods || [];
}
