/* Come to Ghana: home page plan chooser. Safe on any page (acts only when #chooser exists).
   Names, prices and what is included are read from shop/catalog.json; the browser never sets a price. */
(function () {
  'use strict';
  var host = document.getElementById('chooser');
  if (!host) return;
  var src = (document.querySelector('script[src$="js/app.js"]') || {}).src || '';
  var base = src ? src.replace(/js\/app\.js.*$/, '') : '';
  var GUIDE = { tourist: 'tourist', business: 'business', property: 'property', returnee: 'diaspora', student: 'student', remote: 'remote-work' };
  var LABEL = { tourist: 'Tourist', business: 'Business', property: 'Property investor', returnee: 'Returnee', student: 'Student', remote: 'Remote worker' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  fetch(base + 'shop/catalog.json').then(function (r) { return r.json(); }).then(function (cat) {
    var cur = cat.currency || 'EUR';
    var fmt = function (c) { try { return new Intl.NumberFormat('en-IE', { style: 'currency', currency: cur, minimumFractionDigits: c % 100 ? 2 : 0 }).format(c / 100); } catch (e) { return (c / 100) + ' ' + cur; } };
    var plans = (cat.items || []).filter(function (i) { return i.category === 'plans'; });
    if (!plans.length) return;
    var cur_i = 0;
    var hashIdx = plans.map(function (p) { return p.id; }).indexOf(decodeURIComponent((location.hash || '').slice(1)));
    if (hashIdx >= 0) cur_i = hashIdx;

    host.innerHTML = '<ul class="h-tabs" role="tablist" aria-label="Traveller type"></ul><div class="h-panel" role="tabpanel" id="h-panel" aria-live="polite"></div>';
    var tabs = host.querySelector('.h-tabs'), panel = host.querySelector('.h-panel');
    plans.forEach(function (p, i) {
      var li = document.createElement('li'); li.setAttribute('role', 'presentation');
      li.innerHTML = '<button type="button" class="h-tab" role="tab" id="h-tab-' + i + '" aria-controls="h-panel">' + esc(LABEL[p.id] || p.name) + '</button>';
      tabs.appendChild(li);
    });
    var btns = [].slice.call(tabs.querySelectorAll('.h-tab'));

    function show(i, focus) {
      cur_i = i; var p = plans[i];
      btns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
      panel.setAttribute('aria-labelledby', 'h-tab-' + i);
      var g = GUIDE[p.id];
      panel.innerHTML =
        '<div><h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p>' +
        '<p class="h-price"><small>From</small> ' + fmt(p.price) + ' <small>our fee</small></p>' +
        '<p class="h-note">Government fees are extra and paid to the authority. Not legal, tax or immigration advice.</p>' +
        '<div class="h-cta"><button type="button" class="shop-btn" data-add="' + esc(p.id) + '">Add to cart</button>' +
        '<a class="shop-btn shop-btn--ghost" href="' + base + 'pages/services.html#' + encodeURIComponent(p.id) + '">Options and details</a>' +
        (g ? '<a href="' + base + 'pages/guides/' + g + '.html">Read the guide</a>' : '') + '</div></div>' +
        '<ul class="h-incl">' + (p.includes || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      if (focus) btns[i].focus();
    }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('.h-tab'); if (b) show(btns.indexOf(b)); });
    tabs.addEventListener('keydown', function (e) {
      var k = e.key, n = btns.length, i = cur_i;
      if (k === 'ArrowRight' || k === 'ArrowDown') i = (i + 1) % n;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') i = (i + n - 1) % n;
      else if (k === 'Home') i = 0; else if (k === 'End') i = n - 1; else return;
      e.preventDefault(); show(i, true);
    });
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-add]'); if (!b || !window.Shop) return;
      var p = plans[cur_i], o = {};
      if ((p.options || []).indexOf('speed') >= 0) o.speed = 'standard';
      if ((p.options || []).indexOf('travellers') >= 0) o.travellers = '1';
      window.Shop.addToCart({ item: p.id, qty: 1, options: o });
    });
    show(cur_i);
  }).catch(function () { /* keep the static link */ });
})();
