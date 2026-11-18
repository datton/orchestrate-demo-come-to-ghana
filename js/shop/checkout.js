/* Come to Ghana: checkout. Prices come only from the shop service (POST quote); the browser shows them. */
(function () {
  'use strict';
  var S = window.Shop, app = document.getElementById('co-app'), banner = document.getElementById('co-cancelled');
  if (!app) return;
  if (!S) { window.addEventListener('load', function () { if (window.Shop) location.reload(); }); return; }

  var state = { coupon: 'best', gift: '', quote: null, busy: false };
  var el = S.esc, $ = function (id) { return document.getElementById(id); };
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function say(msg, err) { banner.hidden = false; banner.className = 'co-banner' + (err ? ' is-error' : ''); banner.textContent = msg; }

  function handleCancelled() {
    var t = S.q('cancelled'); if (!t) return;
    S.api('orders/' + encodeURIComponent(t) + '/cancel', {}).catch(function () {});
    say('Payment cancelled. Nothing was charged and your cart is still here.');
    history.replaceState(null, '', location.pathname);
  }

  function body() {
    var b = { items: S.cart(), coupon: state.coupon === 'none' ? undefined : state.coupon, customer: S.customer() };
    if (state.gift) b.giftCard = state.gift;
    return b;
  }

  function requote() {
    return S.api('quote', body()).then(function (q) { state.quote = q; draw(); }).catch(function (e) {
      if (state.gift) { state.gift = ''; var m = e.message; requote().then(function () { var g = $('co-gift-msg'); if (g) { g.textContent = m; g.className = 'co-msg is-error'; } }); return; }
      say(e.message, true);
    });
  }

  function empty() {
    app.innerHTML = '<div class="co-empty shop-card" style="grid-column:1/-1"><h2>Your cart is empty.</h2><p>Pick a plan first, then come back to check out.</p><a class="shop-btn" href="' + S.link('pages/services.html') + '">See the plans</a></div>';
  }

  function draw() {
    var q = state.quote, prof = S.get('profile', {});
    var keep = { name: ($('co-name') || {}).value, email: ($('co-email') || {}).value, gift: ($('co-gift') || {}).value };
    var lines = q.lines.map(function (l) {
      return '<li><span>' + el(l.name) + (l.qty > 1 ? ' × ' + l.qty : '') + (l.summary ? '<small>' + el(l.summary) + '</small>' : '') + '</span><span class="shop-price">' + S.money(l.total, q.currency) + '</span></li>';
    }).join('');
    var coupons = (q.usable || []).map(function (c) {
      var ok = c.amount > 0, on = (state.coupon === c.code) || (state.coupon === 'best' && q.discount && q.discount.code === c.code);
      return '<label class="co-coupon' + (ok ? '' : ' is-off') + '"><input type="radio" name="co-coupon" value="' + el(c.code) + '"' + (ok ? '' : ' disabled') + (on ? ' checked' : '') + '><span><strong>' + el(c.name) + '</strong><small>' + (ok ? 'Saves ' + S.money(c.amount, q.currency) : el(c.why || 'Not available for this cart')) + '</small></span></label>';
    }).join('');
    var wallet = S.get('wallet', []).map(function (c) { return '<button type="button" class="shop-chip" data-gift="' + el(c) + '" aria-pressed="' + (state.gift === c) + '">Gift card ' + el(String(c).slice(-4)) + '</button>'; }).join('');
    app.innerHTML =
      '<form id="co-form" class="co-main" novalidate>' +
        '<section class="shop-card co-card"><h2>Your details</h2>' +
          '<div class="shop-field"><label for="co-name">Full name</label><input id="co-name" autocomplete="name" maxlength="40" required aria-describedby="co-name-err"><span id="co-name-err" class="shop-error"></span></div>' +
          '<div class="shop-field"><label for="co-email">Email for your confirmation</label><input id="co-email" type="email" autocomplete="email" required aria-describedby="co-email-err"><span id="co-email-err" class="shop-error"></span></div>' +
          '<p class="co-msg">Demo: no email is really sent. Your confirmation appears on the next page and in My purchases.</p></section>' +
        '<section class="shop-card co-card"><h2>Coupon</h2><div class="co-coupons" role="radiogroup" aria-label="Coupon">' + coupons +
          '<label class="co-coupon"><input type="radio" name="co-coupon" value="none"' + (state.coupon === 'none' ? ' checked' : '') + '><span><strong>No coupon</strong></span></label></div></section>' +
        (q.giftCardsEnabled === false ? '' :
        '<section class="shop-card co-card"><h2>Gift card</h2><div class="co-wallet">' + wallet + '</div>' +
          '<div class="shop-field"><label for="co-gift">Gift card code</label><div class="co-inline"><input id="co-gift" autocomplete="off" spellcheck="false"><button type="button" class="shop-btn shop-btn--ghost" id="co-gift-apply">Apply</button></div><span id="co-gift-msg" class="co-msg" role="status">' + (q.giftCard ? 'Applied ' + S.money(q.giftCard.applied, q.currency) + ' from card ' + el(q.giftCard.last4) + '. Balance after: ' + S.money(q.giftCard.balanceAfter, q.currency) + '.' : '') + '</span></div></section>') +
      '</form>' +
      '<aside class="co-sum"><section class="shop-card co-card" aria-label="Order summary"><h2>Your order</h2><ul class="co-lines">' + lines + '</ul>' +
        '<div class="co-row"><span>Subtotal</span><span>' + S.money(q.subtotal, q.currency) + '</span></div>' +
        (q.discount ? '<div class="co-row is-saving"><span>' + el(q.discount.name) + '</span><span>−' + S.money(q.discount.amount, q.currency) + '</span></div>' : '') +
        (q.giftCard && q.giftCard.applied ? '<div class="co-row is-saving"><span>Gift card ' + el(q.giftCard.last4) + '</span><span>−' + S.money(q.giftCard.applied, q.currency) + '</span></div>' : '') +
        '<div class="co-row co-total"><span>Total</span><span>' + S.money(q.total, q.currency) + '</span></div>' +
        '<p id="co-err" class="co-msg is-error" role="alert"></p>' +
        '<button class="shop-btn co-pay" id="co-pay" type="submit" form="co-form">' + (q.total ? 'Pay ' + S.money(q.total, q.currency) + ' (test)' : 'Place order') + '</button>' +
        '<p class="co-msg">Demo shop: test payments only. No real money moves.</p></section></aside>';
    $('co-name').value = keep.name != null ? keep.name : (prof.name || '');
    $('co-email').value = keep.email != null ? keep.email : (prof.email || '');
    if ($('co-gift')) $('co-gift').value = keep.gift || '';
    wire();
  }

  function wire() {
    $('co-form').addEventListener('submit', submit);
    app.querySelectorAll('input[name=co-coupon]').forEach(function (r) { r.addEventListener('change', function () { state.coupon = r.value; requote(); }); });
    app.querySelectorAll('[data-gift]').forEach(function (b) { b.addEventListener('click', function () { state.gift = state.gift === b.dataset.gift ? '' : b.dataset.gift; requote(); }); });
    var ap = $('co-gift-apply');
    if (ap) ap.addEventListener('click', function () {
      var v = $('co-gift').value.trim(); if (!v) { state.gift = ''; return requote(); }
      state.gift = v; requote();
    });
  }

  function submit(e) {
    e.preventDefault(); if (state.busy) return;
    var n = $('co-name'), m = $('co-email'), ok = true;
    function bad(inp, id, msg) { $(id).textContent = msg; if (msg) { inp.setAttribute('aria-invalid', 'true'); if (ok) inp.focus(); ok = false; } else inp.removeAttribute('aria-invalid'); }
    bad(n, 'co-name-err', n.value.trim().length < 2 ? 'Please enter your name.' : '');
    bad(m, 'co-email-err', EMAIL.test(m.value.trim()) ? '' : 'Please enter a valid email address.');
    if (!ok) return;
    var prof = S.get('profile', {}); prof.name = n.value.trim(); prof.email = m.value.trim(); S.set('profile', prof);
    state.busy = true; var btn = $('co-pay'); btn.disabled = true; btn.textContent = 'Placing your order…';
    var b = body(); b.store = 'online'; b.name = prof.name; b.note = ('Email: ' + prof.email).slice(0, 200);
    S.api('orders', b).then(function (r) {
      S.addOrder(r.order.token);
      if (r.pay && r.pay.url) { location.href = r.pay.url; return; }
      S.saveCart([]); location.href = S.link('pages/order.html?o=' + encodeURIComponent(r.order.token));
    }).catch(function (err) {
      state.busy = false; btn.disabled = false; $('co-err').textContent = err.message; btn.textContent = 'Try again';
    });
  }

  handleCancelled();
  if (!S.cart().length) return empty();
  requote();
  window.addEventListener('shop:cart', function () { if (!S.cart().length) empty(); else requote(); });
})();
