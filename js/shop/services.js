/* Come to Ghana: plans page. Shows prices from shop/catalog.json; the shop service re-prices every order. */
(function () {
  'use strict';
  var Shop = window.Shop;
  var cat;
  if (!Shop || !document.getElementById('sv-panel')) return;

  function grp(id) { return cat.options[id]; }
  function allowed(it, g) {
    var gr = grp(g); return gr.choices.filter(function (c) { return !(it.choices && it.choices[g]) || it.choices[g].indexOf(c.id) >= 0; });
  }
  function defaults(it) {
    var o = {};
    (it.options || []).forEach(function (g) {
      var gr = grp(g); if (!gr) return;
      if (gr.type === 'one') { var ch = allowed(it, g); o[g] = (ch.filter(function (c) { return c.default; })[0] || ch[0]).id; } else o[g] = [];
    });
    return o;
  }
  function total(it, sel) {
    var t = it.price;
    (it.options || []).forEach(function (g) {
      var gr = grp(g); if (!gr) return;
      [].concat(sel[g]).forEach(function (id) { var c = gr.choices.filter(function (x) { return x.id === id; })[0]; if (c) t += c.price; });
    });
    return t;
  }

  function optionsHtml(it, uid) {
    var h = '';
    (it.options || []).forEach(function (g) {
      var gr = grp(g); if (!gr) return;
      h += '<fieldset class="sv-opt"><legend>' + Shop.esc(gr.name) + '</legend>';
      allowed(it, g).forEach(function (c) {
        h += '<label><input type="' + (gr.type === 'one' ? 'radio' : 'checkbox') + '" name="' + uid + '-' + g + '" value="' + Shop.esc(c.id) + '"' +
          (c.default ? ' checked' : '') + ' data-g="' + g + '"><span>' + Shop.esc(c.name) + '</span><span class="sv-plus">' +
          (c.price ? '+' + Shop.money(c.price) : 'included') + '</span></label>';
      });
      h += '</fieldset>';
    });
    return h;
  }

  function wire(li, it) {
    var sel = defaults(it), out = li.querySelector('output'), btn = li.querySelector('button');
    li.addEventListener('change', function (e) {
      var g = e.target.getAttribute('data-g'); if (!g) return;
      if (grp(g).type === 'one') sel[g] = e.target.value;
      else {
        var v = [].slice.call(li.querySelectorAll('input[data-g="' + g + '"]:checked')).map(function (i) { return i.value; });
        if (grp(g).max && v.length > grp(g).max) { e.target.checked = false; return; }
        sel[g] = v;
      }
      out.textContent = Shop.money(total(it, sel));
    });
    btn.addEventListener('click', function () { Shop.addToCart({ item: it.id, qty: 1, options: JSON.parse(JSON.stringify(sel)) }); });
  }

  var PICK = { tourist: 'Visit as a tourist', business: 'Do business', property: 'Invest in property', returnee: 'Move home or return', student: 'Study', remote: 'Work remotely' };
  var plans, panelEl, pickEl;

  function show(id) {
    var it = plans.filter(function (p) { return p.id === id; })[0]; if (!it) return;
    [].forEach.call(pickEl.querySelectorAll('input'), function (i) { i.checked = i.value === id; });
    var inc = cat.features.filter(function (f) { return it.features.indexOf(f.id) >= 0; });
    var out = cat.features.filter(function (f) { return it.features.indexOf(f.id) < 0; });
    panelEl.className = 'sv-panel' + (it.badge ? ' is-feature' : '');
    panelEl.id = 'svc-' + it.id;
    panelEl.innerHTML = '<div class="sv-inner"><div class="sv-buy">' + (it.badge ? '<span class="sv-badge">' + Shop.esc(it.badge) + '</span>' : '') +
      '<h3>' + Shop.esc(it.name) + '</h3><p class="sv-price"><span class="sv-from">from</span> <output>' + Shop.money(total(it, defaults(it))) + '</output></p>' +
      '<p class="sv-vat">Our service fee. Government fees are extra.</p><p class="sv-desc">' + Shop.esc(it.desc) + '</p>' +
      optionsHtml(it, 'p-' + it.id) + '<button type="button" class="shop-btn sv-add">Add to cart</button></div>' +
      '<div class="sv-what"><h4>Included</h4><ul class="sv-check">' + inc.map(function (f) { return '<li>' + Shop.esc(f.name) + '</li>'; }).join('') + '<li>Standard or express review, your choice</li></ul>' +
      '<h4>Not included</h4><ul class="sv-cross">' + out.filter(function (f) { return f.id !== 'sources'; }).map(function (f) { return '<li><span class="sv-sr">Not included: </span>' + Shop.esc(f.name) + '</li>'; }).join('') +
      '<li><span class="sv-sr">Not included: </span>Government and authority fees, paid by you</li></ul></div></div>';
    wire(panelEl.firstChild, it);
    try { history.replaceState(null, '', '#plans'); } catch (e) {}
  }

  function buildPicker() {
    pickEl.innerHTML = plans.map(function (p, i) {
      return '<label class="sv-pill"><input type="radio" name="sv-plan" value="' + p.id + '"' + (i === 0 ? ' checked' : '') + '><span>' + Shop.esc(PICK[p.id] || p.name) +
        '</span><small>' + Shop.money(p.price) + (p.badge ? ' · ' + Shop.esc(p.badge) : '') + '</small></label>';
    }).join('');
    pickEl.addEventListener('change', function (e) { if (e.target.name === 'sv-plan') show(e.target.value); });
  }

  function miniCard(it) {
    var li = document.createElement('li'); li.id = 'svc-' + it.id; li.className = 'sv-mini'; li.setAttribute('data-reveal', '');
    li.innerHTML = '<div><h3>' + Shop.esc(it.name) + '</h3><p>' + Shop.esc(it.desc) + '</p>' +
      '<ul class="sv-check">' + (it.includes || []).map(function (x) { return '<li>' + Shop.esc(x) + '</li>'; }).join('') + '</ul>' + optionsHtml(it, 'm-' + it.id) + '</div>' +
      '<div class="sv-mini-buy"><p class="sv-price"><output>' + Shop.money(total(it, defaults(it))) + '</output></p><button type="button" class="shop-btn sv-add">Add to cart</button></div>';
    wire(li, it); return li;
  }

  function table(plans) {
    var t = document.getElementById('sv-table');
    var h = '<caption class="sv-sr">Which features each plan includes</caption><thead><tr><th scope="col">Feature</th>' +
      plans.map(function (p) { return '<th scope="col"' + (p.badge ? ' class="is-feat"' : '') + '>' + Shop.esc(p.name) + '<span class="sv-th-price">from ' + Shop.money(p.price) + '</span></th>'; }).join('') + '</tr></thead><tbody>';
    cat.features.forEach(function (f) {
      h += '<tr><th scope="row">' + Shop.esc(f.name) + '</th>' + plans.map(function (p) {
        var y = (p.features || []).indexOf(f.id) >= 0;
        return '<td' + (p.badge ? ' class="is-feat"' : '') + '>' + (y ? '<span class="sv-yes" aria-hidden="true">✓</span><span class="sv-sr">Included</span>' : '<span class="sv-no" aria-hidden="true">–</span><span class="sv-sr">Not included</span>') + '</td>';
      }).join('') + '</tr>';
    });
    h += '<tr><th scope="row">Standard or express review</th>' + plans.map(function (p) { return '<td' + (p.badge ? ' class="is-feat"' : '') + '><span class="sv-yes" aria-hidden="true">✓</span><span class="sv-sr">Included</span></td>'; }).join('') + '</tr>';
    t.innerHTML = h + '</tbody>';
  }

  function fill(id, items, make) { var ul = document.getElementById(id); items.forEach(function (it, i) { ul.appendChild(make(it, i)); }); }

  Shop.catalog().then(function (c) {
    cat = c;
    plans = c.items.filter(function (i) { return i.category === 'plans' && !i.soldOut; });
    pickEl = document.getElementById('sv-pick'); panelEl = document.getElementById('sv-panel'); buildPicker(); show(plans[0].id);
    table(plans);
    fill('sv-guides', c.items.filter(function (i) { return i.category === 'guides' && !i.soldOut; }), miniCard);
    fill('sv-extras', c.items.filter(function (i) { return i.category === 'addons' && !i.soldOut; }), miniCard);
    if (location.hash) { var t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
  }).catch(function () {
    document.getElementById('sv-panel').innerHTML = '<li class="shop-error">We could not load the plans. Please refresh the page.</li>';
  });
})();
