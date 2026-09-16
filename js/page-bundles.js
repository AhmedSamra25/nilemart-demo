/* ============================================================================
   page-bundles.js — the 12 recipe kits and household bundles.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;
  var root = document.querySelector('[data-bundles]');
  var bundles = [];
  var products = [];
  var kind = 'all';

  NM.pageTitle = function () { return NM.t('bundlesTitle') + ' — ' + NM.t('brandName'); };

  function filterBar() {
    return '<div class="topicnav">' + [
      ['all', 'kindAll'],
      ['recipe', 'kindRecipe'],
      ['bundle', 'kindBundle'],
    ].map(function (k) {
      return '<button type="button" data-kind="' + k[0] + '" ' +
        'aria-pressed="' + (kind === k[0]) + '">' + NM.esc(NM.t(k[1])) + '</button>';
    }).join('') + '</div>';
  }

  function render() {
    if (!root) return;

    var live = bundles.filter(function (b) {
      if (b.status !== 'active') return false;
      return kind === 'all' || b.kind === kind;
    });

    root.innerHTML =
      '<div class="wrap page-head">' +
        '<h1>' + NM.esc(NM.t('bundlesTitle')) +
          '<span class="section-head__alt">' +
            NM.esc(window.I18N[NM.lang === 'ar' ? 'en' : 'ar'].bundlesTitle) + '</span>' +
        '</h1>' +
        '<p>' + NM.esc(NM.t('bundlesLead')) + '</p>' +
      '</div>' +
      '<div class="wrap section section--flush page-end">' +
        filterBar() +
        '<div class="grid-bundles">' + live.map(NM.bundleCard).join('') + '</div>' +
      '</div>';

    root.querySelectorAll('[data-kind]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        kind = btn.dataset.kind;
        render();
      });
    });

    NM.bindAddBundle(root, bundles, NM.handleBySku(products));
  }

  NM.onRender(render);
  NM.setContext({ page: 'bundles' });

  NM.load(['bundles', 'products'])
    .then(function (res) {
      bundles = res[0];
      products = res[1].products;
      document.title = NM.pageTitle();
      render();
    })
    .catch(function (err) { NM.showLoadError(root, err); });
})();
