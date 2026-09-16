/* ============================================================================
   page-track.js — order lookup against the ten sample orders.

   The numbered step rail is shown only for orders that are actually moving
   through fulfilment. A cancelled, refunded or unpaid order gets its status
   stated plainly instead of being forced onto a progress bar it is not on.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;
  var root = document.querySelector('[data-track]');
  var orders = [];
  var query = NM.param('o') || '';
  var result;          // undefined = nothing searched yet, null = not found

  NM.pageTitle = function () { return NM.t('trackTitle') + ' — ' + NM.t('brandName'); };

  var DELIVERY_STEPS = ['stepPreparing', 'stepOutForDelivery', 'stepDelivered'];
  var COLLECT_STEPS = ['stepPreparing', 'stepReady'];

  /** Where this order sits on the rail, or -1 if it is not on one. */
  function stepIndex(order, steps) {
    var s = (order.status || '').toLowerCase();
    if (s.indexOf('cancel') > -1 || s.indexOf('awaiting') > -1) return -1;
    if (s.indexOf('ready for collection') > -1) return steps.indexOf('stepReady');
    if (s.indexOf('out for delivery') > -1) return steps.indexOf('stepOutForDelivery');
    if (s.indexOf('preparing') > -1) return steps.indexOf('stepPreparing');
    // delivered, refunded and partially refunded all reached the end of the rail
    if (s.indexOf('deliver') > -1 || s.indexOf('refund') > -1) return steps.length - 1;
    return -1;
  }

  function rail(order) {
    var collect = (order.fulfilment_type || '').toLowerCase().indexOf('collect') > -1;
    var steps = collect ? COLLECT_STEPS : DELIVERY_STEPS;
    var at = stepIndex(order, steps);
    if (at < 0) return '';

    return '<div class="steps">' + steps.map(function (key, i) {
      var cls = i < at ? 'is-done' : (i === at ? 'is-current' : '');
      return '<div class="step ' + cls + '">' +
        '<span class="step__n">' + NM.number(i + 1) + '</span>' +
        '<span class="step__label">' + NM.esc(NM.t(key)) + '</span>' +
      '</div>';
    }).join('') + '</div>';
  }

  function fact(labelKey, value) {
    if (!value && value !== 0) return '';
    return '<div class="store__row">' +
      '<dt>' + NM.esc(NM.t(labelKey)) + '</dt>' +
      '<dd>' + NM.bidi(value) + '</dd>' +
    '</div>';
  }

  function orderPanel(o) {
    var lines = o.items.map(function (it) {
      return '<li class="line">' +
        '<span class="line__qty">' + NM.esc(NM.t('qtyShort')) + NM.number(it.qty) + '</span>' +
        '<span class="line__name">' + NM.esc(NM.pick(it, 'name')) +
          '<br><span class="line__sku">' + NM.bidi(it.sku) + '</span>' +
        '</span>' +
      '</li>';
    }).join('');

    var totals =
      '<dl class="totals">' +
        '<div class="totals__row"><dt>' + NM.esc(NM.t('orderSubtotal')) + '</dt>' +
          '<dd>' + NM.esc(NM.moneyText(o.subtotal_egp)) + '</dd></div>' +
        '<div class="totals__row"><dt>' + NM.esc(NM.t('orderDeliveryFee')) + '</dt>' +
          '<dd>' + NM.esc(o.delivery_fee_egp ? NM.moneyText(o.delivery_fee_egp)
            : NM.t('promiseFree')) + '</dd></div>' +
        (o.discount_egp
          ? '<div class="totals__row totals__row--discount"><dt>' +
              NM.esc(NM.t('orderDiscount')) +
              (o.promo_code ? ' · ' + NM.esc(o.promo_code) : '') + '</dt>' +
              '<dd>−' + NM.esc(NM.moneyText(o.discount_egp)) + '</dd></div>'
          : '') +
        '<div class="totals__row totals__row--total"><dt>' + NM.esc(NM.t('orderTotal')) + '</dt>' +
          '<dd>' + NM.esc(NM.moneyText(o.total_egp)) + '</dd></div>' +
      '</dl>';

    return '' +
      '<div class="order">' +
        '<div>' +
          '<div class="panel">' +
            '<div class="order__head">' +
              '<span class="order__id">' + NM.esc(o.order_id) + '</span>' +
              '<span class="chip chip--teal">' + NM.esc(NM.pick(o, 'status')) + '</span>' +
            '</div>' +
            rail(o) +
            '<dl class="store__rows">' +
              fact('orderPlaced', o.order_datetime) +
              fact('orderFulfilment', o.fulfilment_type) +
              fact('orderSlot', o.delivery_slot) +
              fact('orderEta', o.eta) +
              fact('orderCourier', o.courier_name) +
              fact('orderAddress', o.delivery_address) +
              fact('orderFrom', o.fulfilled_from) +
            '</dl>' +
          '</div>' +
          '<div class="panel">' +
            '<h2>' + NM.esc(NM.t('orderItems')) + '</h2>' +
            '<ul class="lines">' + lines + '</ul>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="panel">' +
            '<h2>' + NM.esc(NM.t('orderTotal')) + '</h2>' + totals +
          '</div>' +
          '<div class="panel">' +
            '<h2>' + NM.esc(NM.t('orderPayment')) + '</h2>' +
            '<dl class="store__rows">' +
              fact('orderPayment', o.payment_method) +
              fact('orderStatus', o.payment_status) +
              fact('orderTier', o.loyalty_tier) +
              fact('orderPoints', o.points_earned ? NM.number(o.points_earned) : '') +
            '</dl>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function notFound() {
    return '<div class="empty" style="margin-block-start:28px">' +
      '<img src="assets/nilemart-logo-stacked.svg" alt="">' +
      '<h2>' + NM.esc(NM.t('trackNotFound')) + '</h2>' +
      '<p>' + NM.esc(NM.t('trackNotFoundHint')) + '</p>' +
    '</div>';
  }

  function render() {
    if (!root) return;

    var samples = orders.slice(0, 3).map(function (o) {
      return '<li><button type="button" data-sample="' + NM.esc(o.order_id) + '">' +
        NM.esc(o.order_id) + '</button></li>';
    }).join('');

    var body = '';
    if (result) body = orderPanel(result);
    else if (result === null) body = notFound();

    root.innerHTML =
      '<div class="wrap page-head">' +
        '<h1>' + NM.esc(NM.t('trackTitle')) +
          '<span class="section-head__alt">' +
            NM.esc(window.I18N[NM.lang === 'ar' ? 'en' : 'ar'].trackTitle) + '</span>' +
        '</h1>' +
        '<p>' + NM.esc(NM.t('trackLead')) + '</p>' +
      '</div>' +
      '<div class="wrap section section--flush page-end">' +
        '<form class="track-form" data-track-form>' +
          '<div class="field">' +
            '<label for="order-no">' + NM.esc(NM.t('trackLabel')) + '</label>' +
            '<input id="order-no" type="text" inputmode="text" autocomplete="off" ' +
              'placeholder="' + NM.esc(NM.t('trackPlaceholder')) + '" ' +
              'value="' + NM.esc(query) + '" data-order-input>' +
          '</div>' +
          '<button class="btn btn--primary" type="submit">' +
            NM.esc(NM.t('trackButton')) + '</button>' +
        '</form>' +
        '<div class="examples">' + NM.esc(NM.t('trackExample')) +
          '<ul>' + samples + '</ul>' +
        '</div>' +
        body +
      '</div>';

    bind();
  }

  function lookup(value) {
    query = String(value || '').trim();
    var key = query.toUpperCase();
    result = key
      ? (orders.filter(function (o) { return o.order_id.toUpperCase() === key; })[0] || null)
      : undefined;
    render();
  }

  function bind() {
    var form = root.querySelector('[data-track-form]');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        lookup(root.querySelector('[data-order-input]').value);
      });
    }
    root.querySelectorAll('[data-sample]').forEach(function (btn) {
      btn.addEventListener('click', function () { lookup(btn.dataset.sample); });
    });
  }

  NM.onRender(render);
  NM.setContext({ page: 'track' });

  NM.load(['orders'])
    .then(function (res) {
      orders = res[0];
      document.title = NM.pageTitle();
      if (query) lookup(query);
      else render();
    })
    .catch(function (err) { NM.showLoadError(root, err); });
})();
