/* Fixture-only presentation adapter, not the FIN-001 engine. No networking or writes.
 * Money is computed in integer minor units with BigInt. Only the bundled synthetic
 * fixture is supported; this module is not a production statement importer.
 */
(function(root) {
'use strict';
function parseMoney(value) {
  if (!/^-?\d+\.\d{2}$/.test(value)) throw Error('Invalid RUB amount');
  const sign = value.startsWith('-') ? -1n : 1n;
  const clean = value.replace('-','');
  return sign * BigInt(clean.replace('.',''));
}
function parseCSV(text) {
  // Deliberately restricted to this unquoted fixture; never presented as CSV import.
  const lines = text.trim().split(/\r?\n/), headers = lines.shift().split(',');
  return lines.map((line,i) => {
    const values=line.split(',');
    if(values.length!==headers.length) throw Error('Unexpected fixture CSV shape');
    const row=Object.fromEntries(headers.map((h,j)=>[h,values[j]]));
    if(row.source!=='synthetic'||row.currency!=='RUB') throw Error('Only synthetic RUB fixture supported');
    return {...row,minor:parseMoney(row.amount),source_row:i+2};
  });
}
function prepare(manifest, raw) {
  if(!manifest.synthetic || !manifest.trusted_fixture_semantics) throw Error('Synthetic fixture required');
  const seen=new Map(), rows=[], duplicates=[];
  for(const r of raw) {
    const key=JSON.stringify([r.source,r.account_id,r.provider_transaction_id]);
    if(seen.has(key)) {
      const prior=seen.get(key);
      for(const name of ['booked_at','status','amount','currency','kind','link_ref','replaces_id','description'])
        if(prior[name]!==r[name]) throw Error('IDENTITY_CONFLICT');
      duplicates.push(r); continue;
    }
    seen.set(key,r); rows.push(r);
  }
  const accounts=new Map(manifest.accounts.map(a=>[a.account_id,a]));
  const groups=new Map();
  for(const r of rows.filter(r=>r.status==='posted'&&['own_transfer','card_repayment'].includes(r.kind))) {
    const key=JSON.stringify([r.kind,r.link_ref]);
    const g=groups.get(key)||[];g.push(r);groups.set(key,g);
  }
  for(const g of groups.values()) {
    const [a,b]=g;
    if(g.length!==2 || !a.link_ref || a.account_id===b.account_id || a.currency!==b.currency ||
       a.minor+b.minor!==0n || accounts.get(a.account_id).owner_id!==accounts.get(b.account_id).owner_id)
      throw Error('Unreconciled fixture movement');
    const types=[accounts.get(a.account_id).type,accounts.get(b.account_id).type];
    if(a.kind==='own_transfer'&&!types.every(t=>t==='depository')) throw Error('Invalid transfer types');
    if(a.kind==='card_repayment'&&!(types.includes('credit')&&types.includes('depository'))) throw Error('Invalid repayment types');
  }
  const totals=new Map();
  for(const r of rows.filter(r=>r.kind==='refund'&&r.status==='posted')) {
    const target=rows.find(t=>t.source===r.source&&t.account_id===r.account_id&&t.provider_transaction_id===r.link_ref&&t.kind==='expense'&&t.status==='posted'&&t.currency===r.currency);
    const used=(totals.get(r.link_ref)||0n)+r.minor;
    if(!target || r.minor<0n || used > -target.minor) throw Error('Unresolved fixture refund');
    totals.set(r.link_ref,used);
  }
  for(const a of manifest.accounts) {
    const delta=rows.filter(r=>r.account_id===a.account_id&&r.status==='posted').reduce((s,r)=>s+r.minor,0n);
    if(BigInt(a.opening_signed_balance_minor)+delta!==BigInt(a.closing_signed_balance_minor)) throw Error('Fixture balance mismatch');
  }
  return {manifest,raw,rows,duplicates,groups,accounts};
}
const periods={
  full:{from:'2026-08-01T00:00:00Z',to:'2026-09-01T00:00:00Z'},
  first:{from:'2026-08-01T00:00:00Z',to:'2026-08-16T00:00:00Z'},
  last:{from:'2026-08-16T00:00:00Z',to:'2026-09-01T00:00:00Z'}
};
function calculate(data, account='all',period='full') {
  const range=periods[period]; if(!range) throw Error('Unknown period');
  const selected=data.manifest.accounts.filter(a=>account==='all'||a.account_id===account);
  if(!selected.length) throw Error('Unknown account');
  const ids=new Set(selected.map(a=>a.account_id));
  const inScope=r=>ids.has(r.account_id)&&r.booked_at>=range.from&&r.booked_at<range.to;
  const rows=data.rows.filter(inScope),posted=rows.filter(r=>r.status==='posted');
  const income=posted.filter(r=>r.kind==='income');
  const expenses=posted.filter(r=>r.kind==='expense');
  const refunds=posted.filter(r=>r.kind==='refund');
  const cashRows=posted.filter(r=>data.accounts.get(r.account_id).type==='depository');
  const sum=xs=>xs.reduce((s,r)=>s+r.minor,0n);
  const m={income_minor:sum(income),gross_spending_minor:-sum(expenses),attributable_refunds_minor:sum(refunds),cash_movement_minor:sum(cashRows)};
  m.net_spending_minor=m.gross_spending_minor-m.attributable_refunds_minor;
  m.economic_surplus_minor=m.income_minor-m.net_spending_minor;
  const full=period==='full';
  const cashAccounts=selected.filter(a=>a.type==='depository');
  const creditAccounts=selected.filter(a=>a.type==='credit');
  m.opening_cash_minor=full?cashAccounts.reduce((s,a)=>s+BigInt(a.opening_signed_balance_minor),0n):null;
  m.closing_cash_minor=full?cashAccounts.reduce((s,a)=>s+BigInt(a.closing_signed_balance_minor),0n):null;
  m.closing_liability_minor=full?creditAccounts.reduce((s,a)=>s+(BigInt(a.closing_signed_balance_minor)<0n?-BigInt(a.closing_signed_balance_minor):0n),0n):null;
  m.closing_net_assets_minor=full?m.closing_cash_minor-m.closing_liability_minor:null;
  const visibleGroups=[...data.groups.values()].filter(g=>g.some(inScope));
  const counts={observations:data.raw.filter(inScope).length,unique_transactions:rows.length,posted_transactions:posted.length,pending_transactions:rows.filter(r=>r.status==='pending').length,duplicate_observations:data.duplicates.filter(inScope).length,reconciled_movement_groups:visibleGroups.length};
  const daily=[];let running=0n;
  for(let time=Date.parse(range.from);time<Date.parse(range.to);time+=86400000) {
    const day=new Date(time).toISOString().slice(0,10);
    running+=sum(cashRows.filter(r=>r.booked_at.startsWith(day)));
    daily.push({day,value_minor:running.toString()});
  }
  const categories=expenses.map(r=>{
    const returns=refunds.filter(t=>t.link_ref===r.provider_transaction_id);
    return {id:r.provider_transaction_id,minor:-r.minor-sum(returns),rows:[r,...returns]};
  });
  return {metrics:m,rows,posted,income,expenses,refunds,cashRows,selected,visibleGroups,counts,daily,categories,period,account,range,full};
}
function filterTable(snapshot,kind='all',search='') {
 const q=search.trim().toLowerCase();
 return snapshot.rows.filter(r=>(kind==='all'||(kind==='pending'?r.status==='pending':r.kind===kind))&&
  (!q||[r.description,r.provider_transaction_id,r.account_id,r.kind,r.amount].some(v=>v.toLowerCase().includes(q))));
}
function csvExport(rows) {
 const headers=['source','account_id','provider_transaction_id','booked_at','status','amount','currency','kind','link_ref'];
 const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';
 return headers.join(',')+'\r\n'+rows.map(r=>headers.map(h=>quote(r[h])).join(',')).join('\r\n')+'\r\n';
}
const api={parseMoney,parseCSV,prepare,calculate,filterTable,csvExport,periods};
if(typeof module!=='undefined'&&module.exports) module.exports=api;
else root.FinModel=api;
})(typeof window!=='undefined'?window:globalThis);
