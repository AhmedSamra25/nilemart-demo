/* ============================================================================
   page-product.js — one product, plus four more from the same category.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;
  var root = document.querySelector('[data-product]');
  var all = [];
  var product = null;

  NM.pageTitle = function () {
    return product
      ? NM.pick(product, 'title') + ' — ' + NM.t('brandName')
      : NM.t('brandName');
  };

  function specRow(labelKey, value) {
    if (!value) return '';
    return '<div class="spec__row">' +
      '<dt>' + NM.esc(NM.t(labelKey)) + '</dt>' +
      '<dd>' + NM.bidi(value) + '</dd>' +
    '</div>';
  }

  function stockLine(p) {
    var qty = Number(p.inventory_qty) || 0;
    if (qty <= 0) return '<span class="chip">' + NM.esc(NM.t('outOfStock')) + '</span>';
    if (qty <= 20) {
      return '<span class="chip chip--gold">' + NM.esc(NM.t('lowStock')) + '</span>';
    }
    return '<span class="chip chip--teal">' + NM.esc(NM.t('inStock')) + '</span>';
  }

  function related(p) {
    var siblings = all.filter(function (x) {
      return x.category_slug === p.category_slug && x.handle !== p.handle;
    });
    // Prefer the same product type, then fill from the rest of the category.
    var sameType = siblings.filter(function (x) { return x.type === p.type; });
    var picks = sameType.concat(siblings.filter(function (x) {
      return sameType.indexOf(x) === -1;
    })).slice(0, 4);
    if (!picks.length) return '';

    return '' +
      '<section class="section"><div class="wrap">' +
        NM.sectionHead('relatedTitle', null,
          'category.html?c=' + encodeURIComponent(p.category_slug)) +
        '<div class="grid-products">' + picks.map(NM.productCard).join('') + '</div>' +
      '</div></section>';
  }

  function notFound() {
    root.innerHTML =
      '<div class="wrap section page-end"><div class="empty">' +
        '<img src="assets/nilemart-logo-stacked.svg" alt="">' +
        '<h2>' + NM.esc(NM.t('productNotFound')) + '</h2>' +
        '<p>' + NM.esc(NM.t('productNotFoundHint')) + '</p>' +
        '<a class="btn btn--primary" href="index.html">' + NM.esc(NM.t('backToHome')) + '</a>' +
      '</div></div>';
  }

  function render() {
    if (!root) return;
    if (!product) { notFound(); return; }

    var p = product;
    var catName = NM.lang === 'ar' ? p.category_ar : p.category;
    var tags = p.tags || [];
    var out = Number(p.inventory_qty) <= 0;

    var flags = [stockLine(p)];
    if (tags.indexOf('offer') > -1) {
      flags.unshift('<span class="chip chip--gold">' + NM.esc(NM.t('badgeOffer')) + '</span>');
    }
    if (tags.indexOf('best-seller') > -1) {
      flags.push('<span class="chip">' + NM.esc(NM.t('badgeBestSeller')) + '</span>');
    }
    if (tags.indexOf('seasonal') > -1) {
      flags.push('<span class="chip chip--teal">' + NM.esc(NM.t('badgeSeasonal')) + '</span>');
    }

    var priceBox = NM.money(p.price, 'price--lg');
    if (NM.hasDiscount(p)) {
      priceBox += NM.money(p.compare_at_price, 'price--was');
      priceBox += '<span class="chip chip--gold">' + NM.esc(NM.t('save')) + ' ' +
        NM.esc(NM.moneyText(p.compare_at_price - p.price)) + '</span>';
    }

    root.innerHTML =
      '<div class="wrap section"><div class="product">' +
        '<div class="product__media">' +
          '<img src="' + NM.esc(NM.img(p.image, 900)) + '" ' +
            'alt="' + NM.esc(p.image_alt || NM.pick(p, 'title')) + '" ' +
            'width="900" height="900" decoding="async">' +
        '</div>' +
        '<div>' +
          '<nav class="crumb">' +
            '<a href="category.html?c=' + encodeURIComponent(p.category_slug) + '">' +
              NM.esc(catName) + '</a>' +
            ' · ' + NM.bidi(p.type) +
          '</nav>' +
          '<h1>' + NM.esc(NM.pick(p, 'title')) + '</h1>' +
          '<p class="product__size">' + NM.bidi(p.size) +
            (p.vendor ? ' · ' + NM.bidi(p.vendor) : '') + '</p>' +

          '<div class="product__pricebox">' + priceBox + '</div>' +
          '<div class="product__flags">' + flags.join('') + '</div>' +

          '<div class="product__body">' + NM.pick(p, 'body') + '</div>' +

          (tags.indexOf('seasonal') > -1
            ? '<p class="note">' + NM.esc(NM.t('seasonalNote')) + '</p>'
            : '') +

          '<dl class="spec">' +
            specRow('size', p.size) +
            specRow('brand', p.vendor) +
            specRow('productType', p.type) +
            specRow('origin', p.country_of_origin) +
            specRow('storage', p.storage) +
            specRow('dietary', (p.dietary_tags || []).join(' · ')) +
            specRow('sku', p.sku) +
          '</dl>' +

          '<div class="buybar">' +
            '<button class="btn btn--primary btn--block" type="button" ' +
              'data-add="' + NM.esc(p.handle) + '"' + (out ? ' disabled' : '') + '>' +
              NM.esc(out ? NM.t('outOfStock') : NM.t('addToCart')) + '</button>' +
          '</div>' +
        '</div>' +
      '</div></div>' +
      related(p);

    NM.bindAdd(root);
  }

  NM.onRender(render);

  NM.load(['products'])
    .then(function (res) {
      all = res[0].products;
      var handle = NM.param('h');
      product = all.filter(function (p) { return p.handle === handle; })[0] || null;

      if (product) {
        NM.activeCategory = product.category_slug;
        NM.setContext({
          page: 'product',
          productHandle: product.handle,
          category: product.category,
        });
      } else {
        NM.setContext({ page: 'product' });
      }
      document.title = NM.pageTitle();
      render();
    })
    .catch(function (err) { NM.showLoadError(root, err); });
})();
