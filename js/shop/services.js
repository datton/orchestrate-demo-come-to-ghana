/* Come to Ghana: services page. Prices shown come from shop/catalog.json; the shop service re-prices every order. */
(function () {
  'use strict';
  var Shop = window.Shop;
  var list = document.getElementById('sv-list'), bar = document.getElementById('sv-filters');
  if (!Shop || !list) return;
  var cat, current = 'all';

  function group(cat, id) { return cat.options[id]; }
  function defaults(it) {
    var o = {};
    (it.options || []).forEach(function (g) {
      var grp = group(cat, g); if (!grp) return;
      if (grp.type === 'one') {
        var ch = (it.choices && it.choices[g]) ? grp.choices.filter(function (c) { return it.choices[g].indexOf(c.id) >= 0; }) : grp.choices;
        var d = ch.filter(function (c) { return c.default; })[0] || ch[0]; o[g] = d.id;
      } else o[g] = [];
    });
    return o;
  }
  function est(it, sel) {
    var t = it.price;
    (it.options || []).forEach(function (g) {
      var grp = group(cat, g), v = sel[g]; if (!grp) return;
      (Array.isArray(v) ? v : [v]).forEach(function (id) {
        var c = grp.choices.filter(function (x) { return x.id === id; })[0]; if (c) t += c.price;
      });
    });
    return t;
  }

  function card(it) {
    var li = document.createElement('li');
    li.className = 'shop-card sv-card'; li.id = 'svc-' + it.id;
    var sel = defaults(it), uid = 'sv-' + it.id;
    var h = '';
    if (it.badge) h += '<span class="shop-chip">' + Shop.esc(it.badge) + '</span>';
    h += '<h3>' + Shop.esc(it.name) + '</h3><p class="sv-desc">' + Shop.esc(it.desc) + '</p>';
    h += '<ul class="sv-inc">' + (it.includes || []).map(function (x) { return '<li>' + Shop.esc(x) + '</li>'; }).join('') + '</ul>';
    (it.options || []).forEach(function (g) {
      var grp = group(cat, g); if (!grp) return;
      h += '<fieldset class="sv-opt"><legend>' + Shop.esc(grp.name) + '</legend>';
      grp.choices.forEach(function (c) {
        if (it.choices && it.choices[g] && it.choices[g].indexOf(c.id) < 0) return;
        var type = grp.type === 'one' ? 'radio' : 'checkbox';
        h += '<label><input type="' + type + '" name="' + uid + '-' + g + '" value="' + Shop.esc(c.id) + '"' +
          (grp.type === 'one' && sel[g] === c.id ? ' checked' : '') + ' data-g="' + g + '"> <span>' + Shop.esc(c.name) +
          '</span> <span class="sv-plus">' + (c.price ? '+' + Shop.money(c.price) : 'included') + '</span></label>';
      });
      h += '</fieldset>';
    });
    h += '<div class="sv-foot"><p class="sv-price"><span class="sv-from">from</span> <output>' + Shop.money(est(it, sel)) + '</output></p>' +
      '<button type="button" class="shop-btn">Add to cart</button></div>';
    li.innerHTML = h;
    var out = li.querySelector('output');
    li.addEventListener('change', function (e) {
      var g = e.target.getAttribute('data-g'); if (!g) return;
      var grp = group(cat, g);
      if (grp.type === 'one') sel[g] = e.target.value;
      else {
        var vals = [].slice.call(li.querySelectorAll('input[data-g="' + g + '"]:checked')).map(function (i) { return i.value; });
        if (grp.max && vals.length > grp.max) { e.target.checked = false; return; }
        sel[g] = vals;
      }
      out.textContent = Shop.money(est(it, sel));
    });
    li.querySelector('button').addEventListener('click', function () {
      Shop.addToCart({ item: it.id, qty: 1, options: JSON.parse(JSON.stringify(sel)) });
    });
    return li;
  }

  function render() {
    list.innerHTML = '';
    var n = 0;
    cat.categories.forEach(function (c) {
      if (current !== 'all' && c.id !== current) return;
      var items = cat.items.filter(function (i) { return i.category === c.id && !i.soldOut; });
      if (!items.length) return;
      var head = document.createElement('li'); head.className = 'sv-cathead';
      head.innerHTML = '<h2>' + Shop.esc(c.name) + '</h2><p>' + Shop.esc(c.blurb || '') + '</p>';
      list.appendChild(head);
      items.forEach(function (i) { list.appendChild(card(i)); n++; });
    });
    document.getElementById('sv-count').textContent = n + ' item' + (n === 1 ? '' : 's') + ' shown';
  }

  Shop.catalog().then(function (c) {
    cat = c;
    [{ id: 'all', name: 'All' }].concat(c.categories).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'shop-chip'; b.textContent = k.name;
      b.setAttribute('aria-pressed', k.id === current ? 'true' : 'false');
      b.addEventListener('click', function () {
        current = k.id;
        bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
      bar.appendChild(b);
    });
    render();
    if (location.hash) { var t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
  }).catch(function () {
    list.innerHTML = '<li class="shop-error">We could not load the services. Please refresh the page.</li>';
  });
})();
