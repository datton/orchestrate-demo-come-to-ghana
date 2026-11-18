/* Come to Ghana: home page behaviour. Safe on any page (it only acts when the home elements exist).
   Plan prices are read from shop/catalog.json: the browser never sets a price. */
(function () {
  'use strict';
  var list = document.getElementById('home-plans');
  if (!list) return;
  var root = (document.querySelector('script[src$="js/app.js"]') || {}).src || '';
  var base = root ? root.replace(/js\/app\.js.*$/, '') : '';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  fetch(base + 'shop/catalog.json').then(function (r) { return r.json(); }).then(function (cat) {
    var cur = cat.currency || 'EUR';
    var fmt = function (c) { try { return new Intl.NumberFormat('en-IE', { style: 'currency', currency: cur, minimumFractionDigits: c % 100 ? 2 : 0 }).format(c / 100); } catch (e) { return (c / 100) + ' ' + cur; } };
    var plans = (cat.items || []).filter(function (i) { return i.category === 'plans'; });
    if (!plans.length) return;
    list.innerHTML = plans.map(function (p) {
      var inc = (p.includes || []).slice(0, 3).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      return '<li class="shop-card"><h3>' + esc(p.name) + (p.badge ? ' <span class="shop-chip">' + esc(p.badge) + '</span>' : '') + '</h3>' +
        '<p class="home-from">From ' + fmt(p.price) + ' <span class="shop-note">our fee</span></p><p>' + esc(p.desc) + '</p><ul>' + inc + '</ul>' +
        '<a class="shop-btn" href="' + base + 'pages/services.html#' + encodeURIComponent(p.id) + '">View plan</a></li>';
    }).join('');
  }).catch(function () { /* keep the static fallback card */ });
})();
