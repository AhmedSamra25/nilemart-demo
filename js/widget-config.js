/* ============================================================================
   widget-config.js — page context for the Tactful AI chat widget.

   Publishes a plain object the widget snippet can read once it is installed:

       window.NILEMART_CONTEXT = {
         page, language, category, productHandle, cartItemCount
       }

   It is rebuilt whenever the language flips, the cart changes, or a page
   resolves which category or product it is showing. No Tactful API is called
   from here — nothing is wired up yet, this only makes the facts available.

   Loaded on every page, after cart.js and the page controller.
   ========================================================================= */

(function () {
  'use strict';

  function pageName() {
    var file = window.location.pathname.split('/').pop() || 'index.html';
    return file.replace(/\.html$/, '') || 'index';
  }

  window.buildNilemartContext = function () {
    var ctx = (window.NM && window.NM.context) || {};

    window.NILEMART_CONTEXT = {
      page: ctx.page || pageName(),
      language: (window.NM && window.NM.lang) || 'en',
      category: ctx.category || null,
      productHandle: ctx.productHandle || null,
      cartItemCount: window.Cart ? window.Cart.count() : 0,
    };

    return window.NILEMART_CONTEXT;
  };

  window.buildNilemartContext();
})();
