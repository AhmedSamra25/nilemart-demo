/* ============================================================================
   page-stores.js — the 14 customer-facing branches.

   The three dark stores never reach the browser: build-data.py drops them,
   so stores.json contains branches only.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;
  var root = document.querySelector('[data-stores]');
  var stores = [];
  var governorate = 'all';

  NM.pageTitle = function () { return NM.t('storesTitle') + ' — ' + NM.t('brandName'); };

  function row(labelKey, value) {
    if (!value) return '';
    return '<div class="store__row">' +
      '<dt>' + NM.esc(NM.t(labelKey)) + '</dt>' +
      '<dd>' + value + '</dd>' +
    '</div>';
  }

  function time(from, to) {
    if (!from || !to) return '';
    return '<span class="store__time">' + NM.esc(from) + '–' + NM.esc(to) + '</span>';
  }

  function card(s) {
    var services = (s.services || []).map(function (x) {
      return '<span class="chip chip--quiet">' + NM.esc(x) + '</span>';
    }).join('');

    return '' +
      '<article class="store">' +
        '<h3>' + NM.esc(NM.lang === 'ar' ? s.name_ar : s.name) + '</h3>' +
        '<p class="store__alt">' + NM.esc(NM.lang === 'ar' ? s.name : s.name_ar) + '</p>' +
        '<p class="store__addr">' + NM.esc(NM.pick(s, 'address')) + '</p>' +
        '<dl class="store__rows">' +
          row('hours', time(s.open_time, s.close_time)) +
          row('ramadanHours', time(s.ramadan_open, s.ramadan_close)) +
          row('clickCollect', NM.esc(s.click_collect === 'Yes' ? NM.t('yes') : NM.t('no'))) +
          row('parking', NM.bidi(s.parking)) +
          row('wheelchair', NM.esc(s.wheelchair_access === 'Yes' ? NM.t('yes') : NM.t('no'))) +
          row('openedIn', s.opened_year ? String(s.opened_year) : '') +
        '</dl>' +
        (services
          ? '<div><span class="filters__legend">' + NM.esc(NM.t('services')) + '</span>' +
            '<div class="store__services">' + services + '</div></div>'
          : '') +
        '<div class="store__actions">' +
          (s.google_maps_url
            ? '<a class="btn btn--deep" href="' + NM.esc(s.google_maps_url) + '" ' +
              'target="_blank" rel="noopener">' + NM.esc(NM.t('getDirections')) + '</a>'
            : '') +
          (s.phone
            ? '<a class="btn btn--ghost" href="tel:' + NM.esc(s.phone.replace(/\s/g, '')) + '">' +
              NM.esc(NM.t('callBranch')) + '</a>'
            : '') +
        '</div>' +
      '</article>';
  }

  function filterBar() {
    var govs = [];
    stores.forEach(function (s) {
      if (s.governorate && govs.indexOf(s.governorate) === -1) govs.push(s.governorate);
    });
    return '<div class="topicnav">' +
      '<button type="button" data-gov="all" aria-pressed="' + (governorate === 'all') + '">' +
        NM.esc(NM.t('allGovernorates')) + '</button>' +
      govs.map(function (g) {
        return '<button type="button" data-gov="' + NM.esc(g) + '" ' +
          'aria-pressed="' + (governorate === g) + '">' + NM.esc(g) + '</button>';
      }).join('') +
    '</div>';
  }

  function render() {
    if (!root) return;
    var list = governorate === 'all'
      ? stores
      : stores.filter(function (s) { return s.governorate === governorate; });

    var body = list.length
      ? '<div class="grid-stores">' + list.map(card).join('') + '</div>'
      : '<div class="empty">' +
          '<img src="assets/nilemart-logo-stacked.svg" alt="">' +
          '<h2>' + NM.esc(NM.t('noStores')) + '</h2>' +
        '</div>';

    root.innerHTML =
      '<div class="wrap page-head">' +
        '<h1>' + NM.esc(NM.t('storesTitle')) +
          '<span class="section-head__alt">' +
            NM.esc(window.I18N[NM.lang === 'ar' ? 'en' : 'ar'].storesTitle) + '</span>' +
        '</h1>' +
        '<p>' + NM.esc(NM.t('storesLead')) + '</p>' +
      '</div>' +
      '<div class="wrap section section--flush page-end">' +
        filterBar() +
        '<p class="toolbar__count" style="margin-block-end:16px">' +
          NM.esc(NM.t('storesShowing', {
            n: NM.number(list.length), total: NM.number(stores.length),
          })) +
        '</p>' +
        body +
      '</div>';

    root.querySelectorAll('[data-gov]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        governorate = btn.dataset.gov;
        render();
      });
    });
  }

  NM.onRender(render);
  NM.setContext({ page: 'stores' });

  NM.load(['stores'])
    .then(function (res) {
      stores = res[0];
      document.title = NM.pageTitle();
      render();
    })
    .catch(function (err) { NM.showLoadError(root, err); });
})();
