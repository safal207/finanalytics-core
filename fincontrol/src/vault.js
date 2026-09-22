/* SEC-001: local encrypted files. Web Crypto primitives only; no networking.
 * This module protects a saved file, not an unlocked or compromised device.
 * V1 is a bounded canonical envelope; no algorithm negotiation or weak fallback.
 */
(function (root) {
  'use strict';
  const FORMAT = 'FinControl.encrypted-workspace';
  const VERSION = 1;
  const ITERATIONS = 600000;
  const MAX_FILE_BYTES = 262144;
  const MAX_PLAINTEXT_BYTES = 131072;
  const encoder = new TextEncoder();
  class VaultError extends Error {
    constructor(code) { super(code); this.name = 'VaultError'; this.code = code; }
  }
  const fail = code => { throw new VaultError(code); };
  function cryptoProvider() {
    const provider = root.crypto;
    if (root.isSecureContext === false || !provider?.subtle || !provider?.getRandomValues)
      fail('CRYPTO_UNAVAILABLE');
    return provider;
  }
  function exactKeys(value, keys) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) &&
      Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));
  }
  function toBase64(bytes) {
    let result = '';
    for (let i = 0; i < bytes.length; i += 8192)
      result += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(result);
  }
  function fromBase64(text, minimum, maximum) {
    if (typeof text !== 'string' || text.length > Math.ceil(maximum / 3) * 4 ||
        text.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text))
      fail('FORMAT_INVALID');
    let bytes;
    try { bytes = Uint8Array.from(atob(text), c => c.charCodeAt(0)); }
    catch (_) { fail('FORMAT_INVALID'); }
    if (bytes.length < minimum || bytes.length > maximum || toBase64(bytes) !== text)
      fail('FORMAT_INVALID');
    return bytes;
  }
  function passwordBytes(password) {
    if (typeof password !== 'string' || password.length > 1024 ||
        [...password].length < 12 || !/\S/u.test(password)) fail('PASSWORD_POLICY');
    // TextEncoder replaces lone UTF-16 surrogates; reject them rather than alias passwords.
    for (let i = 0; i < password.length; i++) {
      const c = password.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF) {
        const next = password.charCodeAt(++i);
        if (!(next >= 0xDC00 && next <= 0xDFFF)) fail('PASSWORD_POLICY');
      } else if (c >= 0xDC00 && c <= 0xDFFF) fail('PASSWORD_POLICY');
    }
    const bytes = encoder.encode(password); // No trim, case fold or Unicode normalization.
    if (bytes.length > 1024) { bytes.fill(0); fail('PASSWORD_POLICY'); }
    return bytes;
  }
  function validatePassword(password) { const bytes = passwordBytes(password); bytes.fill(0); return true; }
  async function keyFor(password, salt, usage) {
    const provider = cryptoProvider();
    const bytes = passwordBytes(password);
    let base;
    try { base = await provider.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveKey']); }
    finally { bytes.fill(0); }
    return provider.subtle.deriveKey(
      {name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS},
      base, {name: 'AES-GCM', length: 256}, false, [usage]
    );
  }
  function headerFor(salt, iv) {
    return {
      format: FORMAT, version: VERSION,
      kdf: {name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt_b64: toBase64(salt)},
      cipher: {name: 'AES-GCM', key_bits: 256, iv_b64: toBase64(iv), tag_bits: 128}
    };
  }
  function parseEnvelope(text) {
    if (typeof text !== 'string' || text.length > MAX_FILE_BYTES || encoder.encode(text).length > MAX_FILE_BYTES)
      fail('FILE_TOO_LARGE');
    let parsed;
    try { parsed = JSON.parse(text); } catch (_) { fail('FORMAT_INVALID'); }
    if (!exactKeys(parsed, ['format', 'version', 'kdf', 'cipher', 'ciphertext_b64'])) fail('FORMAT_INVALID');
    if (parsed.format !== FORMAT || parsed.version !== VERSION) fail('FORMAT_UNSUPPORTED');
    if (!exactKeys(parsed.kdf, ['name', 'hash', 'iterations', 'salt_b64']) ||
        !exactKeys(parsed.cipher, ['name', 'key_bits', 'iv_b64', 'tag_bits'])) fail('FORMAT_INVALID');
    if (parsed.kdf.name !== 'PBKDF2' || parsed.kdf.hash !== 'SHA-256' ||
        parsed.kdf.iterations !== ITERATIONS || parsed.cipher.name !== 'AES-GCM' ||
        parsed.cipher.key_bits !== 256 || parsed.cipher.tag_bits !== 128) fail('FORMAT_UNSUPPORTED');
    const salt = fromBase64(parsed.kdf.salt_b64, 16, 16);
    const iv = fromBase64(parsed.cipher.iv_b64, 12, 12);
    const ciphertext = fromBase64(parsed.ciphertext_b64, 17, MAX_PLAINTEXT_BYTES + 16);
    const header = headerFor(salt, iv);
    const canonical = JSON.stringify({...header, ciphertext_b64: toBase64(ciphertext)});
    // Strict canonical v1 rejects duplicate keys, extensions and ambiguous encodings.
    if (text !== canonical && text !== canonical + '\n') fail('FORMAT_INVALID');
    return {header, salt, iv, ciphertext};
  }
  async function seal(value, password) {
    const provider = cryptoProvider();
    validatePassword(password);
    let serialized;
    try { serialized = JSON.stringify(value); } catch (_) { fail('PAYLOAD_INVALID'); }
    if (typeof serialized !== 'string') fail('PAYLOAD_INVALID');
    if (serialized.length > MAX_PLAINTEXT_BYTES) fail('PAYLOAD_TOO_LARGE');
    const plaintext = encoder.encode(serialized);
    serialized = '';
    if (plaintext.length > MAX_PLAINTEXT_BYTES) { plaintext.fill(0); fail('PAYLOAD_TOO_LARGE'); }
    const salt = provider.getRandomValues(new Uint8Array(16));
    const iv = provider.getRandomValues(new Uint8Array(12));
    const header = headerFor(salt, iv);
    try {
      const key = await keyFor(password, salt, 'encrypt');
      const encrypted = await provider.subtle.encrypt(
        {name: 'AES-GCM', iv, additionalData: encoder.encode(JSON.stringify(header)), tagLength: 128},
        key, plaintext
      );
      return JSON.stringify({...header, ciphertext_b64: toBase64(new Uint8Array(encrypted))}) + '\n';
    } finally { plaintext.fill(0); }
  }
  async function open(text, password) {
    const provider = cryptoProvider();
    const {header, salt, iv, ciphertext} = parseEnvelope(text); // Size and work-factor checks before KDF.
    const key = await keyFor(password, salt, 'decrypt');
    let plaintext;
    try {
      plaintext = new Uint8Array(await provider.subtle.decrypt(
        {name: 'AES-GCM', iv, additionalData: encoder.encode(JSON.stringify(header)), tagLength: 128},
        key, ciphertext
      ));
    } catch (_) { fail('AUTH_FAILED'); }
    // AEAD authenticates bytes before any parsed data is exposed to the caller.
    try {
      return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(plaintext));
    } catch (_) { fail('PAYLOAD_INVALID'); }
    finally { plaintext.fill(0); }
  }
  function randomPassword() {
    return toBase64(cryptoProvider().getRandomValues(new Uint8Array(24))).replace(/\+/g, '-').replace(/\//g, '_');
  }
  const api = Object.freeze({seal, open, parseEnvelope, validatePassword, randomPassword, VaultError,
    constants: Object.freeze({FORMAT, VERSION, ITERATIONS, MAX_FILE_BYTES, MAX_PLAINTEXT_BYTES})});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.defineProperty(root, 'FinVault', {value: api, writable: false, configurable: false});
})(globalThis);
