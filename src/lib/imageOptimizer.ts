/**
 * Trustline CRM - İstemci Taraflı Görsel Optimizasyon Motoru
 * 
 * Yüklenen büyük fotoğrafları (5MB - 10MB) tarayıcıda Canvas üzerinde
 * otomatik olarak yeniden boyutlandırır ve yüksek sıkıştırmalı WebP formatına çevirir.
 * Sonuç: ~30KB - 70KB boyutunda ultra hafif base64 veri dizesi.
 * Supabase ve yerel veritabanında neredeyse hiç yer kaplamaz.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  sizeKb: number;
  originalName: string;
  width: number;
  height: number;
}

export async function optimizeImageToWebP(
  file: File,
  maxWidth = 1200,
  maxHeight = 900,
  quality = 0.75
): Promise<OptimizedImageResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Lütfen geçerli bir görsel dosyası (JPG, PNG, WebP) seçin.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Görsel işlenirken bir hata oluştu."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // En-boy oranını koruyarak maksimum sınırları aşmamasını sağla
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Tarayıcı görsel işleme motoru (Canvas) başlatılamadı."));
          return;
        }

        // Yüksek kaliteli çizim ayarları
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // WebP formatında çıktı üret (desteklenmeyen tarayıcılarda JPEG fallback)
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        // Base64 boyutunu hesapla (KB)
        const base64Length = dataUrl.length - (dataUrl.indexOf(",") + 1);
        const sizeInBytes = (base64Length * 3) / 4;
        const sizeKb = Math.round(sizeInBytes / 1024);

        resolve({
          dataUrl,
          sizeKb,
          originalName: file.name,
          width,
          height,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
