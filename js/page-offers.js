/* ============================================================================
   page-offers.js — live campaigns only.

   The knowledge base deliberately carries one expired row (OFF-015) and one
   scheduled row (OFF-012). If either appears here the status filter is broken.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;
  var root = document.querySelector('[data-offers]');
  var offers = [];
  var categoryAr = {};   // English category name -> the KB's Arabic name

  NM.pageTitle = function () { return NM.t('offersTitle') + ' — ' + NM.t('brandName'); };

  function fact(labelKey, value) {
    if (!value && value !== 0) return '';
    return '<div class="offer__fact">' +
      '<dt>' + NM.esc(NM.t(labelKey)) + '</dt>' +
      '<dd>' + NM.bidi(value) + '</dd>' +
    '</div>';
  }

  /** The offers sheet names its scope in English only. Where that names one of
      the eight catalogue categories, show the KB's own Arabic name for it. */
  function scopeLabel(o) {
    var raw = o.category || o.scope || '';
    if (NM.lang === 'ar') {
      if (categoryAr[raw]) return categoryAr[raw];
      if (raw === 'All') return NM.t('scopeAll');
      if (raw === 'Multiple') return NM.t('scopeMultiple');
    }
    return raw;
  }

  function card(o) {
    var tier = o.tier_restriction && o.tier_restriction !== 'All'
      ? o.tier_restriction.split(',').join(' · ')
      : NM.t('tierAll');

    var code = o.promo_code
      ? '<div class="offer__code">' +
          '<div>' +
            '<small>' + NM.esc(NM.t('promoCode')) + '</small><br>' +
            '<strong>' + NM.esc(o.promo_code) + '</strong>' +
          '</div>' +
          '<button class="offer__copy" type="button" data-copy="' + NM.esc(o.promo_code) + '">' +
            NM.esc(NM.t('copyCode')) + '</button>' +
        '</div>'
      : '<p class="chip chip--quiet offer__nocode">' +
          NM.esc(NM.t('noPromoCode')) + '</p>';

    return '' +
      '<article class="offer" id="' + NM.esc(o.id) + '">' +
        '<h3>' + NM.esc(NM.pick(o, 'name')) + '</h3>' +
        '<p class="offer__desc">' + NM.esc(NM.pick(o, 'description')) + '</p>' +
        code +
        '<dl class="offer__facts">' +
          fact('offerScope', scopeLabel(o)) +
          fact('runsUntil', NM.formatDate(o.end_date)) +
          fact('startedOn', NM.formatDate(o.start_date)) +
          fact('tierRestriction', tier) +
          (o.min_basket_egp ? fact('minBasket', NM.moneyText(o.min_basket_egp)) : '') +
          fact('usageLimit', o.usage_limit_per_customer) +
          fact('channels', (o.channels || []).join(' · ')) +
        '</dl>' +
        (NM.pick(o, 'terms')
          ? '<p class="offer__terms">' + NM.esc(NM.pick(o, 'terms')) + '</p>'
          : '') +
      '</article>';
  }

  function render() {
    if (!root) return;
    var live = NM.liveOffers(offers);

    var body = live.length
      ? '<div class="grid-offers">' + live.map(card).join('') + '</div>'
      : '<div class="empty">' +
          '<img src="assets/nilemart-logo-stacked.svg" alt="">' +
          '<h2>' + NM.esc(NM.t('noOffers')) + '</h2>' +
          '<p>' + NM.esc(NM.t('noOffersHint')) + '</p>' +
        '</div>';

    root.innerHTML =
      '<div class="wrap page-head">' +
        '<h1>' + NM.esc(NM.t('offersTitle')) +
          '<span class="section-head__alt">' +
            NM.esc(window.I18N[NM.lang === 'ar' ? 'en' : 'ar'].offersTitle) + '</span>' +
        '</h1>' +
        '<p>' + NM.esc(NM.t('offersLead')) + '</p>' +
      '</div>' +
      '<div class="wrap section section--flush page-end">' + body + '</div>';

    root.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.dataset.copy;
        var done = function () {
          btn.textContent = NM.t('codeCopied');
          window.setTimeout(function () { btn.textContent = NM.t('copyCode'); }, 1400);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(done, function () {});
        }
      });
    });

    // Deep links from the home strip land on a specific campaign.
    if (window.location.hash) {
      var target = root.querySelector(window.location.hash);
      if (target) target.scrollIntoView({ block: 'center' });
    }
  }

  NM.onRender(render);
  NM.setContext({ page: 'offers' });

  NM.load(['offers', 'products'])
    .then(function (res) {
      offers = res[0];
      res[1].categories.forEach(function (c) { categoryAr[c.name] = c.name_ar; });
      document.title = NM.pageTitle();
      render();
    })
    .catch(function (err) { NM.showLoadError(root, err); });
})();
