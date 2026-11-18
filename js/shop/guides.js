/* Come to Ghana: guides index. Lists every guide, filters by traveller type, shows the matching plan price from shop/catalog.json. */
(function () {
  'use strict';
  var GUIDES = [
    { slug: 'tourist', type: 'Visitor', title: 'Visiting Ghana', blurb: 'Plan a trip: visa, health declaration and what to prepare before you fly.' },
    { slug: 'diaspora', type: 'Diaspora', title: 'Returning to Ghana', blurb: 'For people with Ghanaian roots coming home: entry, Ghana Card and residence questions.' },
    { slug: 'business', type: 'Business', title: 'Doing business in Ghana', blurb: 'Travelling for meetings, work permits, tax and bringing equipment.' },
    { slug: 'remote-work', type: 'Remote work', title: 'Working remotely from Ghana', blurb: 'What is and is not confirmed about working remotely while you are in Ghana.' },
    { slug: 'property', type: 'Property', title: 'Buying property in Ghana', blurb: 'Leasehold rules, due diligence and the paperwork before you commit.' },
    { slug: 'student', type: 'Student', title: 'Studying in Ghana', blurb: 'The route for international students and what to prepare on arrival.' }
  ];
  var list = document.getElementById('guide-list');
  if (!list) return;
  var filters = document.getElementById('guide-filters');
  var count = document.getElementById('guide-count');
  var active = 'All', plans = {};
  var ALIAS = { diaspora: 'returnee', 'remote-work': 'remote' };

  function esc(s) { return window.Shop ? Shop.esc(s) : String(s); }

  function render() {
    var shown = GUIDES.filter(function (g) { return active === 'All' || g.type === active; });
    list.innerHTML = shown.map(function (g) {
      var p = plans[g.slug];
      var price = p ? '<div class="g-plan">From<strong class="shop-price">' + esc(window.Shop ? Shop.money(p.price) : p.price) + '</strong></div>' : '';
      return '<li><article class="g-row">' +
        '<h3><a href="' + g.slug + '.html">' + esc(g.title) + '</a></h3>' + price +
        '<div class="g-meta"><p class="eyebrow g-type">' + esc(g.type) + '</p><p>' + esc(g.blurb) + '</p></div></article></li>';
    }).join('');
    if (count) count.textContent = shown.length === 1 ? '1 guide' : shown.length + ' guides';
  }

  if (filters) {
    var types = ['All'].concat(GUIDES.map(function (g) { return g.type; }));
    filters.innerHTML = types.map(function (t) {
      return '<button type="button" aria-pressed="' + (t === active) + '" data-type="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-type]');
      if (!b) return;
      active = b.dataset.type;
      filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  }

  render();

  // Plans come from the catalog; an item matches a guide when its id or "guide" field names the guide slug, or the id is the guide's alias (ALIAS).
  if (window.Shop) Shop.catalog().then(function (c) {
    (c.items || []).forEach(function (it) {
      GUIDES.forEach(function (g) {
        if (!plans[g.slug] && (it.guide === g.slug || it.id === (ALIAS[g.slug] || g.slug) || (it.id || '').indexOf(g.slug) !== -1)) plans[g.slug] = it;
      });
    });
    render();
  }).catch(function () {});
})();
