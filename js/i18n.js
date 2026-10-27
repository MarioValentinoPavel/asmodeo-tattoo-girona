// Idiomas ES (texto del HTML) / CA (window.I18N_CA) / EN (window.I18N_EN).
// data-i18n="clave" cambia el contenido; data-i18n-attr="aria-label:clave;alt:clave2" cambia atributos.
// Guarda la elección (?lang=ca, localStorage) y avisa con el evento "langchange".
(() => {
  const site = document.currentScript?.dataset.site || 'web';
  const KEY = site + '-lang';
  const LANGS = ['es', 'ca', 'en'];
  const D = { ca: window.I18N_CA || {}, en: window.I18N_EN || {} };
  const orig = new Map();
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const load = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const pick = (lang, k, fallback) => (D[lang] && D[lang][k] != null ? D[lang][k] : fallback);

  function apply(lang) {
    if (!LANGS.includes(lang)) lang = 'es';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (!orig.has(el)) orig.set(el, el.innerHTML);
      el.innerHTML = pick(lang, el.dataset.i18n, orig.get(el));
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, k] = pair.split(':').map((s) => s.trim());
        const ok = 'i18nOrig' + attr.replace(/(^|-)./g, (m) => m.slice(-1).toUpperCase());
        if (el.dataset[ok] == null) el.dataset[ok] = el.getAttribute(attr) || '';
        el.setAttribute(attr, pick(lang, k, el.dataset[ok]));
      });
    });
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    store(KEY, lang);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
  const start = new URLSearchParams(location.search).get('lang') || load(KEY) || (nav === 'ca' ? 'ca' : nav === 'es' ? 'es' : 'en');
  const cur = () => document.documentElement.lang;
  window.I18N = { set: apply, get: cur, t: (es, ca, en) => (cur() === 'ca' ? ca : cur() === 'en' ? en : es) };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (b) { e.preventDefault(); apply(b.dataset.lang); } });
  const go = () => apply(start);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
