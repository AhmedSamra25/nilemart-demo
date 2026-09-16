/* ============================================================================
   page-category.js — one category's grid, with type / dietary / price filters
   and sorting. Also serves "all categories" for the header search.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;
  var root = document.querySelector('[data-category]');

  var all = [];
  var categories = [];
  var category = null;          // null means "all categories"
  var scope = [];               // products in the current category

  var state = {
    types: [],
    dietary: [],
    max: null,
    sort: NM.param('s') || 'name',
    query: NM.param('q') || '',
    filtersOpen: false,
  };

  var bounds = { min: 0, max: 0 };

  NM.pageTitle = function () {
    var name = category
      ? (NM.lang === 'ar' ? category.name_ar : category.name)
      : NM.t('allCategories');
    return name + ' — ' + NM.t('brandName');
  };

  /* ------------------------------------------------------------ filtering */

  function matchesQuery(p) {
    if (!state.query) return true;
    var q = state.query.toLowerCase();
    return [p.title, p.title_ar, p.type, p.vendor, p.sku, (p.tags || []).join(' ')]
      .join(' ').toLowerCase().indexOf(q) > -1;
  }

  function visible() {
    return scope.filter(function (p) {
      if (state.types.length && state.types.indexOf(p.type) === -1) return false;
      if (state.dietary.length) {
        var hit = state.dietary.some(function (d) {
          return (p.dietary_tags || []).indexOf(d) > -1;
        });
        if (!hit) return false;
      }
      if (state.max !== null && Number(p.price) > state.max) return false;
      return matchesQuery(p);
    });
  }

  function sorted(list) {
    var out = list.slice();
    if (state.sort === 'price-asc') {
      out.sort(function (a, b) { return a.price - b.price; });
    } else if (state.sort === 'price-desc') {
      out.sort(function (a, b) { return b.price - a.price; });
    } else if (state.sort === 'offers') {
      out.sort(function (a, b) {
        var ao = (a.tags || []).indexOf('offer') > -1 ? 0 : 1;
        var bo = (b.tags || []).indexOf('offer') > -1 ? 0 : 1;
        if (ao !== bo) return ao - bo;
        return NM.pick(a, 'title').localeCompare(NM.pick(b, 'title'));
      });
    } else {
      out.sort(function (a, b) {
        return NM.pick(a, 'title').localeCompare(NM.pick(b, 'title'),
          NM.lang === 'ar' ? 'ar' : 'en');
      });
    }
    return out;
  }

  /* -------------------------------------------------------------- markup  */

  function counted(field) {
    var tally = {};
    scope.forEach(function (p) {
      var values = field === 'type' ? [p.type] : (p.dietary_tags || []);
      values.forEach(function (v) {
        if (!v) return;
        tally[v] = (tally[v] || 0) + 1;
      });
    });
    return Object.keys(tally).sort().map(function (k) {
      return { value: k, n: tally[k] };
    });
  }

  function checkList(field, chosen) {
    return counted(field).map(function (row) {
      var on = chosen.indexOf(row.value) > -1;
      return '<label class="check">' +
        '<input type="checkbox" data-filter="' + field + '" value="' + NM.esc(row.value) + '"' +
          (on ? ' checked' : '') + '>' +
        '<span>' + NM.esc(row.value) + '</span>' +
        '<span class="check__n">' + NM.number(row.n) + '</span>' +
      '</label>';
    }).join('');
  }

  function filtersPanel() {
    var max = state.max === null ? bounds.max : state.max;
    return '' +
      '<aside class="filters' + (state.filtersOpen ? '' : ' is-collapsed') + '" data-filters>' +
        '<div class="filters__group">' +
          '<span class="filters__legend">' + NM.esc(NM.t('filterPrice')) + '</span>' +
          '<div class="range-row">' +
            '<span>' + NM.esc(NM.t('upTo')) + '</span>' +
            '<span data-price-out>' + NM.esc(NM.moneyText(max)) + '</span>' +
          '</div>' +
          '<input type="range" data-price min="' + bounds.min + '" max="' + bounds.max + '" ' +
            'step="1" value="' + max + '" aria-label="' + NM.esc(NM.t('filterPrice')) + '">' +
        '</div>' +
        '<div class="filters__group">' +
          '<span class="filters__legend">' + NM.esc(NM.t('filterType')) + '</span>' +
          '<div class="filters__scroll">' + checkList('type', state.types) + '</div>' +
        '</div>' +
        '<div class="filters__group">' +
          '<span class="filters__legend">' + NM.esc(NM.t('filterDietary')) + '</span>' +
          '<div class="filters__scroll">' + checkList('dietary', state.dietary) + '</div>' +
        '</div>' +
        '<div class="filters__group">' +
          '<button class="btn btn--ghost btn--block" type="button" data-clear>' +
            NM.esc(NM.t('clearFilters')) + '</button>' +
        '</div>' +
      '</aside>';
  }

  function toolbar(shown, total) {
    var options = [
      ['name', 'sortName'],
      ['price-asc', 'sortPriceAsc'],
      ['price-desc', 'sortPriceDesc'],
      ['offers', 'sortOffers'],
    ].map(function (o) {
      return '<option value="' + o[0] + '"' + (state.sort === o[0] ? ' selected' : '') + '>' +
        NM.esc(NM.t(o[1])) + '</option>';
    }).join('');

    return '' +
      '<div class="toolbar">' +
        '<span class="toolbar__count">' +
          NM.esc(NM.t('showingCount', { n: NM.number(shown), total: NM.number(total) })) +
        '</span>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
          '<button class="select filters-toggle" type="button" data-toggle-filters>' +
            NM.esc(NM.t('filters')) + '</button>' +
          '<label class="visually-hidden" for="nm-sort">' + NM.esc(NM.t('sortBy')) + '</label>' +
          '<select class="select" id="nm-sort" data-sort>' + options + '</select>' +
        '</div>' +
      '</div>';
  }

  function render() {
    if (!root) return;

    if (!category && NM.param('c') && NM.param('c') !== 'all') {
      root.innerHTML =
        '<div class="wrap section page-end"><div class="empty">' +
          '<img src="assets/nilemart-logo-stacked.svg" alt="">' +
          '<h2>' + NM.esc(NM.t('categoryNotFound')) + '</h2>' +
          '<a class="btn btn--primary" href="index.html">' +
            NM.esc(NM.t('backToHome')) + '</a>' +
        '</div></div>';
      return;
    }

    var list = sorted(visible());
    var name = category
      ? (NM.lang === 'ar' ? category.name_ar : category.name)
      : NM.t('allCategories');
    var alt = category ? (NM.lang === 'ar' ? category.name : category.name_ar) : '';

    var body = list.length
      ? '<div class="grid-products">' + list.map(NM.productCard).join('') + '</div>'
      : '<div class="empty">' +
          '<img src="assets/nilemart-logo-stacked.svg" alt="">' +
          '<h2>' + NM.esc(NM.t('noProducts')) + '</h2>' +
          '<p>' + NM.esc(NM.t('noProductsHint')) + '</p>' +
          '<button class="btn btn--ghost" type="button" data-clear>' +
            NM.esc(NM.t('clearFilters')) + '</button>' +
        '</div>';

    root.innerHTML =
      '<div class="wrap page-head">' +
        '<h1>' + NM.esc(name) +
          (alt ? '<span class="section-head__alt">' + NM.esc(alt) + '</span>' : '') +
        '</h1>' +
        (state.query
          ? '<p>' + NM.esc(NM.t('searchLabel')) + ': “' + NM.esc(state.query) + '”</p>'
          : '') +
      '</div>' +
      '<div class="wrap section section--flush page-end">' +
        '<div class="layout-side">' +
          filtersPanel() +
          '<div>' + toolbar(list.length, scope.length) + body + '</div>' +
        '</div>' +
      '</div>';

    bind();
    NM.bindAdd(root);
  }

  function bind() {
    root.querySelectorAll('[data-filter]').forEach(function (box) {
      box.addEventListener('change', function () {
        var bucket = box.dataset.filter === 'type' ? state.types : state.dietary;
        var i = bucket.indexOf(box.value);
        if (box.checked && i === -1) bucket.push(box.value);
        if (!box.checked && i > -1) bucket.splice(i, 1);
        state.filtersOpen = true;
        render();
      });
    });

    var range = root.querySelector('[data-price]');
    if (range) {
      var out = root.querySelector('[data-price-out]');
      range.addEventListener('input', function () {
        out.textContent = NM.moneyText(Number(range.value));
      });
      range.addEventListener('change', function () {
        state.max = Number(range.value);
        state.filtersOpen = true;
        render();
      });
    }

    var sort = root.querySelector('[data-sort]');
    if (sort) {
      sort.addEventListener('change', function () {
        state.sort = sort.value;
        render();
      });
    }

    root.querySelectorAll('[data-clear]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.types = [];
        state.dietary = [];
        state.max = null;
        state.query = '';
        NM.searchTerm = '';
        render();
      });
    });

    var toggle = root.querySelector('[data-toggle-filters]');
    if (toggle) {
      toggle.addEventListener('click', function () {
        state.filtersOpen = !state.filtersOpen;
        root.querySelector('[data-filters]').classList.toggle('is-collapsed', !state.filtersOpen);
      });
    }
  }

  NM.onRender(render);

  NM.load(['products'])
    .then(function (res) {
      all = res[0].products;
      categories = res[0].categories;

      var slug = NM.param('c') || 'all';
      category = categories.filter(function (c) { return c.slug === slug; })[0] || null;
      scope = category
        ? all.filter(function (p) { return p.category_slug === category.slug; })
        : all;

      var prices = scope.map(function (p) { return Number(p.price) || 0; });
      bounds.min = 0;
      bounds.max = Math.ceil(Math.max.apply(null, prices.concat([0])));

      NM.activeCategory = category ? category.slug : '';
      NM.searchTerm = state.query;
      NM.setContext({ page: 'category', category: category ? category.name : 'all' });

      document.title = NM.pageTitle();
      render();
    })
    .catch(function (err) { NM.showLoadError(root, err); });
})();
