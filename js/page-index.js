/* ============================================================================
   page-index.js — the storefront home page.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;
  var root = document.querySelector('[data-home]');
  var data = null;

  /* Four catalogue items that say "Egyptian grocer" at a glance. Each tile
     links to its product page, so the hero images do a job. */
  var MOSAIC = [
    'egyptian-mangoes-1kg',
    'molokhia-fresh-500g',
    'baladi-bread-pack-10',
    'bolti-tilapia-whole-1kg',
  ];

  NM.pageTitle = function () {
    return NM.t('brandName') + ' — ' + NM.t('tagline');
  };

  function mosaic(products) {
    var byHandle = {};
    products.forEach(function (p) { byHandle[p.handle] = p; });

    var picks = MOSAIC.map(function (h) { return byHandle[h]; }).filter(Boolean);
    while (picks.length < 4 && picks.length < products.length) {
      var next = products[picks.length];
      if (picks.indexOf(next) === -1) picks.push(next);
    }

    return '<div class="hero__mosaic">' + picks.map(function (p) {
      var seasonal = (p.tags || []).indexOf('seasonal') > -1;
      return '<a class="mosaic-tile" href="product.html?h=' + encodeURIComponent(p.handle) + '">' +
        '<img src="' + NM.esc(NM.img(p.image, 500)) + '" alt="' + NM.esc(NM.pick(p, 'title')) + '" ' +
          'width="500" height="500" decoding="async">' +
        (seasonal
          ? '<span class="mosaic-tile__flag">' + NM.esc(NM.t('badgeSeasonal')) + '</span>'
          : '') +
        '<span class="mosaic-tile__cap">' + NM.esc(NM.pick(p, 'title')) + '</span>' +
      '</a>';
    }).join('') + '</div>';
  }

  function hero(products) {
    return '' +
      '<section class="hero"><div class="wrap"><div class="hero__grid">' +
        '<div>' +
          '<h1>' + NM.esc(NM.t('heroTitle')) + '</h1>' +
          '<p class="hero__lead">' + NM.esc(NM.t('heroLead')) + '</p>' +
          '<div class="hero__cta">' +
            '<a class="btn btn--primary" href="category.html?c=all">' +
              NM.esc(NM.t('heroCtaShop')) + '</a>' +
            '<a class="btn btn--ghost" href="offers.html">' +
              NM.esc(NM.t('heroCtaOffers')) + '</a>' +
          '</div>' +
        '</div>' +
        mosaic(products) +
      '</div></div></section>';
  }

  function tiles(categories) {
    return '' +
      '<section class="section"><div class="wrap">' +
        NM.sectionHead('shopCategory') +
        '<div class="tiles">' + categories.map(function (c) {
          var name = NM.lang === 'ar' ? c.name_ar : c.name;
          var alt = NM.lang === 'ar' ? c.name : c.name_ar;
          return '<a class="tile" href="category.html?c=' + encodeURIComponent(c.slug) + '">' +
            '<img src="' + NM.esc(NM.img(c.image, 480)) + '" alt="" loading="lazy" ' +
              'decoding="async" width="480" height="360">' +
            '<span class="tile__body">' +
              '<span class="tile__name">' + NM.esc(name) + '</span>' +
              '<span class="tile__alt">' + NM.esc(alt) + '</span>' +
              '<span class="tile__count">' + NM.number(c.count) + ' ' +
                NM.esc(NM.t('productsCount')) + '</span>' +
            '</span>' +
          '</a>';
        }).join('') + '</div>' +
      '</div></section>';
  }

  function offersStrip(offers) {
    var live = NM.liveOffers(offers);
    if (!live.length) return '';
    return '' +
      '<section class="section section--tight offer-strip"><div class="wrap">' +
        NM.sectionHead('liveOffers', 'liveOffersSub', 'offers.html') +
        '<div class="rail rail--wide">' +
          live.slice(0, 8).map(NM.offerCard).join('') +
        '</div>' +
      '</div></section>';
  }

  function bestSellers(products) {
    var picks = products.filter(function (p) {
      return (p.tags || []).indexOf('best-seller') > -1;
    });
    if (!picks.length) return '';
    return '' +
      '<section class="section"><div class="wrap">' +
        NM.sectionHead('bestSellers', 'bestSellersSub', 'category.html?c=all&s=offers') +
        '<div class="rail">' + picks.map(NM.productCard).join('') + '</div>' +
      '</div></section>';
  }

  function bundlesRail(bundles) {
    var live = bundles.filter(function (b) { return b.status === 'active'; });
    if (!live.length) return '';
    return '' +
      '<section class="section section--flush"><div class="wrap">' +
        NM.sectionHead('bundlesRail', 'bundlesRailSub', 'bundles.html') +
        '<div class="rail rail--wide">' + live.map(NM.bundleCard).join('') + '</div>' +
      '</div></section>';
  }

  function promise() {
    return '' +
      '<section class="section promise"><div class="wrap">' +
        '<h2>' + NM.esc(NM.t('promiseTitle')) + '</h2>' +
        '<div class="promise__grid">' +
          promiseItem(NM.moneyText(79), NM.t('promiseExpress'), NM.t('promiseExpressNote')) +
          promiseItem(NM.t('promiseFree'), NM.t('promiseFreeDelivery'), NM.t('promiseFreeDeliveryNote')) +
          promiseItem(NM.number(14), NM.t('promiseBranches'), NM.t('promiseBranchesNote')) +
        '</div>' +
        '<p class="promise__foot">' +
          '<a href="policies.html?p=delivery">' + NM.esc(NM.t('promiseReadPolicy')) + '</a>' +
        '</p>' +
      '</div></section>';
  }

  function promiseItem(figure, label, note) {
    return '<div class="promise__item">' +
      '<span class="promise__figure">' + NM.esc(figure) + '</span>' +
      '<span class="promise__label">' + NM.esc(label) + '</span>' +
      '<span class="promise__note">' + NM.esc(note) + '</span>' +
    '</div>';
  }

  function render() {
    if (!root || !data) return;
    root.innerHTML =
      hero(data.products) +
      tiles(data.categories) +
      offersStrip(data.offers) +
      bestSellers(data.products) +
      bundlesRail(data.bundles) +
      promise();

    NM.bindAdd(root);
    NM.bindAddBundle(root, data.bundles, NM.handleBySku(data.products));
  }

  NM.onRender(render);
  NM.setContext({ page: 'index' });

  NM.load(['products', 'offers', 'bundles'])
    .then(function (res) {
      data = {
        products: res[0].products,
        categories: res[0].categories,
        offers: res[1],
        bundles: res[2],
      };
      render();
    })
    .catch(function (err) { NM.showLoadError(root, err); });
})();
