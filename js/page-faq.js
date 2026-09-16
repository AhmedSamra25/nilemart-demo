/* ============================================================================
   page-faq.js — 73 answers in 18 topics, as an accordion with a search box.
   ========================================================================= */

(function () {
  'use strict';

  var NM = window.NM;
  var root = document.querySelector('[data-faq]');
  var topics = [];
  var query = '';
  var activeTopic = 'all';
  var open = {};

  NM.pageTitle = function () { return NM.t('faqTitle') + ' — ' + NM.t('brandName'); };

  function matches(item, topic) {
    if (!query) return true;
    var q = query.toLowerCase();
    return [
      item.question, item.question_ar, item.answer, item.answer_ar,
      (item.keywords || []).join(' '), (item.keywords_ar || []).join(' '),
      topic.topic, topic.topic_ar,
    ].join(' ').toLowerCase().indexOf(q) > -1;
  }

  function qa(item) {
    var isOpen = !!open[item.id];
    return '' +
      '<div class="qa">' +
        '<button class="qa__q" type="button" data-qa="' + NM.esc(item.id) + '" ' +
          'aria-expanded="' + isOpen + '" aria-controls="a-' + NM.esc(item.id) + '">' +
          '<span>' + NM.esc(NM.pick(item, 'question')) + '</span>' +
          '<span class="qa__mark" aria-hidden="true"></span>' +
        '</button>' +
        '<div class="qa__a" id="a-' + NM.esc(item.id) + '"' + (isOpen ? '' : ' hidden') + '>' +
          '<p>' + NM.esc(NM.pick(item, 'answer')) + '</p>' +
        '</div>' +
      '</div>';
  }

  function render() {
    if (!root) return;

    var shown = topics.map(function (t) {
      if (activeTopic !== 'all' && t.slug !== activeTopic) return null;
      var items = t.items.filter(function (i) { return matches(i, t); });
      return items.length ? { topic: t, items: items } : null;
    }).filter(Boolean);

    var total = shown.reduce(function (n, g) { return n + g.items.length; }, 0);

    var chips = '<div class="topicnav">' +
      '<button type="button" data-topic="all" aria-pressed="' + (activeTopic === 'all') + '">' +
        NM.esc(NM.t('faqAllTopics')) + '</button>' +
      topics.map(function (t) {
        return '<button type="button" data-topic="' + NM.esc(t.slug) + '" ' +
          'aria-pressed="' + (activeTopic === t.slug) + '">' +
          NM.esc(NM.lang === 'ar' ? t.topic_ar : t.topic) + '</button>';
      }).join('') +
    '</div>';

    var body = shown.length
      ? shown.map(function (g) {
          var alt = NM.lang === 'ar' ? g.topic.topic : g.topic.topic_ar;
          return '<section class="faq-topic">' +
            '<h2>' + NM.esc(NM.lang === 'ar' ? g.topic.topic_ar : g.topic.topic) +
              '<span>' + NM.esc(alt) + '</span></h2>' +
            g.items.map(qa).join('') +
          '</section>';
        }).join('')
      : '<div class="empty">' +
          '<img src="assets/nilemart-logo-stacked.svg" alt="">' +
          '<h2>' + NM.esc(NM.t('faqNoResults')) + '</h2>' +
          '<p>' + NM.esc(NM.t('faqNoResultsHint')) + '</p>' +
        '</div>';

    root.innerHTML =
      '<div class="wrap page-head">' +
        '<h1>' + NM.esc(NM.t('faqTitle')) +
          '<span class="section-head__alt">' +
            NM.esc(window.I18N[NM.lang === 'ar' ? 'en' : 'ar'].faqTitle) + '</span>' +
        '</h1>' +
        '<p>' + NM.esc(NM.t('faqLead')) + '</p>' +
      '</div>' +
      '<div class="wrap section section--flush page-end">' +
        '<div class="faq-search">' +
          '<span class="search-icon">' + NM.icon('search') + '</span>' +
          '<label class="visually-hidden" for="faq-q">' +
            NM.esc(NM.t('faqSearchPlaceholder')) + '</label>' +
          '<input id="faq-q" class="search-field" type="search" data-faq-search ' +
            'autocomplete="off" placeholder="' +
            NM.esc(NM.t('faqSearchPlaceholder')) + '" value="' + NM.esc(query) + '">' +
        '</div>' +
        chips +
        '<p class="toolbar__count" style="margin-block-end:18px">' +
          NM.esc(NM.t('faqMatches', { n: NM.number(total) })) + '</p>' +
        body +
      '</div>';

    bind();
  }

  function bind() {
    var box = root.querySelector('[data-faq-search]');
    if (box) {
      box.addEventListener('input', function () {
        query = box.value.trim();
        render();
        var again = root.querySelector('[data-faq-search]');
        if (again) {
          again.focus();
          again.setSelectionRange(again.value.length, again.value.length);
        }
      });
    }

    root.querySelectorAll('[data-topic]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeTopic = btn.dataset.topic;
        render();
      });
    });

    root.querySelectorAll('[data-qa]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.qa;
        open[id] = !open[id];
        var panel = root.querySelector('#a-' + CSS.escape(id));
        btn.setAttribute('aria-expanded', String(!!open[id]));
        if (panel) panel.hidden = !open[id];
      });
    });
  }

  NM.onRender(render);
  NM.setContext({ page: 'faq' });

  NM.load(['faq'])
    .then(function (res) {
      topics = res[0];
      document.title = NM.pageTitle();
      render();
    })
    .catch(function (err) { NM.showLoadError(root, err); });
})();
