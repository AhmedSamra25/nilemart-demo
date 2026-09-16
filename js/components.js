/* ============================================================================
   components.js — markup shared between pages: product cards, offer cards,
   bundle cards and the add-to-cart wiring.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;

  /** At most two flags per card, most useful first, each carrying real data. */
  NM.flagsFor = function (p) {
    var tags = p.tags || [];
    var out = [];
    if (tags.indexOf('offer') > -1) {
      out.push('<span class="flag flag--offer">' + NM.esc(NM.t('badgeOffer')) + '</span>');
    }
    if (tags.indexOf('seasonal') > -1) {
      out.push('<span class="flag flag--season">' + NM.esc(NM.t('badgeSeasonal')) + '</span>');
    }
    if (!out.length && tags.indexOf('best-seller') > -1) {
      out.push('<span class="flag flag--best">' + NM.esc(NM.t('badgeBestSeller')) + '</span>');
    }
    return out.join('');
  };

  NM.hasDiscount = function (p) {
    return p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
  };

  NM.productCard = function (p) {
    var title = NM.pick(p, 'title');
    var url = 'product.html?h=' + encodeURIComponent(p.handle);
    var flags = NM.flagsFor(p);
    var out = Number(p.inventory_qty) <= 0;

    var priceBlock = NM.money(p.price);
    if (NM.hasDiscount(p)) {
      priceBlock += NM.money(p.compare_at_price, 'price--was');
    }

    return '' +
      '<article class="pcard">' +
        '<a class="pcard__link pcard__media" href="' + url + '" tabindex="-1" aria-hidden="true">' +
          '<img src="' + NM.esc(NM.img(p.image, 400)) + '" alt="" loading="lazy" decoding="async" ' +
            'width="400" height="400">' +
          (flags ? '<span class="pcard__flags">' + flags + '</span>' : '') +
        '</a>' +
        '<div class="pcard__body">' +
          '<a class="pcard__link" href="' + url + '">' +
            '<span class="pcard__title">' + NM.esc(title) + '</span>' +
          '</a>' +
          '<span class="pcard__meta">' + NM.bidi(p.size) + '</span>' +
          '<div class="pcard__price">' + priceBlock + '</div>' +
          '<button class="pcard__add" type="button" data-add="' + NM.esc(p.handle) + '"' +
            (out ? ' disabled' : '') + '>' +
            NM.esc(out ? NM.t('outOfStock') : NM.t('addToCart')) +
          '</button>' +
        '</div>' +
      '</article>';
  };

  /** Compact offer card for the home page strip. */
  NM.offerCard = function (o) {
    var code = o.promo_code
      ? '<span class="chip chip--gold">' + NM.esc(o.promo_code) + '</span>'
      : '';
    return '' +
      '<a class="ocard" href="offers.html#' + NM.esc(o.id) + '">' +
        '<span class="ocard__name">' + NM.esc(NM.pick(o, 'name')) + '</span>' +
        '<span class="ocard__desc">' + NM.esc(NM.pick(o, 'description')) + '</span>' +
        '<span class="ocard__foot">' + code +
          '<span class="chip chip--quiet">' + NM.esc(NM.t('runsUntil')) + ' ' +
            NM.esc(NM.formatDate(o.end_date)) + '</span>' +
        '</span>' +
      '</a>';
  };

  NM.bundleCard = function (b) {
    var items = b.items.map(function (it) {
      return '<li><span>' + NM.esc(NM.pick(it, 'name')) + '</span></li>';
    }).join('');

    var stats = [];
    if (b.serves) {
      stats.push('<span class="chip">' + NM.esc(NM.t('serves')) + ' ' + NM.number(b.serves) + '</span>');
    }
    if (b.prep_time_minutes) {
      stats.push('<span class="chip">' + NM.number(b.prep_time_minutes) + ' ' +
        NM.esc(NM.t('minutes')) + '</span>');
    }
    if (b.difficulty) stats.push('<span class="chip">' + NM.esc(b.difficulty) + '</span>');
    stats.push('<span class="chip chip--quiet">' +
      NM.esc(NM.t('itemsCount', { n: NM.number(b.items_count) })) + '</span>');

    return '' +
      '<article class="bundle" id="' + NM.esc(b.id) + '">' +
        '<div class="bundle__media">' +
          '<img src="' + NM.esc(NM.img(b.image, 600)) + '" alt="" loading="lazy" ' +
            'decoding="async" width="600" height="338">' +
        '</div>' +
        '<div class="bundle__body">' +
          '<h3>' + NM.esc(NM.pick(b, 'name')) + '</h3>' +
          '<p class="bundle__desc">' + NM.esc(NM.pick(b, 'description')) + '</p>' +
          '<div class="bundle__stats">' + stats.join('') + '</div>' +
          '<ul class="bundle__items">' + items + '</ul>' +
          '<div class="bundle__pricing">' +
            '<div>' +
              '<span class="bundle__label">' + NM.esc(NM.t('sumOfItems')) + '</span>' +
              NM.money(b.sum_of_items_egp, 'price--was') +
            '</div>' +
            '<div>' +
              '<span class="bundle__label">' + NM.esc(NM.t('bundlePrice')) + '</span>' +
              NM.money(b.bundle_price_egp, 'price--lg') +
            '</div>' +
          '</div>' +
          '<p style="margin-block-start:10px">' +
            '<span class="chip chip--gold">' + NM.esc(NM.t('youSave')) + ' ' +
              NM.esc(NM.moneyText(b.saving_egp)) + '</span>' +
          '</p>' +
          '<button class="btn btn--deep btn--block" type="button" style="margin-block-start:12px" ' +
            'data-add-bundle="' + NM.esc(b.id) + '">' + NM.esc(NM.t('addBundle')) + '</button>' +
        '</div>' +
      '</article>';
  };

  /** Wire every add-to-cart button inside a container. */
  NM.bindAdd = function (root) {
    (root || document).querySelectorAll('[data-add]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        window.Cart.add(btn.dataset.add, 1);
        var original = btn.textContent;
        btn.textContent = NM.t('added');
        btn.classList.add('is-added');
        window.setTimeout(function () {
          btn.textContent = original;
          btn.classList.remove('is-added');
        }, 1200);
      });
    });
  };

  /** Bundle rows list SKUs; the cart stores handles, so map across. */
  NM.bindAddBundle = function (root, bundles, skuToHandle) {
    (root || document).querySelectorAll('[data-add-bundle]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var b = bundles.filter(function (x) { return x.id === btn.dataset.addBundle; })[0];
        if (!b) return;
        var handles = b.items
          .map(function (i) { return skuToHandle[i.sku]; })
          .filter(Boolean);
        if (!handles.length) return;
        window.Cart.addMany(handles);
        var original = btn.textContent;
        btn.textContent = NM.t('added');
        window.setTimeout(function () { btn.textContent = original; }, 1200);
      });
    });
  };

  NM.handleBySku = function (products) {
    var map = {};
    products.forEach(function (p) { map[p.sku] = p.handle; });
    return map;
  };

  NM.sectionHead = function (titleKey, subKey, moreHref, moreKey) {
    var alt = window.I18N[NM.lang === 'ar' ? 'en' : 'ar'][titleKey];
    return '' +
      '<div class="section-head">' +
        '<div>' +
          '<h2>' + NM.esc(NM.t(titleKey)) +
            (alt ? '<span class="section-head__alt">' + NM.esc(alt) + '</span>' : '') +
          '</h2>' +
          (subKey ? '<p style="margin-block-start:8px">' + NM.esc(NM.t(subKey)) + '</p>' : '') +
        '</div>' +
        (moreHref
          ? '<a class="link-more" href="' + moreHref + '">' + NM.esc(NM.t(moreKey || 'seeAll')) +
              NM.icon('chev') + '</a>'
          : '') +
      '</div>';
  };
})();
