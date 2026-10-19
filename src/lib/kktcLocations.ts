// KKTC (Kuzey Kıbrıs Türk Cumhuriyeti) İlçe, Bölge, Belde ve Mahalle Hiyerarşisi
// 101evler ve HangiEv standartlarında eksiksiz, tekil ve zenginleştirilmiş veri tabanı
// A'dan Z'ye alfabetik sıralı yapılandırılmıştır

export interface KKTCLocation {
  district: string;
  regions: {
    name: string;
    neighborhoods?: string[];
  }[];
}

export const KKTC_LOCATIONS: KKTCLocation[] = [
  {
    district: "Gazimağusa",
    regions: [
      { name: "Akdoğan (Lisi)", neighborhoods: ["Akdoğan Merkez","Polis Karakolu Civarı","Sağlık Merkezi Bölgesi"] },
      { name: "Akova", neighborhoods: ["Köy İçi"] },
      { name: "Alaniçi", neighborhoods: ["Hasat Alanları","Köy İçi"] },
      { name: "Anadolu Mahallesi", neighborhoods: ["Liman Yolu","Serbest Liman Civarı"] },
      { name: "Arıdamı", neighborhoods: ["Köy İçi"] },
      { name: "Aslanköy", neighborhoods: ["Köy İçi"] },
      { name: "Atlılar", neighborhoods: ["Köy Meydanı","Şehitlik Bölgesi"] },
      { name: "Baykal", neighborhoods: ["Namık Kemal Lisesi Civarı","Stadyum Bölgesi","Tren Yolu"] },
      { name: "Beyarmudu", neighborhoods: ["Beyarmudu Sınır Kapısı Civarı","Köy Meydanı"] },
      { name: "Çanakkale", neighborhoods: ["Anıt Tepe","Çanakkale Ortaokulu Bölgesi","Gölet Civarı"] },
      { name: "Çınarlı", neighborhoods: ["İncirli Mağarası Civarı","Köy İçi"] },
      { name: "Dörtyol", neighborhoods: ["Dörtyol Çemberi","Köy Meydanı"] },
      { name: "Dumlupınar", neighborhoods: ["Dumlupınar Spor Kulübü Civarı","İlkokul Bölgesi"] },
      { name: "Ergenekon", neighborhoods: ["Köy İçi"] },
      { name: "Geçitkale", neighborhoods: ["Belediye Bölgesi","Havaalanı Civarı","Köy İçi"] },
      { name: "Gönendere", neighborhoods: ["Gölet Yolu","Kültür Merkezi Civarı"] },
      { name: "Gülseren", neighborhoods: ["Askeri Gazino Bölgesi","Gülseren Göleti Civarı","Sahil Hattı"] },
      { name: "Harika Mahallesi", neighborhoods: ["Harika Parkı","Maraş Sınırı"] },
      { name: "İnönü (Sinde)", neighborhoods: ["Köy Meydanı","Mağaralar Bölgesi"] },
      { name: "Kapalı Maraş", neighborhoods: ["Kamuya Açılan Gezi Güzergahı","Sahil Yolu"] },
      { name: "Karakol", neighborhoods: ["Gülseren Koyu","Lemar Yolu","Öğrenci Yurtları Bölgesi","Salamis Yolu Ana Cadde"] },
      { name: "Korkuteli", neighborhoods: ["Köy İçi"] },
      { name: "Kurudere", neighborhoods: ["Köy İçi"] },
      { name: "Mallıdağ", neighborhoods: ["Köy İçi"] },
      { name: "Maraş (Açık Maraş)", neighborhoods: ["Açık Maraş Konutları","Harika Mahallesi Sınırı","Ziraat Caddesi"] },
      { name: "Mormenekşe", neighborhoods: ["Enginar Festivali Meydanı","Köy İçi"] },
      { name: "Muratağa", neighborhoods: ["Köy İçi"] },
      { name: "Mutluyaka", neighborhoods: ["Köy İçi","Tuzla Bağlantı Yolu"] },
      { name: "Namık Kemal Mahallesi", neighborhoods: ["Tarihi Konaklar Bölgesi"] },
      { name: "Nergisli", neighborhoods: ["Köy İçi"] },
      { name: "Paşaköy", neighborhoods: ["Askeri Birlik Civarı","Köy İçi"] },
      { name: "Pınarlı", neighborhoods: ["Köy İçi"] },
      { name: "Pile", neighborhoods: ["Birleşmiş Milletler Ara Bölge Hattı","Kuzey Bölgesi"] },
      { name: "Pirhan", neighborhoods: ["Köy İçi"] },
      { name: "Piyale Paşa", neighborhoods: ["Karakol Sınırı","Tarihi Konutlar"] },
      { name: "Sakarya", neighborhoods: ["City Mall Bölgesi","DAÜ Doğu Kampüsü","Magusa Arena Civarı"] },
      { name: "Salamis Yolu", neighborhoods: ["Alışveriş Şeridi","DAÜ Ana Giriş","Kafeler Caddesi"] },
      { name: "Sandallar", neighborhoods: ["Köy İçi"] },
      { name: "Serdarlı (Çatoz)", neighborhoods: ["Babutsa Festivali Alanı","Köy Meydanı"] },
      { name: "Suriçi (Tarihi Mağusa)", neighborhoods: ["Deniz Kapısı","Lala Mustafa Paşa Camii Meydanı","Othello Kalesi Civarı","Venedik Sarayı Kalıntıları"] },
      { name: "Sütlüce", neighborhoods: ["Köy İçi"] },
      { name: "Tatlısu (Mağusa Sahil)", neighborhoods: ["Küçük Erenköy","Tatlısu Sahil Yolu"] },
      { name: "Tirmen", neighborhoods: ["Köy İçi"] },
      { name: "Tuzla", neighborhoods: ["Gazi Caddesi","Müstakil Villalar Bölgesi","Tuzla Girişi"] },
      { name: "Ulukışla", neighborhoods: ["Köy İçi"] },
      { name: "Vadili", neighborhoods: ["Köy İçi","Vadili Merkez"] },
      { name: "Yamaçköy", neighborhoods: ["Köy İçi"] },
      { name: "Yeniboğaziçi", neighborhoods: ["Bedi's Plajı","Cittaslow Meydanı","Kocareis Sahili","Köy İçi","Salamis Bay"] },
      { name: "Yıldırım", neighborhoods: ["Geçitkale Yolu","Köy İçi"] },
      { name: "Zafer Mahallesi", neighborhoods: ["Eski Hastane Bölgesi","Zafer Anıtı Civarı"] },
    ],
  },
  {
    district: "Girne",
    regions: [
      { name: "Ağırdağ", neighborhoods: ["Dağ Eteği Evleri","Köy İçi"] },
      { name: "Alagadi", neighborhoods: ["Alagadi 1 Kaplumbağa Sahili","Alagadi 2 Doğal Plajı","Sahil Siteleri"] },
      { name: "Alevkaya", neighborhoods: ["Herbaryum Bölgesi","Orman Dairesi Civarı"] },
      { name: "Alsancak", neighborhoods: ["Alsancak Sahil","Köy İçi","Milli Park Civarı","Yavuz Çıkarma Plajı Hattı","Yeşiltepe"] },
      { name: "Arapköy", neighborhoods: ["Chelsey Village Bölgesi","Golf Yolu","Köy İçi"] },
      { name: "Aşağı Girne", neighborhoods: ["Antik Liman","Kordonboyu","Mendirek Civarı"] },
      { name: "Bahçeli", neighborhoods: ["Köy İçi","Marina Yolu","Sahil Hattı"] },
      { name: "Başpınar", neighborhoods: ["Eski Değirmenler Bölgesi","Pınar Başı"] },
      { name: "Beşparmak", neighborhoods: ["Beşparmak Dağ Yolu"] },
      { name: "Beylerbeyi (Bellapais)", neighborhoods: ["Bellapais Manastırı Civarı","Dağ Hattı","Köy İçi","Tarihi Taş Evler"] },
      { name: "Boğaz (Girne Boğazı)", neighborhoods: ["Boğaz Piknik Alanı","Boğazköy","Şehitlik Bölgesi"] },
      { name: "Çamlıbel", neighborhoods: ["Koruçam Kavşağı","Köy İçi"] },
      { name: "Çatalköy", neighborhoods: ["Chamada Civarı","Düzkaya","Köy İçi","Malpas Bölgesi","Shayna Koyu"] },
      { name: "Dağyolu (Fota)", neighborhoods: ["Köy Meydanı"] },
      { name: "Doğanköy", neighborhoods: ["Doğanköy Kilisesi Civarı","Köy İçi","Liman Yolu"] },
      { name: "Edremit", neighborhoods: ["Karaman Yolu","Köy İçi","Müstakil Villalar Bölgesi"] },
      { name: "Esentepe", neighborhoods: ["Korineum Golf Resort Civarı","Köy İçi","Sahil Siteleri","Turtle Bay"] },
      { name: "Geçitköy", neighborhoods: ["Geçitköy Barajı Civarı","Köy İçi"] },
      { name: "Girne Merkez", neighborhoods: ["Aşağı Girne","Karakum","Liman Civarı","Türk Mahallesi","Yukarı Girne"] },
      { name: "Ilgaz", neighborhoods: ["Dağ Eteği Evleri","Köy İçi"] },
      { name: "Karaağaç", neighborhoods: ["Köy İçi","Vadi Evleri"] },
      { name: "Karakum", neighborhoods: ["Karakum Sahil","Lemar Çevresi","Lords Palace Bölgesi"] },
      { name: "Karaoğlanoğlu", neighborhoods: ["Bakanlık Konutları","GAÜ Kampüs Civarı","Kervansaray Koyu","Sahil Siteleri"] },
      { name: "Karmi (Karaman)", neighborhoods: ["Geleneksel Karmi Taş Evleri","Kilise Civarı","Köy Meydanı"] },
      { name: "Karşıyaka", neighborhoods: ["Güzelyalı Koyu","Kozanköy Bağlantısı","Köy İçi","Sahil Hattı"] },
      { name: "Kayalar", neighborhoods: ["Falezler Mevkii","Köy İçi","Sahil Yolu"] },
      { name: "Koruçam (Kormacit)", neighborhoods: ["Kilise Meydanı","Maronit Köy Meydanı","Yorgo Kasap Civarı"] },
      { name: "Kozanköy", neighborhoods: ["Kozan Kalesi Civarı","Köy İçi"] },
      { name: "Lapta", neighborhoods: ["Başpınar","Lapta Dağ Evleri","Lapta Sahil Yolu","Sahil Yürüyüş Yolu","Tepebaşı Yolu"] },
      { name: "Malatya (İncesu)", neighborhoods: ["Dağ Yolu","Köy İçi"] },
      { name: "Ozanköy", neighborhoods: ["İngiliz Köyü Civarı","Köy Meydanı","Sahil Hattı","Zeytinlik Yolu"] },
      { name: "Pınarbaşı (Kırnı)", neighborhoods: ["Gözlem Tepesi Civarı","Köy İçi"] },
      { name: "Sadrazamköy", neighborhoods: ["Koylar Bölgesi","Köy İçi","Sadrazamköy Feneri"] },
      { name: "Tatlısu", neighborhoods: ["Köy İçi","Küçük Erenköy Sahil Siteleri","Marina Bölgesi","Zambak Tatil Köyü"] },
      { name: "Tepebaşı", neighborhoods: ["Akdeniz Yolu","Köy Meydanı"] },
      { name: "Yeşiltepe", neighborhoods: ["Vadi Bölgesi","Zefiros Koyu Yolu"] },
      { name: "Yukarı Girne", neighborhoods: ["Barış Parkı","Belediye Civarı","Hastane Bölgesi"] },
      { name: "Zeytinlik", neighborhoods: ["Boğaz Yolu","Festival Alanı","Tarihi Köy Merkezi"] },
    ],
  },
  {
    district: "Güzelyurt",
    regions: [
      { name: "Akçay", neighborhoods: ["Köy İçi","Narenciye Tesisleri Bölgesi"] },
      { name: "Aşağı Bostancı", neighborhoods: ["Köy Meydanı","Sınır Boyu"] },
      { name: "Aydınköy", neighborhoods: ["Aydınköy Portakal Bahçeleri","Köy Meydanı"] },
      { name: "Gayretköy", neighborhoods: ["Köy İçi","Sınır Hattı"] },
      { name: "Güzelyurt Merkez", neighborhoods: ["Arkeoloji Müzesi Civarı","Kapalı Çarşı","Otobüs Terminali"] },
      { name: "İsmet Paşa", neighborhoods: ["Köy İçi","Sağlık Ocağı Civarı"] },
      { name: "Kalkanlı", neighborhoods: ["Anıt Zeytinler Vadisi","ODTÜ Kuzey Kıbrıs Kampüsü","Öğrenci Yurtları Bölgesi"] },
      { name: "Lala Mustafa Paşa", neighborhoods: ["Stadyum Bölgesi","Yeni Konutlar"] },
      { name: "Mevlevi", neighborhoods: ["Köy İçi"] },
      { name: "Piyale Paşa", neighborhoods: ["Konut Alanı","Portakal Bahçeleri Hattı"] },
      { name: "Serhatköy", neighborhoods: ["Güneş Enerji Santrali Bölgesi","Köy Meydanı"] },
      { name: "Şahinler", neighborhoods: ["Köy İçi"] },
      { name: "Yayla", neighborhoods: ["Köy İçi","Yayla Sahili"] },
      { name: "Yukarı Bostancı", neighborhoods: ["Bostancı Sınır Kapısı Civarı","Köy İçi"] },
      { name: "Yuvacık", neighborhoods: ["Köy İçi"] },
      { name: "Zümrütköy", neighborhoods: ["Tarım Alanları Bölgesi","Zümrütköy Merkez"] },
    ],
  },
  {
    district: "İskele",
    regions: [
      { name: "Ardahan", neighborhoods: ["Kantara Yolu","Köy İçi"] },
      { name: "Avtepe", neighborhoods: ["Köy İçi","Medoş Lalesi Festival Alanı"] },
      { name: "Aygün", neighborhoods: ["Köy İçi"] },
      { name: "Bafra Turizm Bölgesi", neighborhoods: ["5 Yıldızlı Resort Oteller","Bafra Halk Plajı","Tatil Köyleri"] },
      { name: "Bahçeler", neighborhoods: ["Bahçeler Plajı","Müstakil Villalar Bölgesi","Sahil Yolu"] },
      { name: "Boğaz", neighborhoods: ["Balıkçı Limanı","Marina Sahil Şeridi","Restoranlar Hattı"] },
      { name: "Boğaziçi", neighborhoods: ["Köy İçi","Sahil Yolu"] },
      { name: "Boğaztepe", neighborhoods: ["Deniz Manzaralı Yamaç Bölgesi","Tepe Evleri"] },
      { name: "Boltaşlı", neighborhoods: ["Köy İçi","Panagia Kanakaria Kilisesi Civarı"] },
      { name: "Çayırova", neighborhoods: ["Bafra Kavşağı","Köy Meydanı"] },
      { name: "Derince", neighborhoods: ["Köy İçi"] },
      { name: "Dipkarpaz", neighborhoods: ["Köy Meydanı","Milli Park Girişi","Taş Konutlar Bölgesi"] },
      { name: "Erenköy", neighborhoods: ["Sahil Yolu"] },
      { name: "Ergazi", neighborhoods: ["Köy İçi"] },
      { name: "Gelincik", neighborhoods: ["Köy İçi"] },
      { name: "İskele Merkez", neighborhoods: ["Bahçeler Yolu","Belediye Meydanı","Ecevit Caddesi","Kral Yolu","Pazar Yeri"] },
      { name: "Kaleburnu", neighborhoods: ["Köy İçi","Kral Tepesi Civarı"] },
      { name: "Kalecik", neighborhoods: ["Kalecik Sahil","Tesisler Bölgesi"] },
      { name: "Kantara", neighborhoods: ["Kantara Kalesi Civarı","Yayla Evleri"] },
      { name: "Kaplıca", neighborhoods: ["Balıkçı Barınağı","Kaplıca Koyu","Sahil Oteli Civarı"] },
      { name: "Kilitkaya", neighborhoods: ["Köy İçi"] },
      { name: "Kumyalı", neighborhoods: ["Köy İçi","Kumyalı Balıkçı Barınağı","Sahil Şeridi"] },
      { name: "Kurtuluş", neighborhoods: ["Köy İçi"] },
      { name: "Kuruova", neighborhoods: ["Köy İçi"] },
      { name: "Kuzucuk", neighborhoods: ["Köy İçi","Sahil Bağlantısı"] },
      { name: "Long Beach (Uzun Plaj)", neighborhoods: ["Caesar Resort Civarı","Courtyard Bölgesi","Grand Sapphire Bölgesi","Rezidanslar Bölgesi","Sahil Yürüyüş Şeridi"] },
      { name: "Mehmetçik", neighborhoods: ["Bağlık Bölgesi","Köy İçi","Üzüm Festivali Alanı"] },
      { name: "Mersinlik", neighborhoods: ["Kantara Bağlantısı","Sahil Yolu"] },
      { name: "Ötüken", neighborhoods: ["Köy İçi","Kuzucuk Kavşağı","Ötüken Sahili"] },
      { name: "Pamuklu", neighborhoods: ["Köy İçi"] },
      { name: "Sınırüstü", neighborhoods: ["Bakımevi Civarı","Köy Meydanı"] },
      { name: "Sipahi", neighborhoods: ["Ayios Trias Bazilikası Civarı","Köy İçi"] },
      { name: "Taşlıca", neighborhoods: ["Köy İçi"] },
      { name: "Topçuköy", neighborhoods: ["Köy İçi"] },
      { name: "Turnalar", neighborhoods: ["Köy İçi"] },
      { name: "Tuzluca", neighborhoods: ["Köy İçi"] },
      { name: "Yarköy", neighborhoods: ["Köy İçi","Pamuk Festivali Alanı"] },
      { name: "Yenierenköy", neighborhoods: ["Halk Plajı Civarı","Karpaz Gate Marina","Köy İçi"] },
      { name: "Yeşilköy", neighborhoods: ["Köy İçi","Tütün Tarlaları Bölgesi"] },
      { name: "Zafer Burnu (Karpaz)", neighborhoods: ["Altın Kumsal","Apostolos Andreas Manastırı","Karpaz Eşekleri Koruma Alanı"] },
      { name: "Ziyamet", neighborhoods: ["Köy İçi","Polis Karakolu Civarı","Sağlık Ocağı Bölgesi"] },
    ],
  },
  {
    district: "Lefke",
    regions: [
      { name: "Aplıç", neighborhoods: ["Aplıç Sınır Kapısı Civarı","Köy İçi"] },
      { name: "Bademliköy", neighborhoods: ["Bademliköy Seyir Tepesi","Vouni Sarayı Yolu"] },
      { name: "Bağlıköy", neighborhoods: ["Eko Turizm Köy İçi","Kültür Evi Civarı"] },
      { name: "Cengizköy", neighborhoods: ["Cengiz Topel Hastanesi Civarı","Köy İçi"] },
      { name: "Çamlıköy", neighborhoods: ["Güzelyurt Bağlantı Yolu","Köy İçi"] },
      { name: "Denizli", neighborhoods: ["LAÜ Alt Giriş Civarı","Sahil Yolu"] },
      { name: "Doğancı (Elye)", neighborhoods: ["Karpuz Üretim Tarlaları Hattı","Köy Meydanı"] },
      { name: "Gaziveren", neighborhoods: ["Afrodit Sahil Siteleri","Gaziveren Plajı","Wellness & Resort Kıyı Hattı"] },
      { name: "Gemikonağı", neighborhoods: ["Lefke Avrupa Üniversitesi (LAÜ) Kampüsü","Öğrenci Yurtları Bölgesi","Sahil Kordonu","Tarihi İskele Limanı"] },
      { name: "Lefke Merkez", neighborhoods: ["Hurmalık Bölgesi","Mahkemeler","Tarihi Osmanlı Konakları","Tarihi Su Kemerleri"] },
      { name: "Taşköy", neighborhoods: ["Köy İçi"] },
      { name: "Taşpınar", neighborhoods: ["Köy İçi"] },
      { name: "Yedidalga", neighborhoods: ["Balıkçı Limanı","Halk Plajı","Kuğulu Park","Soli Antik Kenti & Tiyatrosu"] },
      { name: "Yeşilırmak", neighborhoods: ["Çilek Tarlaları","Dev Asma Ağacı Civarı","Limnitis Koyu","Yeşilırmak Sınır Kapısı"] },
    ],
  },
  {
    district: "Lefkoşa",
    regions: [
      { name: "Akıncılar (Luricina)", neighborhoods: ["Köy Meydanı","Sınır Bölgesi"] },
      { name: "Alayköy", neighborhoods: ["Alayköy Girişi","Köy İçi","Sanayi Bölgesi"] },
      { name: "Balıkesir", neighborhoods: ["Ercan Bağlantısı","Köy İçi"] },
      { name: "Beyköy", neighborhoods: ["Köy İçi"] },
      { name: "Büyük Kaymaklı", neighborhoods: ["Dumlupınar Civarı","Köy İçi"] },
      { name: "Cihangir", neighborhoods: ["Güzelyurt/Gazimağusa Kavşağı","Köy İçi"] },
      { name: "Çağlayan", neighborhoods: ["Çağlayan Parkı","Çocuk Parkı Civarı","Sınır Hattı Konutları"] },
      { name: "Çamlıca", neighborhoods: ["Köy İçi"] },
      { name: "Değirmenlik", neighborhoods: ["Merkez","Tarihi Değirmen Civarı","Tepebaşı"] },
      { name: "Demirhan", neighborhoods: ["Erülkü Süpermarket Bölgesi","Köy İçi","Sanayi Bölgesi"] },
      { name: "Dereboyu", neighborhoods: ["Eski Meclis Arkası","Mehmet Akif Caddesi","Pronto Çemberi"] },
      { name: "Dilekkaya", neighborhoods: ["Köy Meydanı"] },
      { name: "Düzova", neighborhoods: ["Köy Meydanı","Tarım Alanları Bölgesi"] },
      { name: "Ercan Havalimanı Bölgesi", neighborhoods: ["Kargo Bölgesi","Yeni Terminal Hattı"] },
      { name: "Erdemli", neighborhoods: ["Köy İçi"] },
      { name: "Gaziköy", neighborhoods: ["Köy İçi"] },
      { name: "Göçmenköy", neighborhoods: ["Belediye Dükkanları","Göçmenköy Stadı Civarı","Köy Meydanı"] },
      { name: "Gökhan", neighborhoods: ["Köy Meydanı"] },
      { name: "Gönyeli", neighborhoods: ["Belediye Evleri","Gönyeli Çemberi","Köy İçi","Samanbahçe Evleri","Yenikent"] },
      { name: "Hamitköy", neighborhoods: ["Anıttepe Civarı","Dumlupınar Bölgesi","Hamitköy Tepe","Köy Meydanı"] },
      { name: "Haspolat", neighborhoods: ["Hala Sultan Camii Civarı","Sanayi Bölgesi","Uluslararası Kıbrıs Üniversitesi (UKÜ) Kampüsü"] },
      { name: "Kalavaç", neighborhoods: ["Eko Turizm Köy İçi"] },
      { name: "Kanlıköy", neighborhoods: ["Gölet Civarı","Köy İçi"] },
      { name: "Kermiya (Sosyal Konutlar)", neighborhoods: ["Kemal Şemiler Caddesi","Kermiya Sosyal Konutları","Metehan Sınır Kapısı Civarı"] },
      { name: "Kırıkkale", neighborhoods: ["Köy İçi"] },
      { name: "Kızılay", neighborhoods: ["Kızılay Camii Civarı","Şehit Aileleri Konutları"] },
      { name: "Köşklüçiftlik", neighborhoods: ["Bakanlıklar Bölgesi","Cumhurbaşkanlığı Civarı","Osman Paşa Caddesi"] },
      { name: "Kumsal", neighborhoods: ["Eski Tren Hattı Civarı","Gülseren Caddesi","Kumsal Parkı Civarı"] },
      { name: "Küçük Kaymaklı", neighborhoods: ["Lemar Bölgesi","LTB Civarı","Otobüs Terminali Yolu","Terminal Civarı"] },
      { name: "Marmara", neighborhoods: ["Kuğulu Park Yolu","Marmara Parkı Civarı","Metropol Yolu"] },
      { name: "Meriç", neighborhoods: ["Köy Meydanı"] },
      { name: "Minareliköy", neighborhoods: ["Havalimanı Yolu","Köy İçi"] },
      { name: "Ortaköy", neighborhoods: ["Dr. Burhan Nalbantoğlu Hastanesi Bölgesi","Köy İçi","Lefkoşa Fuar Alanı"] },
      { name: "Surlariçi (Tarihi Merkez)", neighborhoods: ["Arasta","Büyük Han Bölgesi","Lokmacı Kapısı","Sarayönü","Selimiye"] },
      { name: "Taşkınköy", neighborhoods: ["Doktorlar Sitesi","Metropol Arkası","Taşkınköy Spor Kulübü Civarı"] },
      { name: "Yenikent", neighborhoods: ["Belediye Parkı Civarı","Dereboyu Hattı","Yenikent Bulvarı"] },
      { name: "Yenişehir", neighborhoods: ["Atatürk Kültür Merkezi (AKM)","Şehitler Abidesi Bölgesi","Trafik Dairesi Civarı"] },
      { name: "Yılmazköy", neighborhoods: ["Güzelyurt Anayolu Hattı","Köy İçi"] },
      { name: "Yiğitler", neighborhoods: ["Köy İçi"] },
    ],
  },
];

// Tüm KKTC İlçe Listesi (A'dan Z'ye Alfabetik Sıralı)
export const KKTC_DISTRICTS = KKTC_LOCATIONS.map((l) => l.district);

// Belirli bir ilçenin bölgelerini getir (A'dan Z'ye Alfabetik Sıralı)
export function getRegionsByDistrict(district: string): string[] {
  const match = KKTC_LOCATIONS.find(
    (l) => l.district.toLowerCase() === district.toLowerCase()
  );
  if (!match) return [];
  return [...match.regions]
    .map((r) => r.name)
    .sort((a, b) => a.localeCompare(b, "tr-TR"));
}

// Belirli bir ilçe ve bölgenin mahallelerini getir (A'dan Z'ye Alfabetik Sıralı)
export function getNeighborhoodsByRegion(district: string, regionName: string): string[] {
  const districtMatch = KKTC_LOCATIONS.find(
    (l) => l.district.toLowerCase() === district.toLowerCase()
  );
  if (!districtMatch) return [];
  const regionMatch = districtMatch.regions.find(
    (r) => r.name.toLowerCase() === regionName.toLowerCase()
  );
  if (!regionMatch?.neighborhoods) return [];
  return [...regionMatch.neighborhoods].sort((a, b) => a.localeCompare(b, "tr-TR"));
}
