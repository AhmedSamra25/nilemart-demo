/* ============================================================================
   page-cart.js — the basket, its delivery-fee maths and the demo modal.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;
  var root = document.querySelector('[data-cart]');
  var modal = document.getElementById('demo-modal');
  var products = [];
  var speed = 'sameday';
  var lastFocus = null;

  NM.pageTitle = function () { return NM.t('cartTitle') + ' — ' + NM.t('brandName'); };

  function itemRow(r) {
    var p = r.product;
    return '' +
      '<div class="citem">' +
        '<a class="citem__media" href="product.html?h=' + encodeURIComponent(p.handle) + '" ' +
          'tabindex="-1" aria-hidden="true">' +
          '<img src="' + NM.esc(NM.img(p.image, 200)) + '" alt="" width="200" height="200" ' +
            'loading="lazy" decoding="async">' +
        '</a>' +
        '<div>' +
          '<a class="citem__name" href="product.html?h=' + encodeURIComponent(p.handle) + '">' +
            NM.esc(NM.pick(p, 'title')) + '</a>' +
          '<p class="citem__meta">' + NM.bidi(p.size) + ' · ' +
            NM.esc(NM.moneyText(p.price)) + '</p>' +
          '<div class="citem__foot">' +
            '<div class="stepper">' +
              '<button type="button" data-dec="' + NM.esc(p.handle) + '" ' +
                'aria-label="' + NM.esc(NM.t('cartDecrease')) + '">−</button>' +
              '<output aria-label="' + NM.esc(NM.t('cartQty')) + '">' +
                NM.number(r.qty) + '</output>' +
              '<button type="button" data-inc="' + NM.esc(p.handle) + '" ' +
                'aria-label="' + NM.esc(NM.t('cartIncrease')) + '">+</button>' +
            '</div>' +
            '<button class="citem__remove" type="button" data-remove="' +
              NM.esc(p.handle) + '">' + NM.esc(NM.t('cartRemove')) + '</button>' +
            '<span class="citem__line">' + NM.money(r.line) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function speedPicker(subtotal) {
    return '<div class="speed">' + window.Cart.SPEEDS.map(function (s) {
      var fee = window.Cart.deliveryFee(s.id, subtotal);
      return '<label>' +
        '<input type="radio" name="speed" value="' + s.id + '"' +
          (speed === s.id ? ' checked' : '') + '>' +
        '<span class="speed__name">' + NM.esc(NM.t(s.labelKey)) + '</span>' +
        '<span class="speed__fee">' +
          NM.esc(fee === 0 ? NM.t('promiseFree') : NM.moneyText(fee)) + '</span>' +
      '</label>';
    }).join('') + '</div>';
  }

  function summary(rows) {
    var subtotal = window.Cart.subtotal(rows);
    var fee = window.Cart.deliveryFee(speed, subtotal);
    var total = subtotal + fee;
    var gap = window.Cart.FREE_THRESHOLD - subtotal;

    var note = '';
    if (speed === 'express') {
      note = '<p class="note note--gold">' + NM.esc(NM.t('cartExpressNote')) + '</p>';
    } else if (subtotal >= window.Cart.FREE_THRESHOLD) {
      note = '<p class="note">' + NM.esc(NM.t('cartFreeNote')) + '</p>';
    } else {
      note = '<p class="note">' +
        NM.esc(NM.t('cartSpendMore', { amount: NM.moneyText(gap) })) + '</p>';
    }

    var minWarn = subtotal < window.Cart.MIN_BASKET
      ? '<p class="note note--gold">' + NM.esc(NM.t('cartMinimum')) + '</p>'
      : '';

    return '' +
      '<aside class="summary">' +
        '<h2>' + NM.esc(NM.t('cartSummary')) + '</h2>' +
        '<span class="filters__legend">' + NM.esc(NM.t('cartSpeed')) + '</span>' +
        speedPicker(subtotal) +
        '<dl class="totals">' +
          '<div class="totals__row"><dt>' + NM.esc(NM.t('cartSubtotal')) + '</dt>' +
            '<dd>' + NM.esc(NM.moneyText(subtotal)) + '</dd></div>' +
          '<div class="totals__row"><dt>' + NM.esc(NM.t('cartDeliveryFee')) + '</dt>' +
            '<dd>' + NM.esc(fee === 0 ? NM.t('promiseFree') : NM.moneyText(fee)) +
            '</dd></div>' +
          '<div class="totals__row totals__row--total"><dt>' + NM.esc(NM.t('cartTotal')) +
            '</dt><dd>' + NM.esc(NM.moneyText(total)) + '</dd></div>' +
        '</dl>' +
        note + minWarn +
        '<button class="btn btn--primary btn--block" type="button" ' +
          'style="margin-block-start:16px" data-checkout>' +
          NM.esc(NM.t('cartCheckout')) + '</button>' +
      '</aside>';
  }

  function render() {
    if (!root) return;
    var rows = window.Cart.detailed(products);

    if (!rows.length) {
      root.innerHTML =
        '<div class="wrap page-head"><h1>' + NM.esc(NM.t('cartTitle')) + '</h1></div>' +
        '<div class="wrap section section--flush page-end"><div class="empty">' +
          '<img src="assets/nilemart-logo-stacked.svg" alt="">' +
          '<h2>' + NM.esc(NM.t('cartEmpty')) + '</h2>' +
          '<p>' + NM.esc(NM.t('cartEmptyHint')) + '</p>' +
          '<a class="btn btn--primary" href="category.html?c=all">' +
            NM.esc(NM.t('cartEmptyCta')) + '</a>' +
        '</div></div>';
      renderModal();
      return;
    }

    root.innerHTML =
      '<div class="wrap page-head"><h1>' + NM.esc(NM.t('cartTitle')) + '</h1></div>' +
      '<div class="wrap section section--flush page-end">' +
        '<div class="cart-layout">' +
          '<div>' +
            '<h2 class="visually-hidden">' + NM.esc(NM.t('cartItemsHeading')) + '</h2>' +
            rows.map(itemRow).join('') +
          '</div>' +
          summary(rows) +
        '</div>' +
      '</div>';

    bind();
    renderModal();
  }

  function bind() {
    root.querySelectorAll('[data-inc]').forEach(function (b) {
      b.addEventListener('click', function () {
        window.Cart.add(b.dataset.inc, 1);
        render();
      });
    });
    root.querySelectorAll('[data-dec]').forEach(function (b) {
      b.addEventListener('click', function () {
        window.Cart.setQty(b.dataset.dec, window.Cart.qty(b.dataset.dec) - 1);
        render();
      });
    });
    root.querySelectorAll('[data-remove]').forEach(function (b) {
      b.addEventListener('click', function () {
        window.Cart.remove(b.dataset.remove);
        render();
      });
    });
    root.querySelectorAll('input[name="speed"]').forEach(function (r) {
      r.addEventListener('change', function () {
        speed = r.value;
        render();
      });
    });
    var checkout = root.querySelector('[data-checkout]');
    if (checkout) checkout.addEventListener('click', openModal);
  }

  /* --------------------------------------------------------------- modal */

  function renderModal() {
    if (!modal) return;
    modal.innerHTML =
      '<div class="modal__box" role="dialog" aria-modal="true" ' +
        'aria-labelledby="demo-modal-title">' +
        '<img src="assets/nilemart-logo-stacked.svg" alt="">' +
        '<h2 id="demo-modal-title">' + NM.esc(NM.t('demoModalTitle')) + '</h2>' +
        '<p>' + NM.esc(NM.t('demoModalBody')) + '</p>' +
        '<button class="btn btn--deep" type="button" data-close-modal>' +
          NM.esc(NM.t('demoModalCta')) + '</button>' +
      '</div>';

    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('[data-close-modal]')) closeModal();
    });
  }

  function openModal() {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.hidden = false;
    var btn = modal.querySelector('[data-close-modal]');
    if (btn) btn.focus();
    document.addEventListener('keydown', onKey);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape') closeModal();
    if (e.key !== 'Tab') return;
    // Only one control in the dialog, so keep focus on it.
    var btn = modal.querySelector('[data-close-modal]');
    if (btn) { e.preventDefault(); btn.focus(); }
  }

  NM.onRender(render);
  NM.setContext({ page: 'cart' });

  NM.load(['products'])
    .then(function (res) {
      products = res[0].products;
      document.title = NM.pageTitle();
      render();
    })
    .catch(function (err) { NM.showLoadError(root, err); });
})();
