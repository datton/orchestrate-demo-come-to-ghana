/* Come to Ghana: order confirmation (pages/order.html?o=<token>). */
(function () {
  'use strict';
  var S = window.Shop; if (!S) return;
  var app = document.getElementById('ord-app'), title = document.getElementById('ord-title'), eyebrow = document.getElementById('ord-eyebrow');
  var token = S.q('o'), timer = null, cat = null, order = null;
  var esc = S.esc;

  function headline(text) {
    title.setAttribute('aria-label', text);
    title.innerHTML = text.split(' ').map(function (w, i) { return '<span class="ow" aria-hidden="true" style="--i:' + i + '">' + esc(w) + '</span>'; }).join(' ');
  }
  function fmt(iso) {
    if (!iso) return '';
    var d = new Date(iso), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  var GUIDE = { 'guide-evisa': 'tourist', 'guide-arrival': 'tourist', tourist: 'tourist', business: 'business', property: 'property', returnee: 'diaspora', student: 'student', remote: 'remote-work' };
  var PREP = {
    tourist: ['Passport valid for 6 months or more', 'A photo taken in the last 3 months', 'Return ticket or itinerary, and proof of accommodation', 'Yellow fever certificate'],
    business: ['Everything for the Tourist plan', 'An employer letter', 'An invitation letter from your Ghanaian host (our template helps)'],
    property: ['The details of any property you are considering', 'Your questions for a lawyer'],
    returnee: ['Your passport and any Ghanaian documents you hold', 'Your plans for how long you will stay'],
    student: ['Your admission letter, if you have one', 'Your passport and a recent photo'],
    remote: ['Your passport', 'Proof of remote employment or client work'],
    'express-docs': ['The documents you want reviewed, ready to describe', 'One question for the follow-up']
  };
  function optNames(l) { return (l.options || []).map(function (o) { return o.name; }).join(', ') || l.summary || ''; }

  function nextSteps(o) {
    return o.lines.map(function (l) {
      var base = l.item, prep = PREP[base], isGuide = /^guide-/.test(base), g = GUIDE[base];
      var html = '<li><h3>' + esc(l.name) + (l.qty > 1 ? ' × ' + l.qty : '') + '</h3>';
      if (isGuide) {
        html += '<p>Unlocked now. Open it any time from My purchases.</p><div class="ord-actions"><a class="shop-btn" href="' + S.link('pages/guides/' + g + '.html') + '">Open the guide</a></div>';
      } else {
        html += '<p>' + (/express/.test(optNames(l).toLowerCase()) ? 'Express review: we aim to come back to you within 1 working day.' : 'We review it and come back to you within 3 working days.') + ' You will see progress on this page and in My purchases.</p>';
        if (prep) html += '<p><strong>Get ready:</strong></p><ul>' + prep.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
        if (g) html += '<p><a href="' + S.link('pages/guides/' + g + '.html') + '">Read the matching guide</a></p>';
      }
      return html + '</li>';
    }).join('');
  }

  function receipt(o) {
    var L = ['COME TO GHANA: RECEIPT (demo shop, test payment, no real money moved)', '',
      'Order number: ' + o.number, 'Order code: ' + o.code, 'Placed: ' + fmt(o.placedAt), 'Name: ' + o.name, ''];
    o.lines.forEach(function (l) { L.push(l.qty + ' x ' + l.name + (optNames(l) ? ' (' + optNames(l) + ')' : '') + '  ' + S.money(l.total, o.currency)); });
    L.push('', 'Subtotal: ' + S.money(o.subtotal, o.currency));
    if (o.discount) L.push('Discount (' + o.discount.name + '): -' + S.money(o.discount.amount, o.currency));
    if (o.giftCard) L.push('Gift card: -' + S.money(o.giftCard.applied, o.currency));
    L.push('Total paid: ' + S.money(o.total, o.currency), 'Payment: ' + (o.payment && o.payment.card ? o.payment.card : 'test payment'), '',
      'Our service fee is separate from government fees. General information, not legal, tax or immigration advice.');
    return L.join('\r\n') + '\r\n';
  }
  function download() {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([receipt(order)], { type: 'text/plain;charset=utf-8' }));
    a.download = 'come-to-ghana-receipt-' + order.number + '.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function stages(o) {
    var STAGES = [['paid', 'Payment received'], ['making', 'Being prepared'], ['ready', 'Ready'], ['collected', 'Delivered']];
    var at = {}; (o.steps || []).forEach(function (s) { at[s.id] = s; });
    return STAGES.map(function (s, i) {
      var st = at[s[0]] || {}, done = !!st.at;
      return '<li class="' + (done ? 'is-done' : '') + '"><span aria-hidden="true">' + (done ? '✓' : i + 1) + '</span><div>' + esc(s[1]) + (done ? '<small>' + fmt(st.at) + '</small>' : '') + '<span class="ord-sr">' + (done ? ' done' : ' waiting') + '</span></div></li>';
    }).join('');
  }

  function render(o) {
    order = o;
    var paid = o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded';
    if (o.status === 'cancelled' || o.status === 'refunded') {
      eyebrow.textContent = 'Order ' + o.number; headline('This order was cancelled.');
      app.innerHTML = '<div class="ord-banner is-bad" role="status">' + (o.status === 'refunded' ? 'The test payment was refunded.' : 'No payment was taken.') + '</div><div class="ord-actions"><a class="shop-btn" href="' + S.link('pages/services.html') + '">Back to the plans</a></div>';
      stop(); return;
    }
    if (!paid) {
      eyebrow.textContent = 'Order ' + o.number; headline('Waiting for your payment.');
      app.innerHTML = '<div class="ord-banner" role="status">We have not seen the test payment yet. This page checks again every few seconds.</div>';
      return;
    }
    S.addOrder(o.token);
    eyebrow.textContent = 'Thank you, ' + (o.firstName || o.name);
    if (!title.getAttribute('data-done')) { headline('Your order is in. Welcome to the plan.'); title.setAttribute('data-done', '1'); }
    var lines = o.lines.map(function (l) { return '<li><div>' + esc(l.name) + (l.qty > 1 ? ' × ' + l.qty : '') + (optNames(l) ? '<small>' + esc(optNames(l)) + '</small>' : '') + '</div><strong class="shop-price">' + S.money(l.total, o.currency) + '</strong></li>'; }).join('');
    var tot = '<div><dt>Subtotal</dt><dd>' + S.money(o.subtotal, o.currency) + '</dd></div>' +
      (o.discount ? '<div><dt>' + esc(o.discount.name) + '</dt><dd>-' + S.money(o.discount.amount, o.currency) + '</dd></div>' : '') +
      (o.giftCard ? '<div><dt>Gift card</dt><dd>-' + S.money(o.giftCard.applied, o.currency) + '</dd></div>' : '') +
      '<div class="is-big"><dt>Total paid</dt><dd>' + S.money(o.total, o.currency) + '</dd></div>';
    var cancel = o.cancellable ? '<button type="button" class="shop-btn shop-btn--ghost" id="ord-cancel">Cancel this order</button><span class="ord-muted" id="ord-cd"></span>' : '';
    app.innerHTML = '<div class="ord-grid"><div>' +
      '<section class="ord-card" aria-labelledby="ord-n"><p class="ord-muted" id="ord-n">Order number</p><p class="ord-num">' + esc(o.number) + '</p><p>Order code <span class="ord-code">' + esc(o.code) + '</span>. Keep this page: the link is your order.</p>' +
      '<ol class="ord-steps" aria-label="Order progress">' + stages(o) + '</ol></section>' +
      '<section class="ord-card" aria-labelledby="ord-nx"><h2 id="ord-nx">What happens next</h2><ul class="ord-next">' + nextSteps(o) + '</ul>' +
      '<p class="ord-muted">Our service fee is separate from government fees (visa, permits, Ghana Card). We never promise approval: the authority decides. General information, not legal, tax or immigration advice.</p></section>' +
      '</div><div><section class="ord-card" aria-labelledby="ord-b"><h2 id="ord-b">What you bought</h2><ul class="ord-lines">' + lines + '</ul><dl class="ord-total">' + tot + '</dl>' +
      '<p class="ord-muted">' + (o.payment && o.payment.card ? 'Paid with ' + esc(o.payment.card) + ' (test payment). ' : 'Test payment. ') + 'Placed ' + fmt(o.placedAt) + '.</p>' +
      '<div class="ord-actions"><button type="button" class="shop-btn" id="ord-dl">Download receipt (.txt)</button><a class="shop-btn shop-btn--ghost" href="' + S.link('pages/account.html') + '">My purchases</a>' + cancel + '</div>' +
      '<div class="ord-banner" id="ord-msg" role="status" hidden></div></section></div></div>';
    document.getElementById('ord-dl').addEventListener('click', download);
    var c = document.getElementById('ord-cancel');
    if (c) c.addEventListener('click', function () {
      c.disabled = true;
      S.api('orders/' + encodeURIComponent(o.token) + '/cancel', {}).then(function (r) { render(r.order || r); }).catch(function (e) {
        var m = document.getElementById('ord-msg'); m.hidden = false; m.className = 'ord-banner is-bad'; m.textContent = e.message; c.disabled = false;
      });
    });
    if (o.status === 'collected') stop();
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function load() {
    S.api('orders/' + encodeURIComponent(token)).then(function (r) { render(r.order || r); }).catch(function (e) {
      stop(); eyebrow.textContent = 'Your order'; headline('We could not find that order.');
      app.innerHTML = '<div class="ord-banner is-bad" role="alert">' + esc(e.message) + '</div><div class="ord-actions"><a class="shop-btn" href="' + S.link('pages/account.html') + '">Go to My purchases</a></div>';
    });
  }
  if (!token) {
    headline('No order to show yet.');
    app.innerHTML = '<p>Open this page from your confirmation link, or find your orders in My purchases.</p><div class="ord-actions"><a class="shop-btn" href="' + S.link('pages/account.html') + '">My purchases</a></div>';
    return;
  }
  headline('Checking your order.');
  load(); timer = setInterval(load, 5000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && timer) load(); });
})();
