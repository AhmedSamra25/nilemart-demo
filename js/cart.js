/* ============================================================================
   cart.js — basket state, held in localStorage.

   Delivery fees follow the published delivery policy (section 2): Same-day and
   Next-day are free at EGP 1,200 or more after discounts, and the Express fee
   is never waived by basket value — only by Platinum tier or a named campaign.
   ========================================================================= */

(function () {
  'use strict';

  var KEY = 'nilemart-cart';

  var SPEEDS = [
    { id: 'express', fee: 79, labelKey: 'promiseExpress', freeOverThreshold: false },
    { id: 'sameday', fee: 45, labelKey: 'promiseSameDay', freeOverThreshold: true },
    { id: 'nextday', fee: 29, labelKey: 'promiseNextDay', freeOverThreshold: true },
  ];

  var FREE_THRESHOLD = 1200;
  var MIN_BASKET = 150;

  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(raw) ? raw.filter(function (l) { return l && l.h; }) : [];
    } catch (e) { return []; }
  }

  function write(lines) {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) {}
    if (window.NM && window.NM.refreshCartCount) window.NM.refreshCartCount();
  }

  var Cart = window.Cart = {
    SPEEDS: SPEEDS,
    FREE_THRESHOLD: FREE_THRESHOLD,
    MIN_BASKET: MIN_BASKET,

    lines: read,

    count: function () {
      return read().reduce(function (n, l) { return n + (Number(l.q) || 0); }, 0);
    },

    qty: function (handle) {
      var line = read().filter(function (l) { return l.h === handle; })[0];
      return line ? Number(line.q) || 0 : 0;
    },

    add: function (handle, qty) {
      var lines = read();
      var n = Math.max(1, Number(qty) || 1);
      var found = lines.filter(function (l) { return l.h === handle; })[0];
      if (found) found.q = (Number(found.q) || 0) + n;
      else lines.push({ h: handle, q: n });
      write(lines);
      return Cart.qty(handle);
    },

    /** Adds several handles at once — used by the bundle "add the whole kit". */
    addMany: function (handles) {
      var lines = read();
      (handles || []).forEach(function (h) {
        if (!h) return;
        var found = lines.filter(function (l) { return l.h === h; })[0];
        if (found) found.q = (Number(found.q) || 0) + 1;
        else lines.push({ h: h, q: 1 });
      });
      write(lines);
    },

    setQty: function (handle, qty) {
      var n = Number(qty) || 0;
      var lines = read();
      if (n <= 0) {
        lines = lines.filter(function (l) { return l.h !== handle; });
      } else {
        var found = lines.filter(function (l) { return l.h === handle; })[0];
        if (found) found.q = n;
        else lines.push({ h: handle, q: n });
      }
      write(lines);
    },

    remove: function (handle) { Cart.setQty(handle, 0); },

    clear: function () { write([]); },

    /** Resolve stored handles against the catalogue, dropping unknown lines. */
    detailed: function (products) {
      var byHandle = {};
      (products || []).forEach(function (p) { byHandle[p.handle] = p; });
      return read().map(function (l) {
        var p = byHandle[l.h];
        if (!p) return null;
        return { product: p, qty: Number(l.q) || 0, line: (Number(p.price) || 0) * (Number(l.q) || 0) };
      }).filter(Boolean);
    },

    subtotal: function (rows) {
      return (rows || []).reduce(function (s, r) { return s + r.line; }, 0);
    },

    speed: function (id) {
      return SPEEDS.filter(function (s) { return s.id === id; })[0] || SPEEDS[1];
    },

    /** Fee for a speed at a given subtotal, applying the policy's exception. */
    deliveryFee: function (speedId, subtotal) {
      var s = Cart.speed(speedId);
      if (s.freeOverThreshold && subtotal >= FREE_THRESHOLD) return 0;
      return s.fee;
    },
  };
})();
