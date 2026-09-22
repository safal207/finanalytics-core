/* Local vault UI. No storage API, network, telemetry or password persistence. */
'use strict';
const vaultStrings = {
 ru: {
  security:'Защита', save:'Сохранить с паролем', open:'Открыть .fcvault', title:'Защита сохранённого проекта',
  intro:'Зашифруйте файл на своём устройстве. Пароль не отправляется на сервер.',
  status:'Локальный режим · синтетический пример', whole:'Сохраняется весь учебный набор и настройки экрана, а не только отфильтрованные строки.',
  fileCard:'Зашифрованный файл', fileDesc:'Операции и настройки сохраняются внутри .fcvault. Для открытия нужен ваш пароль.',
  passwordCard:'Пароль — только у вас', passwordDesc:'Он не сохраняется приложением. Потерянный пароль восстановить нельзя.',
  integrityCard:'Проверка перед открытием', integrityDesc:'Неверный пароль или изменение защищённых данных приводит к отказу. Текущий экран остаётся без изменений.',
  boundary:'Что защищено, а что нет', boundaryText:'Шифруется скачанный файл проекта. Открытый экран, исходная выписка и обычный экспорт CSV не зашифрованы. Учебный набор остаётся открытым в исходниках этой демонстрации.',
  onlyFixture:'SEC-001 работает только с этим синтетическим набором. Реальные выписки не импортируются. Это не облачная синхронизация, не E2EE между устройствами и не аудит безопасности.',
  params:'Формат файла v1', paramsText:'AES-256-GCM · PBKDF2-SHA-256 · 600 000 итераций. Для каждого сохранения создаются новые случайные salt и IV. Заголовок проверяется вместе с содержимым.',
  flow:'Открыть → рассчитать → зашифровать → восстановить', flowText:'После восстановления показатели рассчитываются заново. Пароль и данные не записываются приложением в localStorage, cookies или IndexedDB.',
  saveTitle:'Сохранить зашифрованный проект', openTitle:'Восстановить из файла',
  password:'Пароль', confirm:'Повторите пароль', passwordHelp:'Не менее 12 символов. Лучше длинная уникальная фраза или случайный пароль. Пробелы и регистр имеют значение.',
  acknowledge:'Я сохраню пароль отдельно: восстановить его через FinControl невозможно.',
  generate:'Создать случайный пароль', generated:'Случайный пароль показан. Сохраните его в менеджере паролей перед продолжением.',
  show:'Показать пароль', hide:'Скрыть пароль', download:'Зашифровать и сохранить', restore:'Расшифровать и открыть',
  choose:'Выберите файл .fcvault', chooseHelp:'До 256 КиБ. Заголовок содержит только формат, параметры шифрования и зашифрованные данные.',
  cancel:'Отмена', busy:'Проверка и обработка на устройстве…',
  saved:'Зашифрованный файл передан браузеру для сохранения.', restored:'Файл восстановлен. Показатели пересчитаны.',
  fileReady:'Формат распознан. Содержимое ещё не расшифровано и не проверено.',
  noFile:'Сначала выберите файл .fcvault.', mismatch:'Пароли не совпадают.', ackNeeded:'Подтвердите, что сохраните пароль отдельно.',
  unavailable:'Безопасный Web Crypto недоступен. Откройте файл в поддерживаемом браузере или используйте HTTPS / localhost. Незашифрованной замены не будет.',
  errorAuth:'Не удалось открыть: неверный пароль или файл повреждён.',
  errorFormat:'Файл повреждён или его формат не поддерживается.', errorSize:'Файл превышает допустимый размер 256 КиБ.',
  errorPassword:'Нужен пароль от 12 символов, не только пробелы, не более 1024 байт UTF-8.',
  errorWorkspace:'Файл расшифрован, но не соответствует этому учебному проекту. Текущие данные не изменены.',
  errorGeneric:'Операция не выполнена. Данные не изменены; незашифрованный файл не создавался.',
  plainTitle:'CSV будет сохранён без шифрования', plainText:'Суммы и описания в CSV можно прочитать без пароля. Для защищённой копии отмените экспорт и выберите «Сохранить с паролем».',
  plainConfirm:'Сохранить обычный CSV', plainSource:'Это полный исходный набор, без учёта фильтров.', plainScope:'Будут сохранены строки текущего представления.',
  last:'Последнее действие', localProtection:'Шифрование файла · без отправки данных', version:'Интерфейс v0.2 · SEC-001'
 },
 en: {
  security:'Security', save:'Save with password', open:'Open .fcvault', title:'Protect your saved workspace',
  intro:'Encrypt the file on your device. Your password is not sent to a server.',
  status:'Local mode · synthetic fixture', whole:'The backup includes the complete fixture and view settings, not only filtered rows.',
  fileCard:'Encrypted file', fileDesc:'Transactions and view settings are stored inside .fcvault. Your password is needed to open it.',
  passwordCard:'Your password, your control', passwordDesc:'The app does not save it. A lost password cannot be recovered.',
  integrityCard:'Verify before opening', integrityDesc:'A wrong password or changed protected data is rejected. The current workspace remains unchanged.',
  boundary:'What is protected — and what is not', boundaryText:'The downloaded workspace file is encrypted. The unlocked screen, original statement and ordinary CSV exports are not. This demo fixture remains public in the application source.',
  onlyFixture:'SEC-001 supports only this synthetic fixture. No real statement import. This is not cloud sync, device-to-device E2EE or a security audit.',
  params:'File format v1', paramsText:'AES-256-GCM · PBKDF2-SHA-256 · 600,000 iterations. Each save uses fresh random salt and IV. The header is authenticated with the contents.',
  flow:'Open → calculate → encrypt → restore', flowText:'Metrics are recalculated after restoration. The app does not write passwords or data to localStorage, cookies or IndexedDB.',
  saveTitle:'Save an encrypted workspace', openTitle:'Restore from file',
  password:'Password', confirm:'Repeat password', passwordHelp:'At least 12 characters. Prefer a long unique passphrase or a random password. Spaces and letter case matter.',
  acknowledge:'I will keep the password separately: FinControl cannot recover it.',
  generate:'Generate random password', generated:'The random password is visible. Keep it in a password manager before continuing.',
  show:'Show password', hide:'Hide password', download:'Encrypt and save', restore:'Decrypt and open',
  choose:'Select a .fcvault file', chooseHelp:'Up to 256 KiB. The envelope contains only its format, encryption parameters and ciphertext.',
  cancel:'Cancel', busy:'Verifying and processing on this device…',
  saved:'Encrypted file handed to the browser for saving.', restored:'Workspace restored. Metrics recalculated.',
  fileReady:'Format recognized. The content has not been decrypted or authenticated yet.',
  noFile:'Select a .fcvault file first.', mismatch:'The passwords do not match.', ackNeeded:'Confirm that you will keep the password separately.',
  unavailable:'Secure Web Crypto is unavailable. Open the file in a supporting browser or use HTTPS / localhost. No plaintext fallback is provided.',
  errorAuth:'Cannot open: wrong password or damaged file.',
  errorFormat:'The file is damaged or its format is unsupported.', errorSize:'The file exceeds the 256 KiB limit.',
  errorPassword:'Use at least 12 characters, not only whitespace, and no more than 1024 UTF-8 bytes.',
  errorWorkspace:'Decryption succeeded, but this is not the supported demo workspace. Current data is unchanged.',
  errorGeneric:'The operation failed. Data is unchanged; no plaintext file was created.',
  plainTitle:'CSV will be saved without encryption', plainText:'Amounts and descriptions in a CSV are readable without a password. For a protected copy, cancel and choose “Save with password”.',
  plainConfirm:'Save ordinary CSV', plainSource:'This is the full original fixture, regardless of filters.', plainScope:'Only the current view’s rows will be saved.',
  last:'Last action', localProtection:'File encryption · no data upload', version:'Interface v0.2 · SEC-001'
 }
};
let activeVaultSession = null;
let vaultLastAction = '';
function vt(key) { return vaultStrings[state.lang]?.[key] || vaultStrings.ru[key] || key; }
function vaultAvailable() { return globalThis.isSecureContext !== false && !!globalThis.crypto?.subtle && !!globalThis.crypto?.getRandomValues; }
function vaultPage() {
 return `<section class="panel vault-hero"><div class="vault-emblem">${icon('lock')}</div><div><span class="tag">SEC-001 / LOCAL</span><h2>${vt('title')}</h2><p>${vt('intro')}</p><div class="vault-actions">${button('vault-save',icon('lock')+vt('save'),'btn primary')}${button('vault-open',icon('source')+vt('open'),'btn')}</div><p class="micro">${vt('whole')}</p></div></section>
 ${vaultAvailable()?'':`<div class="notice">${vt('unavailable')}</div>`}
 ${vaultLastAction?`<div class="vault-receipt" role="status"><strong>${vt('last')}:</strong> ${vt(vaultLastAction)}</div>`:''}
 <div class="vault-features">${[['lock','fileCard','fileDesc'],['key','passwordCard','passwordDesc'],['check','integrityCard','integrityDesc']].map(([i,a,b])=>`<section class="panel vault-feature">${icon(i)}<h3>${vt(a)}</h3><p>${vt(b)}</p></section>`).join('')}</div>
 <section class="panel">${panelHead(vt('flow'))}<div class="panel-body"><p class="explain">${vt('flowText')}</p><div class="vault-spec"><strong>${vt('params')}</strong><p>${vt('paramsText')}</p></div></div></section>
 <section class="vault-boundary"><h3>${vt('boundary')}</h3><p>${vt('boundaryText')}</p><p>${vt('onlyFixture')}</p></section>`;
}
function vaultErrorMessage(error) {
 return vt(({AUTH_FAILED:'errorAuth',CRYPTO_UNAVAILABLE:'unavailable',FORMAT_INVALID:'errorFormat',FORMAT_UNSUPPORTED:'errorFormat',FILE_TOO_LARGE:'errorSize',PAYLOAD_TOO_LARGE:'errorSize',PASSWORD_POLICY:'errorPassword',WORKSPACE_UNSUPPORTED:'errorWorkspace'})[error?.code] || 'errorGeneric');
}
function vaultMessage(text, error=false) {
 const box=document.getElementById('vault-message');
 if(box) { box.textContent=text;box.className='vault-message'+(error?' error':'');box.hidden=!text; }
}
function clearVaultDialog() {
 activeVaultSession=null;
 const dialog=document.getElementById('vault-dialog');
 for(const input of dialog.querySelectorAll('input')) input.value='';
 dialog.replaceChildren();
}
function closeVaultDialog() {
 const dialog=document.getElementById('vault-dialog');
 activeVaultSession=null;
 for(const input of dialog.querySelectorAll('input')) input.value='';
 if(dialog.open) dialog.close();
 dialog.replaceChildren();
}
function showVaultToast(message) {
 const box=document.getElementById('toast');box.textContent=message;box.hidden=false;
 setTimeout(()=>{box.hidden=true;box.textContent='';},5000);
}
function vaultDialog(mode) {
 const dialog=document.getElementById('vault-dialog');
 if(dialog.open) return;
 const session={mode,busy:false,fileText:null,fileSerial:0};
 activeVaultSession=session;
 const save=mode==='save';
 dialog.innerHTML=`<div class="dialog-head"><div><div class="micro">FinControl · SEC-001</div><h2 id="vault-title">${vt(save?'saveTitle':'openTitle')}</h2></div>${button('vault-close',icon('close'),'close',`type="button" aria-label="${t('close')}"`)}</div><div class="dialog-body">
 <div class="vault-inline-note">${vt('whole')}</div>
 <form id="vault-form" novalidate>
 ${save?'':`<label class="vault-label" for="vault-file">${vt('choose')}</label><input id="vault-file" type="file" accept=".fcvault,application/json" aria-describedby="vault-file-help"><p class="micro" id="vault-file-help">${vt('chooseHelp')}</p>`}
 <label class="vault-label" for="vault-password">${vt('password')}</label><input id="vault-password" type="password" autocomplete="off" spellcheck="false" autocapitalize="none" maxlength="1024" aria-describedby="vault-password-help" required>
 <p class="micro" id="vault-password-help">${vt('passwordHelp')}</p>
 ${save?`<label class="vault-label" for="vault-confirm">${vt('confirm')}</label><input id="vault-confirm" type="password" autocomplete="off" spellcheck="false" autocapitalize="none" maxlength="1024" required>`:''}
 <div class="vault-small-actions">${button('vault-show',vt('show'),'btn subtle','type="button" aria-pressed="false"')}${save?button('vault-generate',vt('generate'),'btn subtle','type="button"'):''}</div>
 ${save?`<label class="vault-ack"><input id="vault-ack" type="checkbox"><span>${vt('acknowledge')}</span></label>`:''}
 <div id="vault-message" class="vault-message" role="status" aria-live="polite" hidden></div>
 <div class="vault-form-actions">${button('vault-close',vt('cancel'),'btn','type="button"')}<button type="submit" class="btn primary" id="vault-submit">${vt(save?'download':'restore')}</button></div>
 </form><p class="micro vault-form-boundary">${vt('onlyFixture')}</p></div>`;
 dialog.showModal();
 document.getElementById('vault-form').addEventListener('submit',runVaultOperation);
 document.getElementById('vault-file')?.addEventListener('change',readVaultFile);
 if(!vaultAvailable()) {document.getElementById('vault-submit').disabled=true;vaultMessage(vt('unavailable'),true);}
 document.getElementById(save?'vault-password':'vault-file').focus();
}
async function readVaultFile(event) {
 const session=activeVaultSession;
 if(!session || session.busy) return;
 const serial=++session.fileSerial; session.fileText=null;event.target.dataset.validation='reading';
 const file=event.target.files?.[0];
 if(!file) {event.target.dataset.validation='empty';vaultMessage('');return;}
 try {
  if(file.size>FinVault.constants.MAX_FILE_BYTES) throw new FinVault.VaultError('FILE_TOO_LARGE');
  const text=await file.text();
  if(activeVaultSession!==session || serial!==session.fileSerial) return;
  FinVault.parseEnvelope(text);
  session.fileText=text;event.target.dataset.validation='ready';vaultMessage(vt('fileReady'));
 } catch(error) {if(activeVaultSession===session&&serial===session.fileSerial) {event.target.dataset.validation='invalid';vaultMessage(vaultErrorMessage(error),true);}}
}
function vaultSetBusy(busy) {
 const form=document.getElementById('vault-form');if(!form)return;
 for(const el of form.querySelectorAll('input,button:not([data-action="vault-close"])')) el.disabled=busy;
 form.setAttribute('aria-busy',String(busy));
}
async function runVaultOperation(event) {
 event.preventDefault();
 const session=activeVaultSession;
 if(!session || session.busy) return;
 let password=document.getElementById('vault-password').value;
 try {
  FinVault.validatePassword(password);
  if(session.mode==='save') {
   if(password!==document.getElementById('vault-confirm').value) {vaultMessage(vt('mismatch'),true);return;}
   if(!document.getElementById('vault-ack').checked) {vaultMessage(vt('ackNeeded'),true);return;}
  } else if(!session.fileText) {vaultMessage(vt('noFile'),true);return;}
  session.busy=true;vaultSetBusy(true);vaultMessage(vt('busy'));
  for(const input of document.querySelectorAll('#vault-form input[type="password"],#vault-form input[type="text"]')) input.value='';
  if(session.mode==='save') {
   const payload=FinWorkspace.build(D,state);
   const encrypted=await FinVault.seal(payload,password);
   if(activeVaultSession!==session || !document.getElementById('vault-dialog').open) return;
   const url=URL.createObjectURL(new Blob([encrypted],{type:'application/octet-stream'}));
   const link=document.createElement('a');link.href=url;link.download='fincontrol.fcvault';document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),2000);
   vaultLastAction='saved';closeVaultDialog();render();showVaultToast(vt('saved'));
  } else {
   const payload=await FinVault.open(session.fileText,password);
   const checked=FinWorkspace.validate(payload,D);
   const prepared=M.prepare(checked.manifest,M.parseCSV(checked.csv));
   M.calculate(prepared,checked.view.account,checked.view.period); // Complete checks before committing UI state.
   if(activeVaultSession!==session || !document.getElementById('vault-dialog').open) return;
   data=prepared;Object.assign(state,checked.view);
   vaultLastAction='restored';closeVaultDialog();render();showVaultToast(vt('restored'));
  }
 } catch(error) {
  if(activeVaultSession===session) vaultMessage(vaultErrorMessage(error),true);
 } finally {
  password=''; // Best effort; JavaScript does not guarantee string/key zeroization.
  if(activeVaultSession===session) {session.busy=false;vaultSetBusy(false);for(const input of document.querySelectorAll('#vault-form input[type="password"],#vault-form input[type="text"]'))input.value='';}
 }
}
function confirmPlainExport(filename,text,bom=true,fullSource=false) {
 const dialog=document.getElementById('vault-dialog');if(dialog.open)return;
 activeVaultSession={mode:'plain',filename,text,bom};
 dialog.innerHTML=`<div class="dialog-head"><h2 id="vault-title">${vt('plainTitle')}</h2>${button('vault-close',icon('close'),'close',`type="button" aria-label="${t('close')}"`)}</div><div class="dialog-body"><p class="explain">${vt('plainText')}</p><p class="micro">${vt(fullSource?'plainSource':'plainScope')}</p><div class="vault-form-actions">${button('vault-close',vt('cancel'),'btn','type="button"')}${button('vault-export-plain',vt('plainConfirm'),'btn primary','type="button"')}</div></div>`;
 dialog.showModal();
 dialog.querySelector('[data-action="vault-close"]').focus();
}
function handleVaultAction(action) {
 const name=action.dataset.action;
 if(name==='vault-save')vaultDialog('save');
 else if(name==='vault-open')vaultDialog('open');
 else if(name==='vault-close')closeVaultDialog();
 else if(name==='vault-show') {
  if(activeVaultSession?.busy)return true;
  const fields=[...document.querySelectorAll('#vault-password,#vault-confirm')];
  const show=fields[0]?.type==='password';fields.forEach(x=>{x.type=show?'text':'password';});
  action.textContent=vt(show?'hide':'show');action.setAttribute('aria-pressed',String(show));
 } else if(name==='vault-generate') {
  if(activeVaultSession?.busy)return true;
  try {const password=FinVault.randomPassword();for(const input of document.querySelectorAll('#vault-password,#vault-confirm')){input.type='text';input.value=password;}
   const show=document.querySelector('[data-action="vault-show"]');show.textContent=vt('hide');show.setAttribute('aria-pressed','true');vaultMessage(vt('generated'));
  } catch(error) {vaultMessage(vaultErrorMessage(error),true);}
 } else if(name==='vault-export-plain') {
  const session=activeVaultSession;if(session?.mode==='plain'){saveFile(session.filename,session.text,session.bom);closeVaultDialog();}
 } else return false;
 return true;
}
document.getElementById('vault-dialog').addEventListener('close',()=>{if(!document.getElementById('vault-dialog').open)clearVaultDialog();});
document.getElementById('vault-dialog').addEventListener('cancel',event=>{event.preventDefault();closeVaultDialog();});
