import { webcrypto } from "crypto";

// #############
// ### Utils ###
// #############

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(buffer)).toString("base64");
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return new Uint8Array(Buffer.from(base64, "base64")).buffer;
}

// ################
// ### RSA keys ###
// ################

type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};

export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  return { publicKey, privateKey };
}

export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  const exported = await webcrypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

export async function exportPrvKey(key: webcrypto.CryptoKey): Promise<string> {
  const exported = await webcrypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exported);
}

export async function importPubKey(strKey: string): Promise<webcrypto.CryptoKey> {
  const buffer = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "spki",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

export async function importPrvKey(strKey: string): Promise<webcrypto.CryptoKey> {
  const buffer = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "pkcs8",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

export async function rsaEncrypt(b64Data: string, strPublicKey: string): Promise<string> {
  const publicKey = await importPubKey(strPublicKey);
  const encodedData = new TextEncoder().encode(b64Data);
  const encrypted = await webcrypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encodedData
  );
  return arrayBufferToBase64(encrypted);
}

export async function rsaDecrypt(data: string, privateKey: webcrypto.CryptoKey): Promise<string> {
  const decrypted = await webcrypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    base64ToArrayBuffer(data)
  );
  return new TextDecoder().decode(decrypted);
}

// ######################
// ### Symmetric keys ###
// ######################

export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  return await webcrypto.subtle.generateKey(
    { name: "AES-CBC", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  const exported = await webcrypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exported);
}

export async function importSymKey(strKey: string): Promise<webcrypto.CryptoKey> {
  const buffer = base64ToArrayBuffer(strKey);
  return await webcrypto.subtle.importKey(
    "raw",
    buffer,
    { name: "AES-CBC" },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function symEncrypt(key: webcrypto.CryptoKey, data: string): Promise<string> {
  const iv = webcrypto.getRandomValues(new Uint8Array(16));
  const encrypted = await webcrypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    new TextEncoder().encode(data)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  const encryptedAsBase64 = arrayBufferToBase64(combined.buffer);
  return encryptedAsBase64;
}

export async function symDecrypt(keyString: string, encryptedText: string): Promise<string> {
  const key = await importSymKey(keyString);
  const buffer = base64ToArrayBuffer(encryptedText);
  const iv = buffer.slice(0, 16);
  const cipherText = buffer.slice(16);

  const decryptedBuffer = await webcrypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    cipherText
  );

  return new TextDecoder().decode(decryptedBuffer);
}
