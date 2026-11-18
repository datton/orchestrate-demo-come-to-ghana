/* Come to Ghana: guides index. Lists every guide, filters by traveller type, shows the matching plan price from shop/catalog.json. */
(function () {
  'use strict';
  var GUIDES = [
    { slug: 'tourist', type: 'Visitor', title: 'Visiting Ghana', blurb: 'Plan a short trip: what to prepare before you fly and what to check on arrival.' },
    { slug: 'diaspora', type: 'Diaspora', title: 'Returning to Ghana', blurb: 'For people with Ghanaian roots coming home to visit, reconnect or settle.' },
    { slug: 'business', type: 'Business', title: 'Doing business in Ghana', blurb: 'Travelling for meetings, or setting up and registering a business.' },
    { slug: 'remote-work', type: 'Remote work', title: 'Working remotely from Ghana', blurb: 'Stay longer while you keep your job or clients abroad.' },
    { slug: 'property', type: 'Property', title: 'Buying property in Ghana', blurb: 'The steps, checks and paperwork before you commit to a purchase.' },
    { slug: 'student', type: 'Student', title: 'Studying in Ghana', blurb: 'Admission, permits and arrival steps for international students.' }
  ];
  var list = document.getElementById('guide-list');
  if (!list) return;
  var filters = document.getElementById('guide-filters');
  var count = document.getElementById('guide-count');
  var active = 'All', plans = {};

  function esc(s) { return window.Shop ? Shop.esc(s) : String(s); }

  function render() {
    var shown = GUIDES.filter(function (g) { return active === 'All' || g.type === active; });
    list.innerHTML = shown.map(function (g) {
      var p = plans[g.slug];
      var price = p ? '<p class="guide-plan">Matching plan: <span class="shop-price">' + esc(window.Shop ? Shop.money(p.price) : p.price) + '</span></p>' : '';
      return '<li class="shop-card guide-card" data-reveal>' +
        '<span class="shop-chip">' + esc(g.type) + '</span>' +
        '<h3><a href="' + g.slug + '.html">' + esc(g.title) + '</a></h3>' +
        '<p>' + esc(g.blurb) + '</p>' + price +
        '<a class="shop-btn shop-btn--ghost" href="' + g.slug + '.html" aria-label="Read the guide: ' + esc(g.title) + '">Read the guide</a></li>';
    }).join('');
    if (count) count.textContent = shown.length === 1 ? '1 guide' : shown.length + ' guides';
    list.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
  }

  if (filters) {
    var types = ['All'].concat(GUIDES.map(function (g) { return g.type; }));
    filters.innerHTML = types.map(function (t) {
      return '<button type="button" class="shop-chip" aria-pressed="' + (t === active) + '" data-type="' + esc(t) + '">' + esc(t) + '</button>';
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

  // Plans come from the catalog; an item matches a guide when its id or "guide" field names the guide slug.
  if (window.Shop) Shop.catalog().then(function (c) {
    (c.items || []).forEach(function (it) {
      GUIDES.forEach(function (g) {
        if (!plans[g.slug] && (it.guide === g.slug || (it.id || '').indexOf(g.slug) !== -1)) plans[g.slug] = it;
      });
    });
    render();
  }).catch(function () {});
})();
