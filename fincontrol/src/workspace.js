/* SEC-001 workspace contract. Only the pinned public synthetic fixture is supported.
 * A valid encryption tag authenticates the file, not arbitrary financial semantics.
 */
(function (root) {
  'use strict';
  const FORMAT = 'FinControl.workspace';
  const VERSION = 1;
  const allowed = {
    lang: ['ru', 'en'], view: ['overview', 'transactions', 'reconciliation', 'sources', 'security'],
    account: ['all', 'checking', 'savings', 'card'], period: ['full', 'first', 'last'],
    kind: ['all', 'income', 'expense', 'refund', 'own_transfer', 'card_repayment', 'pending']
  };
  const fail = () => { const error = new Error('WORKSPACE_UNSUPPORTED'); error.code = 'WORKSPACE_UNSUPPORTED'; throw error; };
  function exactKeys(value, keys) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) &&
      Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));
  }
  function cleanView(value) {
    if (!exactKeys(value, [...Object.keys(allowed), 'search'])) fail();
    for (const [key, values] of Object.entries(allowed)) if (!values.includes(value[key])) fail();
    if (typeof value.search !== 'string' || value.search.length > 200 || /[\u0000-\u001f\u007f]/.test(value.search)) fail();
    return Object.fromEntries([...Object.keys(allowed), 'search'].map(k => [k, value[k]]));
  }
  function build(demo, view) {
    return {format: FORMAT, version: VERSION, synthetic: true,
      source_commit: demo.provenance.commit,
      dataset: {manifest: structuredClone(demo.manifest), csv: demo.csv}, view: cleanView(view)};
  }
  function validate(value, demo) {
    if (!exactKeys(value, ['format', 'version', 'synthetic', 'source_commit', 'dataset', 'view']) ||
        value.format !== FORMAT || value.version !== VERSION || value.synthetic !== true ||
        value.source_commit !== demo.provenance.commit || !exactKeys(value.dataset, ['manifest', 'csv'])) fail();
    // Do not trust a caller-supplied hash or `synthetic:true` flag to admit new financial data.
    if (value.dataset.csv !== demo.csv || JSON.stringify(value.dataset.manifest) !== JSON.stringify(demo.manifest)) fail();
    const view = cleanView(value.view);
    return {manifest: structuredClone(demo.manifest), csv: demo.csv, view};
  }
  const api = Object.freeze({build, validate});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.defineProperty(root, 'FinWorkspace', {value: api, writable: false, configurable: false});
})(globalThis);
