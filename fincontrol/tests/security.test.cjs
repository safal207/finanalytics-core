'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const classic = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const V = require('../src/vault.js');
const W = require('../src/workspace.js');
const M = require('../src/model.js');
const demo = {manifest: JSON.parse(fs.readFileSync(path.join(root,'data/manifest.json'),'utf8')),
 csv: fs.readFileSync(path.join(root,'data/transactions.csv'),'utf8'),
 provenance: {commit:'8780de339f11ed07f14e246270583c328170f3d2'}};
const view={lang:'ru',view:'overview',account:'all',period:'full',kind:'all',search:'PRIVATE_SENTINEL_LOCAL_ONLY'};
const PASSWORD='Test-only-fresh-passphrase-SEC001!';
const expected=JSON.parse(fs.readFileSync(path.join(root,'data/expected.json'),'utf8'));
const payload=W.build(demo,view);
const fixture=V.seal(payload,PASSWORD);
const reject=code=>e=>e?.code===code;
const change=async fn=>{const x=JSON.parse(await fixture);fn(x);return JSON.stringify(x)+'\n';};
const flip=text=>{const b=Buffer.from(text,'base64');b[0]^=1;return b.toString('base64');};

test('SEC-001: authenticated round trip preserves the complete workspace',async()=>{
 assert.deepEqual(await V.open(await fixture,PASSWORD),payload);
});
test('Restored fixture recalculates every expected amount and count',async()=>{
 const restored=W.validate(await V.open(await fixture,PASSWORD),demo);
 const s=M.calculate(M.prepare(restored.manifest,M.parseCSV(restored.csv)));
 for(const [k,v] of Object.entries(expected.RUB))assert.equal(s.metrics[k].toString(),v);
 for(const [k,v] of Object.entries(expected.counts))assert.equal(s.counts[k],v);
});
test('Independent Node classic-crypto decrypt agrees with Web Crypto',async()=>{
 const {ciphertext_b64,...header}=JSON.parse(await fixture);
 const key=classic.pbkdf2Sync(Buffer.from(PASSWORD,'utf8'),Buffer.from(header.kdf.salt_b64,'base64'),600000,32,'sha256');
 const c=Buffer.from(ciphertext_b64,'base64');
 const d=classic.createDecipheriv('aes-256-gcm',key,Buffer.from(header.cipher.iv_b64,'base64'),{authTagLength:16});
 d.setAAD(Buffer.from(JSON.stringify(header),'utf8'));d.setAuthTag(c.subarray(-16));
 const decrypted=Buffer.concat([d.update(c.subarray(0,-16)),d.final()]);
 assert.deepEqual(JSON.parse(decrypted.toString('utf8')),payload);
 key.fill(0);decrypted.fill(0);
});
test('Independent classic-crypto encryption can be opened with the documented v1 envelope',async()=>{
 const salt=classic.randomBytes(16),iv=classic.randomBytes(12);
 const header={format:V.constants.FORMAT,version:1,kdf:{name:'PBKDF2',hash:'SHA-256',iterations:600000,salt_b64:salt.toString('base64')},cipher:{name:'AES-GCM',key_bits:256,iv_b64:iv.toString('base64'),tag_bits:128}};
 const key=classic.pbkdf2Sync(Buffer.from(PASSWORD),salt,600000,32,'sha256');
 const c=classic.createCipheriv('aes-256-gcm',key,iv,{authTagLength:16});c.setAAD(Buffer.from(JSON.stringify(header)));
 const cipher=Buffer.concat([c.update(JSON.stringify(payload),'utf8'),c.final(),c.getAuthTag()]);
 assert.deepEqual(await V.open(JSON.stringify({...header,ciphertext_b64:cipher.toString('base64')}),PASSWORD),payload);key.fill(0);
});
test('Saved envelope has no raw transactions, search text or password',async()=>{
 const text=await fixture;
 for(const marker of [PASSWORD,view.search,'salary-1','15000000','checking','transactions.csv','2026-08-03'])assert.ok(!text.includes(marker),marker);
 assert.deepEqual(Object.keys(JSON.parse(text)),['format','version','kdf','cipher','ciphertext_b64']);
});
test('Repeated saves create different ciphertext, salt and IV',async()=>{
 const a=JSON.parse(await fixture),b=JSON.parse(await V.seal(payload,PASSWORD));
 assert.notEqual(a.ciphertext_b64,b.ciphertext_b64);assert.notEqual(a.kdf.salt_b64,b.kdf.salt_b64);assert.notEqual(a.cipher.iv_b64,b.cipher.iv_b64);
});
test('Incorrect password is rejected with generic AUTH_FAILED',async()=>{
 await assert.rejects(V.open(await fixture,'Different-long-password-for-test'),reject('AUTH_FAILED'));
});
for(const [label,mutate] of [
 ['ciphertext',x=>x.ciphertext_b64=flip(x.ciphertext_b64)],
 ['authentication tag',x=>{const b=Buffer.from(x.ciphertext_b64,'base64');b[b.length-1]^=1;x.ciphertext_b64=b.toString('base64');}],
 ['IV',x=>x.cipher.iv_b64=flip(x.cipher.iv_b64)],
 ['salt',x=>x.kdf.salt_b64=flip(x.kdf.salt_b64)]
])test(`Tampered ${label} is rejected`,async()=>{await assert.rejects(V.open(await change(mutate),PASSWORD),reject('AUTH_FAILED'));});
for(const [label,mutate] of [
 ['version',x=>x.version=2],['low KDF iterations',x=>x.kdf.iterations=1],
 ['excessive KDF iterations',x=>x.kdf.iterations=2147483647],
 ['string KDF iterations',x=>x.kdf.iterations='600000'],['KDF hash',x=>x.kdf.hash='SHA-1'],
 ['cipher',x=>x.cipher.name='AES-CBC'],['key length',x=>x.cipher.key_bits=128],['tag length',x=>x.cipher.tag_bits=32]
])test(`Unsupported ${label} is rejected before derivation`,async()=>{
 const text=await change(mutate);assert.throws(()=>V.parseEnvelope(text),reject('FORMAT_UNSUPPORTED'));
});
const invalidCases=[['root extra field',x=>x.password='not-permitted'],['KDF extra field',x=>x.kdf.extra='x'],['missing ciphertext',x=>delete x.ciphertext_b64],['short IV',x=>x.cipher.iv_b64='AAAA'],['invalid base64',x=>x.ciphertext_b64='@bad'],['empty ciphertext',x=>x.ciphertext_b64=''],['short salt',x=>x.kdf.salt_b64='AAAA']];
for(const [label,mutate] of invalidCases)test(`Reject invalid ${label}`,async()=>{
 const text=await change(mutate);assert.throws(()=>V.parseEnvelope(text),reject('FORMAT_INVALID'));
});
test('Noncanonical, truncated, duplicate-key and BOM files are rejected',async()=>{
 const text=await fixture;
 const bad=[text.slice(0,-25),JSON.stringify(JSON.parse(text),null,2),text.replace('"version":1','"version":1,"version":1'),'\ufeff'+text,'{}','null'];
 for(const value of bad)assert.throws(()=>V.parseEnvelope(value),reject('FORMAT_INVALID'));
});
test('Oversized envelope is rejected before parsing',()=>assert.throws(()=>V.parseEnvelope('x'.repeat(V.constants.MAX_FILE_BYTES+1)),reject('FILE_TOO_LARGE')));
test('Oversized plaintext is rejected',async()=>assert.rejects(V.seal({text:'x'.repeat(V.constants.MAX_PLAINTEXT_BYTES)},PASSWORD),reject('PAYLOAD_TOO_LARGE')));
test('Too short, all-whitespace, malformed Unicode and huge passwords are rejected',()=>{
 for(const p of ['tiny',' '.repeat(16),'x'.repeat(1025),'a'.repeat(12)+'\ud800','😀'.repeat(300)])assert.throws(()=>V.validatePassword(p),reject('PASSWORD_POLICY'));
});
test('UTF-8 passphrases round-trip without truncation',async()=>{
 const p='Учебная фраза 🔐 без секретов';
 assert.deepEqual(await V.open(await V.seal({example:true},p),p),{example:true});
});
test('Whitespace is significant, not silently trimmed',async()=>{
 const p='  Original-Long-Passphrase  ',c=await V.seal({example:1},p);
 await assert.rejects(V.open(c,p.trim()),reject('AUTH_FAILED'));
 assert.deepEqual(await V.open(c,p),{example:1});
});
test('Unicode composition is not silently normalized',async()=>{
 const p='Very-long-passphrase-e\u0301',q=p.normalize('NFC');assert.notEqual(p,q);
 await assert.rejects(V.open(await V.seal({example:2},p),q),reject('AUTH_FAILED'));
});
test('Generated passwords use 24 random bytes with printable URL-safe output',()=>{
 const a=V.randomPassword(),b=V.randomPassword();assert.match(a,/^[A-Za-z0-9_-]{32}$/);assert.notEqual(a,b);assert.ok(V.validatePassword(a));
});
test('AEAD success does not admit a changed fixture or injected markup',()=>{
 for(const edit of [x=>x.dataset.csv=x.dataset.csv.replace('120000.00','999999.00'),x=>x.dataset.csv=x.dataset.csv.replace('SYNTHETIC salary','<img src=x onerror=alert(1)>'),x=>x.dataset.manifest.accounts[0].closing_signed_balance_minor='0',x=>x.synthetic=false,x=>x.source_commit='0'.repeat(40),x=>x.metrics={income:999}]){
  const x=structuredClone(payload);edit(x);assert.throws(()=>W.validate(x,demo),reject('WORKSPACE_UNSUPPORTED'));
 }
});
test('Workspace rejects invalid or oversized view settings',()=>{
 for(const [k,v] of [['lang','xx'],['view','<script>'],['account','foreign'],['period','today'],['kind','bad'],['search','x'.repeat(201)],['search','\n']]){
  const x=structuredClone(payload);x.view[k]=v;assert.throws(()=>W.validate(x,demo),reject('WORKSPACE_UNSUPPORTED'));
 }
});
test('Restored markup in a valid search value is only data',()=>{
 const x=structuredClone(payload);x.view.search='<img src=x onerror=alert(1)>';
 assert.equal(W.validate(x,demo).view.search,x.view.search);
});
test('Unsupported workspace version, extra fields and missing fields rejected',()=>{
 for(const edit of [x=>x.version=99,x=>delete x.view,x=>x.dataset.extra='x',x=>x.view.extra='x']){
  const x=structuredClone(payload);edit(x);assert.throws(()=>W.validate(x,demo),reject('WORKSPACE_UNSUPPORTED'));
 }
});
function sandbox(overrides={}) {
 const exports={};const context={module:{exports},TextEncoder,TextDecoder,Uint8Array,globalThis:null,crypto:classic.webcrypto,atob,btoa,...overrides};context.globalThis=context;
 vm.runInNewContext(fs.readFileSync(path.join(root,'src/vault.js'),'utf8'),context);
 return context.module.exports;
}
test('Nonsecure origin fails closed without plaintext fallback',async()=>{
 const v=sandbox({isSecureContext:false});await assert.rejects(v.seal(payload,PASSWORD),reject('CRYPTO_UNAVAILABLE'));await assert.rejects(v.open('{}',PASSWORD),reject('CRYPTO_UNAVAILABLE'));
});
test('Missing Web Crypto fails closed',async()=>{
 const v=sandbox({crypto:undefined});await assert.rejects(v.seal(payload,PASSWORD),reject('CRYPTO_UNAVAILABLE'));
});
test('Encryption keys are nonextractable and limited to encrypt usage',async()=>{
 const observed=[];
 const provider={getRandomValues:a=>classic.webcrypto.getRandomValues(a),subtle:{
  importKey:(...a)=>classic.webcrypto.subtle.importKey(...a),
  deriveKey:async(...a)=>{const k=await classic.webcrypto.subtle.deriveKey(...a);observed.push({extractable:k.extractable,usages:[...k.usages],algorithm:k.algorithm.name});return k;},
  encrypt:(...a)=>classic.webcrypto.subtle.encrypt(...a)}};
 const v=sandbox({crypto:provider});await v.seal({test:true},PASSWORD);
 assert.deepEqual(observed,[{extractable:false,usages:['encrypt'],algorithm:'AES-GCM'}]);
});
test('Malformed work factor performs no importKey or derivation',async()=>{
 let count=0;const provider={getRandomValues:a=>classic.webcrypto.getRandomValues(a),subtle:{importKey:()=>{count++;throw Error('unexpected')}}};
 const v=sandbox({crypto:provider});const bad=await change(x=>x.kdf.iterations=999999999);
 await assert.rejects(v.open(bad,PASSWORD),reject('FORMAT_UNSUPPORTED'));assert.equal(count,0);
});
