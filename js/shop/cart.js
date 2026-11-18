/* Come to Ghana: the cart drawer. A cart button in the header; opens on 'shop:cart-open'. Prices come from the shop service (POST quote). */
(function () {
  'use strict';
  var S = window.Shop;
  if (!S) return;
  var scriptSrc = document.currentScript ? document.currentScript.src : '';
  var drawer, overlay, body, foot, btn, badge, lastFocus, quoteSeq = 0, quote = null, quoteErr = '';

  function checkoutUrl() { return S.link('pages/checkout.html'); }

  function build() {
    overlay = document.createElement('div'); overlay.className = 'cd-overlay'; overlay.hidden = true;
    overlay.addEventListener('click', close);
    drawer = document.createElement('aside'); drawer.className = 'cd-drawer'; drawer.id = 'cart-drawer';
    drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.setAttribute('aria-labelledby', 'cd-title'); drawer.hidden = true;
    drawer.innerHTML = '<div class="cd-head"><h2 id="cd-title">Your cart</h2><button type="button" class="cd-close" aria-label="Close cart">&times;</button></div>' +
      '<div class="cd-body" aria-live="polite"></div><div class="cd-foot"></div>';
    document.body.appendChild(overlay); document.body.appendChild(drawer);
    body = drawer.querySelector('.cd-body'); foot = drawer.querySelector('.cd-foot');
    drawer.querySelector('.cd-close').addEventListener('click', close);
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = drawer.querySelectorAll('button:not([disabled]), a[href], input'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    body.addEventListener('click', onBody);
  }

  function makeButton() {
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'cd-btn';
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-controls', 'cart-drawer');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M3 4h2l2.4 11h9.7l2-8H6.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19" r="1.5" fill="currentColor"/><circle cx="16.5" cy="19" r="1.5" fill="currentColor"/></svg><span class="cd-label">Cart</span><span class="cd-badge" hidden>0</span>';
    badge = btn.querySelector('.cd-badge');
    btn.addEventListener('click', open);
    var host = document.querySelector('.hv-header nav, .site-header nav, header nav, header') ;
    if (host) { btn.classList.add('cd-btn--header'); host.appendChild(btn); }
    else { btn.classList.add('cd-btn--float'); document.body.appendChild(btn); }
  }

  function updateBadge() {
    var n = S.cartCount();
    badge.textContent = n; badge.hidden = n === 0;
    btn.setAttribute('aria-label', 'Cart, ' + n + (n === 1 ? ' item' : ' items'));
  }

  function open() {
    lastFocus = document.activeElement;
    overlay.hidden = false; drawer.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('is-open'); drawer.classList.add('is-open'); });
    document.documentElement.classList.add('cd-lock');
    refresh();
    setTimeout(function () { var c = drawer.querySelector('.cd-close'); if (c) c.focus(); }, 30);
  }
  function close() {
    overlay.classList.remove('is-open'); drawer.classList.remove('is-open');
    document.documentElement.classList.remove('cd-lock');
    setTimeout(function () { overlay.hidden = true; drawer.hidden = true; }, 300);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function isOpen() { return drawer && !drawer.hidden; }

  function onBody(e) {
    var t = e.target.closest('button[data-act]'); if (!t) return;
    var i = +t.getAttribute('data-i'), lines = S.cart(), l = lines[i]; if (!l) return;
    var act = t.getAttribute('data-act');
    if (act === 'inc') l.qty = Math.min(20, l.qty + 1);
    else if (act === 'dec') l.qty = Math.max(1, l.qty - 1);
    else if (act === 'rm') lines.splice(i, 1);
    S.saveCart(lines);
    var again = body.querySelector('button[data-i="' + Math.min(i, lines.length - 1) + '"][data-act="' + (act === 'rm' ? 'rm' : act) + '"]');
    if (again) again.focus(); else if (!lines.length) drawer.querySelector('.cd-close').focus();
  }

  function fallbackName(l) {
    var it = window.__cd_cat && S.item(window.__cd_cat, l.item); return it ? it.name : l.item;
  }

  function render() {
    var lines = S.cart();
    if (!lines.length) {
      body.innerHTML = '<div class="cd-empty"><p class="cd-empty-big">Your cart is empty</p><p>Add a service or guide and it will wait for you here.</p><a class="shop-btn" href="' + S.esc(S.link('pages/services.html')) + '">Browse services</a></div>';
      foot.innerHTML = ''; return;
    }
    var ql = quote && quote.lines && quote.lines.length === lines.length ? quote.lines : null;
    var h = '<ul class="cd-lines">';
    lines.forEach(function (l, i) {
      var q = ql ? ql[i] : null, name = q ? q.name : fallbackName(l);
      var n = S.esc(name);
      h += '<li class="cd-line"><div class="cd-info"><strong class="cd-name">' + n + '</strong>' +
        (q && q.summary ? '<span class="cd-sum">' + S.esc(q.summary) + '</span>' : '') +
        (l.note ? '<span class="cd-sum">Note: ' + S.esc(l.note) + '</span>' : '') +
        '<div class="cd-step" role="group" aria-label="Quantity for ' + n + '">' +
        '<button type="button" data-act="dec" data-i="' + i + '" aria-label="One fewer ' + n + '"' + (l.qty <= 1 ? ' disabled' : '') + '>&minus;</button>' +
        '<output aria-live="polite">' + l.qty + '</output>' +
        '<button type="button" data-act="inc" data-i="' + i + '" aria-label="One more ' + n + '"' + (l.qty >= 20 ? ' disabled' : '') + '>+</button></div></div>' +
        '<div class="cd-side"><span class="shop-price">' + (q ? S.money(q.total, quote.currency) : '…') + '</span>' +
        '<button type="button" class="cd-rm" data-act="rm" data-i="' + i + '" aria-label="Remove ' + n + '">Remove</button></div></li>';
    });
    h += '</ul>';
    body.innerHTML = h;
    var total = quote ? '<div class="cd-total"><span>Subtotal</span><strong class="shop-price">' + S.money(quote.subtotal, quote.currency) + '</strong></div>' : '<div class="cd-total"><span>Subtotal</span><strong>Checking prices…</strong></div>';
    foot.innerHTML = (quoteErr ? '<p class="cd-err" role="alert">' + S.esc(quoteErr) + '</p>' : '') + total +
      '<p class="hv-note cd-note">Coupons and gift cards are applied at checkout. Demo shop: test payments only. No real money moves.</p>' +
      '<a class="shop-btn cd-go" href="' + S.esc(checkoutUrl()) + '"' + (quoteErr ? ' aria-disabled="false"' : '') + '>Check out</a>';
  }

  function refresh() {
    var lines = S.cart();
    updateBadge();
    if (!isOpen()) return;
    if (!lines.length) { quote = null; quoteErr = ''; render(); return; }
    var seq = ++quoteSeq;
    render();
    S.api('quote', { items: lines, customer: S.customer() }).then(function (qt) {
      if (seq !== quoteSeq) return; quote = qt; quoteErr = ''; render();
    }).catch(function (err) {
      if (seq !== quoteSeq) return; quote = null; quoteErr = err.message; render();
    });
  }

  function init() {
    build(); makeButton(); updateBadge();
    S.catalog().then(function (c) { window.__cd_cat = c; if (isOpen()) render(); }).catch(function () {});
    window.addEventListener('shop:cart', refresh);
    window.addEventListener('shop:cart-open', open);
    window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('cart') > -1) refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
