const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 256
const PBKDF2_ITERATIONS = 100000

// Кодирование/декодирование для хранения в Firebase
export const encodeBase64 = (bytes: Uint8Array): string => {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(binary)
}

export const decodeBase64 = (base64: string): Uint8Array => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Генерация случайного salt и IV
export const generateSalt = (): Uint8Array => {
  const array = new Uint8Array(SALT_LENGTH)
  crypto.getRandomValues(array)
  return array
}

export const generateIV = (): Uint8Array => {
  const array = new Uint8Array(IV_LENGTH)
  crypto.getRandomValues(array)
  return array
}

// Производная ключа из пароля
export const deriveKey = async (
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> => {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

// Шифрование данных
export const encryptData = async (
  data: unknown,
  password: string
): Promise<{ encrypted: string; salt: string; iv: string }> => {
  const salt = generateSalt()
  const iv = generateIV()
  const key = await deriveKey(password, salt)

  const encoder = new TextEncoder()
  const jsonString = JSON.stringify(data)
  const dataBytes = encoder.encode(jsonString)

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    dataBytes as BufferSource
  )

  return {
    encrypted: encodeBase64(new Uint8Array(encryptedContent)),
    salt: encodeBase64(salt),
    iv: encodeBase64(iv),
  }
}

// Расшифровка данных
export const decryptData = async (
  encrypted: string,
  salt: string,
  iv: string,
  password: string
): Promise<unknown> => {
  const saltBytes = decodeBase64(salt)
  const ivBytes = decodeBase64(iv)
  const encryptedBytes = decodeBase64(encrypted)

  const key = await deriveKey(password, saltBytes)

  const decryptedContent = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as BufferSource },
    key,
    encryptedBytes as BufferSource
  )

  const decoder = new TextDecoder()
  const jsonString = decoder.decode(decryptedContent)
  return JSON.parse(jsonString)
}
