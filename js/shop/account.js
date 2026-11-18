/* Come to Ghana: My purchases (pages/account.html). Orders come from orders/lookup using the tokens kept in this browser. */
(function () {
  'use strict';
  var S = window.Shop; if (!S) return;
  var app = document.getElementById('acc-app'), esc = S.esc;
  var GUIDES = {
    'guide-evisa': { slug: 'tourist', name: 'E-visa walkthrough' },
    'guide-arrival': { slug: 'tourist', name: 'First week in Ghana guide' }
  };
  function fmt(iso) {
    if (!iso) return '';
    var d = new Date(iso), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear();
  }
  function isPaid(o) { return o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded'; }

  function render(orders) {
    var paid = orders.filter(isPaid);
    if (!paid.length) {
      app.innerHTML = '<section class="ord-card"><h2>No purchases yet</h2><p>Once you have paid for a plan or a guide it appears here, and guides unlock straight away.</p>' +
        '<div class="ord-actions"><a class="shop-btn" href="' + S.link('pages/services.html') + '">See the plans</a><a class="shop-btn shop-btn--ghost" href="' + S.link('pages/guides/index.html') + '">Browse free guide pages</a></div></section>';
      return;
    }
    var unlocked = {}, html = '';
    paid.forEach(function (o) { o.lines.forEach(function (l) { if (GUIDES[l.item] && !unlocked[l.item]) unlocked[l.item] = o; }); });
    var keys = Object.keys(unlocked);
    if (keys.length) {
      html += '<section class="ord-card" aria-labelledby="acc-un"><h2 id="acc-un">Your unlocked guides</h2><ul class="ord-unlock">' + keys.map(function (k) {
        var g = GUIDES[k];
        return '<li><h3>' + esc(g.name) + '</h3><p class="ord-muted">Bought ' + fmt(unlocked[k].placedAt) + '</p><a class="shop-btn" href="' + S.link('pages/guides/' + g.slug + '.html') + '">Open the guide</a></li>';
      }).join('') + '</ul></section>';
    }
    html += '<section class="ord-card" aria-labelledby="acc-or"><h2 id="acc-or">Your orders</h2><ul class="ord-orders">' + paid.map(function (o) {
      return '<li><div class="row"><h3>Order ' + esc(o.number) + '</h3><span class="shop-chip">' + esc(o.statusLabel || o.status) + '</span></div>' +
        '<p>' + o.lines.map(function (l) { return esc(l.name) + (l.qty > 1 ? ' × ' + l.qty : ''); }).join(', ') + '</p>' +
        '<p class="ord-muted">' + fmt(o.placedAt) + ' · <span class="shop-price">' + S.money(o.total, o.currency) + '</span></p>' +
        '<div class="ord-actions"><a class="shop-btn shop-btn--ghost" href="' + S.link('pages/order.html?o=' + encodeURIComponent(o.token)) + '">Open order, receipt and next steps</a></div></li>';
    }).join('') + '</ul></section>';
    app.innerHTML = html;
  }

  function load() {
    var tokens = S.get('orders', []).slice(0, 30);
    if (!tokens.length) { render([]); return; }
    S.api('orders/lookup', { tokens: tokens }).then(function (r) { render(r.orders || []); }).catch(function (e) {
      app.innerHTML = '<div class="ord-banner is-bad" role="alert">' + esc(e.message) + '</div>';
    });
  }

  document.getElementById('acc-find').addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = document.getElementById('acc-token'), err = document.getElementById('acc-token-e'), v = inp.value.trim(), m = /o_[A-Za-z0-9_-]+/.exec(v);
    if (!m) { err.textContent = 'Paste the link from your confirmation page.'; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
    err.textContent = ''; inp.removeAttribute('aria-invalid');
    S.api('orders/' + encodeURIComponent(m[0])).then(function (r) { var o = r.order || r; S.addOrder(o.token); inp.value = ''; S.toast('Order ' + o.number + ' added'); load(); })
      .catch(function (x) { err.textContent = x.message; inp.setAttribute('aria-invalid', 'true'); });
  });
  load();
})();
