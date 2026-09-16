/* ============================================================================
   app.js — shared runtime: language, data loading, chrome, formatting.

   Pages register a render function with NM.onRender(). It runs once on load
   and again whenever the language flips, so a page re-renders from its own
   state and every string — chrome included — swaps in place.
   ========================================================================= */

(function () {
  'use strict';

  var LANG_KEY = 'nilemart-lang';
  var NM = window.NM = {};
  var renderers = [];
  var cache = {};

  /* ------------------------------------------------------------ language -- */

  function stored() {
    try {
      var v = localStorage.getItem(LANG_KEY);
      return v === 'ar' || v === 'en' ? v : null;
    } catch (e) { return null; }
  }

  NM.lang = stored() || 'en';

  NM.dict = function () { return window.I18N[NM.lang]; };

  /** Translate a key. {placeholders} are replaced from vars. */
  NM.t = function (key, vars) {
    var d = window.I18N[NM.lang];
    var s = d && d[key] !== undefined ? d[key] : window.I18N.en[key];
    if (s === undefined) return key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(vars[k]);
      });
    }
    return s;
  };

  /** Pick the Arabic field in Arabic mode, falling back to the English one.
      The build already fills empty Arabic cells, so this is belt and braces. */
  NM.pick = function (obj, field) {
    if (!obj) return '';
    if (NM.lang === 'ar') return obj[field + '_ar'] || obj[field] || '';
    return obj[field] || '';
  };

  NM.setLang = function (lang) {
    if (lang !== 'ar' && lang !== 'en') return;
    NM.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    applyLang();
    renderAll();
  };

  function applyLang() {
    var d = window.I18N[NM.lang];
    var html = document.documentElement;
    html.lang = d.htmlLang;
    html.dir = d.dir;
    document.title = NM.pageTitle ? NM.pageTitle() : document.title;
  }

  NM.onRender = function (fn) { renderers.push(fn); };

  function renderAll() {
    renderChrome();
    renderers.forEach(function (fn) {
      try { fn(); } catch (e) { console.error('render failed', e); }
    });
    NM.publishContext();
  }

  /* ------------------------------------------------------------ helpers -- */

  NM.esc = function (s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /** Bidi-isolate a data value. KB fields without an Arabic variant fall back
      to English, and inside an RTL page that needs isolating or the numbers and
      punctuation reorder. */
  NM.bidi = function (value) {
    var v = NM.esc(value);
    return v ? '<bdi>' + v + '</bdi>' : '';
  };

  NM.param = function (name) {
    return new URLSearchParams(window.location.search).get(name) || '';
  };

  /** Western digits in both languages, with thousands separators. */
  NM.number = function (n) {
    var v = Number(n) || 0;
    return v % 1 === 0
      ? v.toLocaleString('en-US')
      : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /** "EGP 68" in English, "68 جنيه" in Arabic — digits stay Western. */
  NM.moneyText = function (n) {
    var d = window.I18N[NM.lang];
    return d.currencyBefore
      ? d.currency + ' ' + NM.number(n)
      : NM.number(n) + ' ' + d.currency;
  };

  NM.money = function (n, cls) {
    var d = window.I18N[NM.lang];
    var unit = '<span class="price__unit">' + NM.esc(d.currency) + '</span>';
    var val = '<span>' + NM.number(n) + '</span>';
    return '<span class="price ' + (cls || '') + '">' +
      (d.currencyBefore ? unit + val : val + unit) + '</span>';
  };

  /** Unsplash serves the KB images; resize via the documented query params. */
  NM.img = function (url, size) {
    if (!url) return '';
    return url.replace(/([?&])w=\d+/, '$1w=' + size).replace(/([?&])h=\d+/, '$1h=' + size);
  };

  NM.slug = function (s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  /* --------------------------------------------------------------- data -- */

  /** Load one or more data files. Results are cached for the session. */
  NM.load = function (names) {
    return Promise.all(names.map(function (name) {
      if (cache[name]) return cache[name];
      cache[name] = fetch('data/' + name + '.json')
        .then(function (r) {
          if (!r.ok) throw new Error(name + ': HTTP ' + r.status);
          return r.json();
        })
        .catch(function (err) {
          delete cache[name];
          throw err;
        });
      return cache[name];
    }));
  };

  /** Standard failure panel — most often someone opened the file:// URL. */
  NM.showLoadError = function (el, err) {
    console.error(err);
    if (!el) return;
    el.innerHTML =
      '<div class="state">' +
      '<p><strong>' + NM.esc(NM.t('loadError')) + '</strong></p>' +
      '<p>' + NM.esc(NM.t('loadErrorHint')) + '</p>' +
      '<p><code>python3 -m http.server 8000</code></p>' +
      '</div>';
  };

  /* -------------------------------------------------------- offer window -- */

  /** An offer renders only if it is active and has not run out.
      Both conditions matter: the knowledge base deliberately carries one
      expired row and one scheduled row to prove the filter works. */
  NM.isOfferLive = function (offer, now) {
    if (!offer || offer.status !== 'active') return false;
    var today = now || new Date();
    var end = offer.end_date ? new Date(offer.end_date + 'T23:59:59') : null;
    var start = offer.start_date ? new Date(offer.start_date + 'T00:00:00') : null;
    if (end && !isNaN(end) && end < today) return false;
    if (start && !isNaN(start) && start > today) return false;
    return true;
  };

  NM.liveOffers = function (offers) {
    var now = new Date();
    return (offers || []).filter(function (o) { return NM.isOfferLive(o, now); });
  };

  NM.formatDate = function (iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(NM.lang === 'ar' ? 'ar-EG' : 'en-GB',
      { day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn' });
  };

  /* ------------------------------------------------------------- chrome -- */

  var ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.2l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.25L20.6 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  };
  NM.icon = function (n) { return ICONS[n] || ''; };

  var NAV_SECONDARY = [
    { href: 'offers.html', key: 'navOffers', cls: 'is-offer' },
    { href: 'bundles.html', key: 'navBundles' },
    { href: 'stores.html', key: 'navStores' },
    { href: 'faq.html', key: 'navFaq' },
    { href: 'track.html', key: 'navTrack' },
  ];

  function here() {
    var p = window.location.pathname.split('/').pop();
    return p || 'index.html';
  }

  function renderChrome() {
    var d = window.I18N[NM.lang];
    var page = here();

    var utilityLinks = NAV_SECONDARY.map(function (n) {
      return '<a href="' + n.href + '">' + NM.esc(NM.t(n.key)) + '</a>';
    }).join('');

    var head = document.getElementById('site-header');
    if (head) {
      var logo = NM.lang === 'ar'
        ? 'assets/nilemart-logo-horizontal-ar.svg'
        : 'assets/nilemart-logo-horizontal.svg';

      head.innerHTML =
        '<a class="skip-link" href="#main">' + NM.esc(NM.t('skipToContent')) + '</a>' +
        '<div class="utility"><div class="wrap">' +
          '<nav class="utility__note" aria-label="' + NM.esc(NM.t('navPolicies')) + '">' +
            '<span style="display:flex;gap:16px">' + utilityLinks + '</span>' +
          '</nav>' +
          '<a href="tel:16770" class="utility__hot">' +
            NM.esc(NM.t('hotlineLabel')) + ' ' + NM.esc(NM.t('hotline')) +
          '</a>' +
          '<button class="lang-toggle" type="button" data-lang-toggle ' +
            'aria-label="' + NM.esc(d.otherLangName) + '">' +
            NM.esc(d.otherLangLabel) +
          '</button>' +
        '</div></div>' +

        '<div class="header"><div class="wrap header__bar">' +
          '<a class="header__logo" href="index.html">' +
            '<img src="' + logo + '" alt="' + NM.esc(NM.t('brandName')) + '" width="180" height="40">' +
          '</a>' +
          '<div class="header__search">' +
            '<span class="search-icon">' + ICONS.search + '</span>' +
            '<label class="visually-hidden" for="nm-search">' + NM.esc(NM.t('searchLabel')) + '</label>' +
            '<input id="nm-search" class="search-field" type="search" autocomplete="off" ' +
              'placeholder="' + NM.esc(NM.t('searchPlaceholder')) + '" data-global-search>' +
          '</div>' +
          '<div class="header__actions">' +
            '<a class="icon-btn cart-btn" href="cart.html">' + ICONS.cart +
              '<span class="cart-count" data-cart-count hidden>0</span>' +
              '<span class="icon-btn__label">' + NM.esc(NM.t('cart')) + '</span>' +
            '</a>' +
          '</div>' +
        '</div></div>' +

        '<nav class="catnav" aria-label="' + NM.esc(NM.t('navCategories')) + '">' +
          '<div class="wrap"><div class="catnav__list" data-catnav></div></div>' +
        '</nav>';

      head.querySelector('[data-lang-toggle]').addEventListener('click', function () {
        NM.setLang(NM.lang === 'ar' ? 'en' : 'ar');
      });

      var search = head.querySelector('[data-global-search]');
      if (search) {
        search.value = NM.searchTerm || '';
        search.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          var q = search.value.trim();
          window.location.href = q
            ? 'category.html?c=all&q=' + encodeURIComponent(q)
            : 'category.html?c=all';
        });
      }

      renderCatnav(page);
    }

    var foot = document.getElementById('site-footer');
    if (foot) renderFooter(foot, page);

    NM.refreshCartCount();
  }

  function renderCatnav(page) {
    var holder = document.querySelector('[data-catnav]');
    if (!holder) return;
    var activeSlug = NM.activeCategory || '';

    NM.load(['products']).then(function (res) {
      var cats = res[0].categories;
      var html = cats.map(function (c) {
        var on = page === 'category.html' && activeSlug === c.slug;
        return '<a href="category.html?c=' + encodeURIComponent(c.slug) + '"' +
          (on ? ' aria-current="page"' : '') + '>' +
          NM.esc(NM.lang === 'ar' ? c.name_ar : c.name) + '</a>';
      }).join('');

      // Secondary links ride along on narrow screens, where the utility bar hides.
      html += NAV_SECONDARY.map(function (n) {
        return '<a class="is-secondary ' + (n.cls || '') + '" href="' + n.href + '"' +
          (page === n.href ? ' aria-current="page"' : '') + '>' +
          NM.esc(NM.t(n.key)) + '</a>';
      }).join('');

      holder.innerHTML = html;
    }).catch(function () { /* nav is non-critical */ });
  }

  function renderFooter(foot, page) {
    var policies = [
      ['company-profile', 'Company profile'],
      ['delivery', 'Delivery & shipping'],
      ['returns-refunds', 'Returns & refunds'],
      ['payment', 'Payment & billing'],
      ['loyalty', 'Nile Points loyalty'],
      ['privacy', 'Privacy & data'],
    ];

    // Policy titles come from the data file so they are never hard-coded here.
    NM.load(['policies']).then(function (res) {
      var docs = res[0];
      var links = docs.map(function (doc) {
        var label = NM.lang === 'ar'
          ? (doc.title_ar || doc.title).replace(/^[^—-]*[—-]\s*/, '')
          : doc.label;
        return '<li><a href="policies.html?p=' + encodeURIComponent(doc.slug) + '">' +
          NM.esc(label) + '</a></li>';
      }).join('');
      var slot = foot.querySelector('[data-policy-links]');
      if (slot) slot.innerHTML = links;
    }).catch(function () {
      var slot = foot.querySelector('[data-policy-links]');
      if (slot) {
        slot.innerHTML = policies.map(function (p) {
          return '<li><a href="policies.html?p=' + p[0] + '">' + NM.esc(p[1]) + '</a></li>';
        }).join('');
      }
    });

    var methods = NM.t('footerPaymentList').split('·').map(function (m) {
      return '<li>' + NM.esc(m.trim()) + '</li>';
    }).join('');

    var shopLinks = [
      ['offers.html', 'navOffers'],
      ['bundles.html', 'navBundles'],
      ['stores.html', 'navStores'],
      ['cart.html', 'cart'],
    ].map(function (l) {
      return '<li><a href="' + l[0] + '">' + NM.esc(NM.t(l[1])) + '</a></li>';
    }).join('');

    var helpLinks = [
      ['faq.html', 'navFaq'],
      ['track.html', 'navTrack'],
    ].map(function (l) {
      return '<li><a href="' + l[0] + '">' + NM.esc(NM.t(l[1])) + '</a></li>';
    }).join('');

    foot.innerHTML =
      '<div class="wrap">' +
        '<div class="footer__grid">' +
          '<div>' +
            '<img class="footer__logo" src="assets/nilemart-logo-horizontal-mono-white.svg" ' +
              'alt="' + NM.esc(NM.t('brandName')) + '" width="190" height="38">' +
            '<p class="footer__tagline">' + NM.esc(NM.t('tagline')) + '</p>' +
            '<p class="footer__small">' + NM.esc(NM.t('footerBranches')) + '</p>' +
          '</div>' +
          '<div><h3>' + NM.esc(NM.t('footerShop')) + '</h3><ul>' + shopLinks + '</ul></div>' +
          '<div><h3>' + NM.esc(NM.t('footerPolicies')) + '</h3>' +
            '<ul data-policy-links></ul></div>' +
          '<div><h3>' + NM.esc(NM.t('footerContact')) + '</h3>' +
            '<div class="footer__contact">' +
              '<a class="footer__hot" href="tel:16770">' + NM.esc(NM.t('hotline')) +
                '<span>' + NM.esc(NM.t('hotlineLabel')) + '</span></a>' +
              '<p class="footer__small">' + NM.esc(NM.t('footerHotlineNote')) + '</p>' +
              '<a href="mailto:care@nilemart.com.eg">' + NM.esc(NM.t('email')) + '</a>' +
            '</div>' +
            '<ul style="margin-block-start:14px">' + helpLinks + '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="footer__pay">' +
          '<h3>' + NM.esc(NM.t('footerPayment')) + '</h3>' +
          '<ul class="footer__methods">' + methods + '</ul>' +
          '<p class="footer__demo">' + NM.esc(NM.t('footerDemo')) + '</p>' +
        '</div>' +
      '</div>';
  }

  NM.refreshCartCount = function () {
    var n = window.Cart ? window.Cart.count() : 0;
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = NM.number(n);
      el.hidden = n === 0;
    });
    NM.publishContext();
  };

  /* ----------------------------------------------------------- context -- */

  /** Page facts the chat widget can read. Kept a plain object on purpose. */
  NM.context = {};

  NM.setContext = function (partial) {
    Object.keys(partial || {}).forEach(function (k) { NM.context[k] = partial[k]; });
    NM.publishContext();
  };

  NM.publishContext = function () {
    if (typeof window.buildNilemartContext === 'function') window.buildNilemartContext();
  };

  /* -------------------------------------------------------------- start -- */

  NM.start = function () {
    applyLang();
    renderAll();
  };

  document.addEventListener('DOMContentLoaded', function () {
    // cart.js and the page controller register before this fires
    NM.start();
  });
})();
