/* ============================================================================
   page-policies.js — one policy document with a sidebar listing all six.

   English mode renders the document's English sections; Arabic mode renders
   the Arabic section each file ends with. Neither is translated — both are
   verbatim from the source .txt.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;
  var root = document.querySelector('[data-policies]');
  var docs = [];
  var doc = null;

  NM.pageTitle = function () {
    return (doc ? label(doc) : NM.t('policiesTitle')) + ' — ' + NM.t('brandName');
  };

  /** Sidebar label: the English document label, or the document's own Arabic
      title with the brand prefix trimmed off. */
  function label(d) {
    if (NM.lang === 'ar') {
      return (d.title_ar || d.title).replace(/^[^—-]*[—-]\s*/, '');
    }
    return d.label;
  }

  function nodes(list) {
    return (list || []).map(function (n) {
      if (n.type === 'pre') {
        return '<pre>' + NM.esc(n.text) + '</pre>';
      }
      if (n.type === 'ul') {
        return '<ul>' + n.items.map(function (i) {
          return '<li>' + NM.esc(i) + '</li>';
        }).join('') + '</ul>';
      }
      if (n.type === 'h') {
        return '<h3>' + NM.esc(n.text) + '</h3>';
      }
      var marker = n.marker
        ? '<span class="doc__marker">' + NM.esc(n.marker) + '</span>'
        : '';
      return '<p>' + marker + NM.esc(n.text) + '</p>';
    }).join('');
  }

  function documentBody(d) {
    if (NM.lang === 'ar') {
      if (!d.arabic) return '<p>' + NM.esc(NM.t('policyNotFound')) + '</p>';
      return '<section>' + nodes(d.arabic.nodes) + '</section>';
    }
    return d.sections.map(function (s) {
      return '<section>' +
        '<h2>' +
          (s.number ? '<span class="doc__num">' + NM.esc(s.number) + '.</span>' : '') +
          NM.esc(s.title) +
        '</h2>' +
        nodes(s.nodes) +
      '</section>';
    }).join('');
  }

  function sidebar() {
    return '<nav class="policy-nav" aria-label="' + NM.esc(NM.t('policyDocuments')) + '">' +
      '<span class="filters__legend">' + NM.esc(NM.t('policyDocuments')) + '</span>' +
      docs.map(function (d) {
        var on = doc && d.slug === doc.slug;
        return '<a href="policies.html?p=' + encodeURIComponent(d.slug) + '"' +
          (on ? ' aria-current="page"' : '') + '>' + NM.esc(label(d)) + '</a>';
      }).join('') +
    '</nav>';
  }

  function render() {
    if (!root) return;

    if (!doc) {
      root.innerHTML =
        '<div class="wrap section page-end"><div class="empty">' +
          '<img src="assets/nilemart-logo-stacked.svg" alt="">' +
          '<h2>' + NM.esc(NM.t('policyNotFound')) + '</h2>' +
          '<a class="btn btn--primary" href="index.html">' +
            NM.esc(NM.t('backToHome')) + '</a>' +
        '</div></div>';
      return;
    }

    var title = NM.lang === 'ar' ? doc.title_ar : doc.title;
    var sub = NM.lang === 'ar' ? doc.title : doc.title_ar;

    root.innerHTML =
      '<div class="wrap section">' +
        '<div class="layout-side">' +
          sidebar() +
          '<article class="doc">' +
            '<h1>' + NM.esc(title) + '</h1>' +
            '<p class="doc__ar">' + NM.esc(sub) + '</p>' +
            (NM.lang !== 'ar' && doc.meta && doc.meta.length
              ? '<div class="doc__meta">' + doc.meta.map(function (m) {
                  return '<div>' + NM.esc(m) + '</div>';
                }).join('') + '</div>'
              : '') +
            documentBody(doc) +
          '</article>' +
        '</div>' +
      '</div>';
  }

  NM.onRender(render);

  NM.load(['policies'])
    .then(function (res) {
      docs = res[0];
      var slug = NM.param('p') || docs[0].slug;
      doc = docs.filter(function (d) { return d.slug === slug; })[0] || null;
      NM.setContext({ page: 'policies', category: doc ? doc.slug : null });
      document.title = NM.pageTitle();
      render();
    })
    .catch(function (err) { NM.showLoadError(root, err); });
})();
