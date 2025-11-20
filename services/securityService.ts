// Simple implementation of AES-GCM encryption for local storage
// Note: In a real scenario, the key would be derived from a user password.
// For this seamless "Apple-like" experience without login, we generate a device key.

const KEY_STORAGE_NAME = 'dj_device_key_v1';

async function getEncryptionKey(): Promise<CryptoKey> {
  let jwk = localStorage.getItem(KEY_STORAGE_NAME);
  
  if (!jwk) {
    // Generate a new key if one doesn't exist
    const key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    localStorage.setItem(KEY_STORAGE_NAME, JSON.stringify(exported));
    return key;
  }

  return window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(jwk),
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    // Combine IV and Data for storage
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    // Convert to Base64
    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error("Encryption failed", e);
    return data; // Fallback (should not happen in prod)
  }
}

export async function decryptData(encryptedBase64: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    
    const binary = atob(encryptedBase64);
    const len = binary.length;
    const combined = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    console.error("Decryption failed", e);
    return ""; // Return empty on failure
  }
}