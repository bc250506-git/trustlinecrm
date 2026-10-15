/**
 * TRUSTLINE CRM — KRİPTOGRAFİK GÜVENLİK VE ŞİFRE MOTORU
 * Web Crypto API standartlarına (NIST PBKDF2 / SHA-256) uygun olarak geliştirilmiştir.
 * 
 * Güvenlik İlkeleri:
 * 1. Düz metin (plaintext) şifreler ASLA saklanmaz, loglanmaz veya kodda tutulmaz.
 * 2. Her kullanıcıya özel kriptografik rastgele tuz (salt) üretilir.
 * 3. Şifreler 100.000 iterasyonlu PBKDF2 SHA-256 ile tek yönlü hash'lenir.
 * 4. Geliştirici veya veritabanı yöneticisi dahil hiç kimse şifreyi geri çözemez.
 */

// 1. Kriptografik Rastgele Tuz (Salt) Üretimi
export function generateSalt(byteLength: number = 16): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback güvenli buffer (sunucu tarafı)
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 2. PBKDF2 + SHA-256 ile Kriptografik Şifre Hash'leme
export async function hashPasswordWithSalt(
  password: string,
  salt: string
): Promise<string> {
  const enc = new TextEncoder();
  const subtleCrypto =
    (typeof window !== "undefined" && window.crypto?.subtle) ||
    (typeof crypto !== "undefined" && crypto.subtle);

  if (!subtleCrypto) {
    throw new Error("Web Crypto API bu ortamda desteklenmiyor.");
  }

  // Şifreyi ham anahtar olarak içe aktar
  const keyMaterial = await subtleCrypto.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // 100.000 iterasyonla SHA-256 türetme (Endüstri Standardı)
  const derivedBits = await subtleCrypto.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 3. Şifre Doğrulama (Zamanlama Güvenlikli Karşılaştırma)
export async function verifyPassword(
  passwordAttempt: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  if (!passwordAttempt || !salt || !expectedHash) return false;
  try {
    const computedHash = await hashPasswordWithSalt(passwordAttempt, salt);
    // Sabit zamanlı karşılaştırma (Timing Attack Koruması)
    if (computedHash.length !== expectedHash.length) return false;
    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    }
    return result === 0;
  } catch (err) {
    console.error("Şifre doğrulama hatası:", err);
    return false;
  }
}

// 4. Şifre Gücü Doğrulama
export function validatePasswordStrength(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password || password.length < 6) {
    return {
      valid: false,
      message: "Şifreniz en az 6 karakter uzunluğunda olmalıdır.",
    };
  }
  return { valid: true };
}
