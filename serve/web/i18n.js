// serve/web/i18n.js - the tiny i18n runtime. Loaded last of the three i18n scripts.
// Dictionaries live in window.STRATA_I18N["en"] / ["zh-CN"] (i18n.en.js, i18n.zh-CN.js).
// Public API: window.StrataI18N = {lang, available, t, apply, setLang, onChange}.
"use strict";
(function () {
  var DICTS = window.STRATA_I18N = window.STRATA_I18N || {};
  var available = ["en", "zh-CN"];
  var STORAGE_KEY = "strata.lang";

  function readStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function writeStored(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* private mode: in memory only */ }
  }
  function detect() {
    var saved = readStored();
    if (available.indexOf(saved) >= 0) return saved;
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    return String(nav).toLowerCase().indexOf("zh") === 0 ? "zh-CN" : "en";
  }

  var lang = detect();

  // the dictionary string for the current language; en is the fallback, then the key itself
  function t(key, vars) {
    var dict = DICTS[lang] || {};
    var s = dict[key];
    if (s == null) s = (DICTS.en || {})[key];
    if (s == null) s = key;
    if (vars) {
      s = String(s).replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] != null ? String(vars[name]) : m;
      });
    }
    return s;
  }

  function updateButton() {
    var b = document.getElementById("lang-btn");
    if (!b) return;
    var other = available.filter(function (l) { return l !== lang; })[0];
    b.textContent = other ? t("lang.short." + other) : "";
  }
  function wireButton() {
    var b = document.getElementById("lang-btn");
    if (!b || b.dataset.i18nWired) return;
    b.dataset.i18nWired = "1";
    b.addEventListener("click", function () {
      var other = available.filter(function (l) { return l !== lang; })[0];
      if (other) setLang(other);
    });
  }

  function apply(root) {
    root = root || document;
    document.documentElement.lang = lang;
    var els = root.querySelectorAll("[data-i18n],[data-i18n-html],[data-i18n-title],[data-i18n-placeholder],[data-i18n-aria]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute("data-i18n");
      if (key != null) el.textContent = t(key);
      var html = el.getAttribute("data-i18n-html");
      if (html != null) el.innerHTML = t(html);
      var title = el.getAttribute("data-i18n-title");
      if (title != null) el.setAttribute("title", t(title));
      var ph = el.getAttribute("data-i18n-placeholder");
      if (ph != null) el.setAttribute("placeholder", t(ph));
      var aria = el.getAttribute("data-i18n-aria");
      if (aria != null) el.setAttribute("aria-label", t(aria));
    }
    updateButton();
    wireButton();
  }

  function setLang(l) {
    if (available.indexOf(l) < 0) return;
    writeStored(l);
    lang = l;
    api.lang = l;
    apply();
    document.dispatchEvent(new CustomEvent("strata:lang", {detail: l}));
  }

  function onChange(cb) { document.addEventListener("strata:lang", cb); }

  var api = {lang: lang, available: available, t: t, apply: apply, setLang: setLang, onChange: onChange};
  window.StrataI18N = api;

  apply();                                          // the static HTML above is already parsed
  document.addEventListener("DOMContentLoaded", function () { apply(); });
})();
