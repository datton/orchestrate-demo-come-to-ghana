/* Come to Ghana: home page plan chooser. Safe on any page (acts only when #chooser exists).
   Names, prices, options and what each plan includes are read from shop/catalog.json; the browser never sets a price
   (the cart asks the shop service for the real quote). */
(function () {
  'use strict';
  var host = document.getElementById('chooser');
  if (!host) return;
  var src = (document.querySelector('script[src$="js/app.js"]') || {}).src || '';
  var base = src ? src.replace(/js\/app\.js.*$/, '') : '';
  var GUIDE = { tourist: 'tourist', business: 'business', property: 'property', returnee: 'diaspora', student: 'student', remote: 'remote-work' };
  var LABEL = { tourist: 'Tourist', business: 'Business', property: 'Property investor', returnee: 'Returnee', student: 'Student', remote: 'Remote worker' };
  // What is not included, from content/facts.md section 0, 1 and 2
  var NOT = {
    all: ['Government fees (set by the authority and paid separately)', 'A promise of approval: the authority decides', 'Legal, tax or immigration advice'],
    tourist: ['The e-visa fee, US$260 standard single entry (as of 18.11.2026)'],
    business: ['The e-visa fee, US$260 standard single entry (as of 18.11.2026)', 'Work or residence permits: ask us about the guide'],
    property: ['Lawyer fees, registration and any taxes or ground rent']
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  fetch(base + 'shop/catalog.json').then(function (r) { return r.json(); }).then(function (cat) {
    var cur = cat.currency || 'EUR', OPT = cat.options || {};
    var fmt = function (c) { try { return new Intl.NumberFormat('en-IE', { style: 'currency', currency: cur, minimumFractionDigits: c % 100 ? 2 : 0 }).format(c / 100); } catch (e) { return (c / 100) + ' ' + cur; } };
    var plans = (cat.items || []).filter(function (i) { return i.category === 'plans'; });
    if (!plans.length) return;
    var idx = 0, sel = {};
    var h = plans.map(function (p) { return p.id; }).indexOf(decodeURIComponent((location.hash || '').slice(1)));
    if (h >= 0) idx = h;

    host.innerHTML = '<ul class="h-tabs" role="tablist" aria-label="Traveller type"></ul><div class="h-panel" role="tabpanel" id="h-panel"></div>' +
      '<div class="h-compare"><h3>Compare every plan</h3><div class="h-scroll" tabindex="0" role="region" aria-label="Plan comparison table, scrolls sideways on small screens"><table class="h-table" id="h-table"></table></div></div>';
    var tabs = host.querySelector('.h-tabs'), panel = host.querySelector('.h-panel'), table = host.querySelector('#h-table');
    plans.forEach(function (p, i) {
      var li = document.createElement('li'); li.setAttribute('role', 'presentation');
      li.innerHTML = '<button type="button" class="h-tab" role="tab" id="h-tab-' + i + '" aria-controls="h-panel">' + esc(LABEL[p.id] || p.name) + '</button>';
      tabs.appendChild(li);
    });
    var btns = [].slice.call(tabs.querySelectorAll('.h-tab'));

    // Comparison table: rows are every distinct "includes" line in the catalog
    var rows = [];
    plans.forEach(function (p) { (p.includes || []).forEach(function (x) { if (rows.indexOf(x) < 0) rows.push(x); }); });
    var last = rows.filter(function (x) { return /^Official source links/.test(x); });
    rows = rows.filter(function (x) { return last.indexOf(x) < 0; }).concat(last);
    table.innerHTML = '<thead><tr><th scope="col"><span class="h-vh">Included</span></th>' + plans.map(function (p) {
      return '<th scope="col">' + esc(LABEL[p.id] || p.name) + '<span class="h-pr">' + fmt(p.price) + '</span></th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><th scope="row">' + esc(r) + '</th>' + plans.map(function (p) {
        return (p.includes || []).indexOf(r) >= 0 ? '<td class="on"><span aria-hidden="true">✓</span><span class="h-vh">Included</span></td>' : '<td class="off"><span aria-hidden="true">–</span><span class="h-vh">Not included</span></td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';

    function total(p) {
      var t = p.price;
      (p.options || []).forEach(function (k) {
        var o = OPT[k]; if (!o) return;
        if (o.type === 'one') { var c = o.choices.filter(function (x) { return x.id === sel[k]; })[0]; if (c) t += c.price; }
      });
      return t;
    }
    function setDefaults(p) {
      sel = {};
      (p.options || []).forEach(function (k) { var o = OPT[k]; if (!o || o.type !== 'one') return; var d = o.choices.filter(function (x) { return x.default; })[0] || o.choices[0]; sel[k] = d.id; });
    }
    function show(i, focus) {
      idx = i; var p = plans[i]; setDefaults(p);
      btns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
      panel.setAttribute('aria-labelledby', 'h-tab-' + i);
      var g = GUIDE[p.id], not = NOT.all.concat(NOT[p.id] || []);
      var opts = (p.options || []).filter(function (k) { return OPT[k] && OPT[k].type === 'one'; }).map(function (k) {
        var o = OPT[k];
        return '<fieldset class="h-opt"><legend>' + esc(o.name) + '</legend><div class="h-seg">' + o.choices.map(function (c) {
          return '<label><input type="radio" name="o-' + esc(k) + '" value="' + esc(c.id) + '" data-opt="' + esc(k) + '"' + (sel[k] === c.id ? ' checked' : '') + '><span>' + esc(c.name) + (c.price ? ' (+' + fmt(c.price) + ')' : '') + '</span></label>'; }).join('') + '</div></fieldset>'; }).join('');
      panel.innerHTML =
        '<div>' + (p.badge ? '<span class="h-badge">' + esc(p.badge) + '</span>' : '') + '<h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p>' +
        '<p class="h-price"><small>From</small> ' + fmt(p.price) + '</p><p class="h-note" style="margin-top:0">Our service fee. Government fees are extra.</p>' + opts +
        '<p class="h-total" aria-live="polite">Your total: <b id="h-total">' + fmt(total(p)) + '</b> <span class="h-note">before any coupon; the cart confirms the exact price.</span></p>' +
        '<div class="h-cta"><button type="button" class="shop-btn" data-add>Add to cart</button>' +
        '<a class="shop-btn shop-btn--ghost" href="' + base + 'pages/services.html#' + encodeURIComponent(p.id) + '">Full details</a>' +
        (g ? '<a href="' + base + 'pages/guides/' + g + '.html">Read the guide first</a>' : '') + '</div></div>' +
        '<div class="h-col"><h4>What you get</h4><ul class="h-incl">' + (p.includes || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<h4>Not included</h4><ul class="h-excl">' + not.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
      [].slice.call(table.querySelectorAll('tr')).forEach(function (tr) { tr.classList.remove('is-cur'); });
      if (focus) btns[i].focus();
    }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('.h-tab'); if (b) show(btns.indexOf(b)); });
    tabs.addEventListener('keydown', function (e) {
      var k = e.key, n = btns.length, i = idx;
      if (k === 'ArrowRight' || k === 'ArrowDown') i = (i + 1) % n;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') i = (i + n - 1) % n;
      else if (k === 'Home') i = 0; else if (k === 'End') i = n - 1; else return;
      e.preventDefault(); show(i, true);
    });
    panel.addEventListener('change', function (e) {
      var r = e.target.closest('[data-opt]'); if (!r) return;
      sel[r.getAttribute('data-opt')] = r.value;
      var t = document.getElementById('h-total'); if (t) t.textContent = fmt(total(plans[idx]));
    });
    panel.addEventListener('click', function (e) {
      if (!e.target.closest('[data-add]') || !window.Shop) return;
      var p = plans[idx], o = {};
      Object.keys(sel).forEach(function (k) { o[k] = sel[k]; });
      window.Shop.addToCart({ item: p.id, qty: 1, options: o });
    });
    show(idx);
  }).catch(function () { /* keep the static link */ });
})();
