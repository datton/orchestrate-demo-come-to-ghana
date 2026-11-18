/* Shared page shell: skip link, header with cart link, nav (marks the current page), footer. */
(function () {
  var script = document.currentScript || document.querySelector('script[src$="nav.js"]');
  var base = script ? script.getAttribute('src').replace(/js\/nav\.js.*$/, '') : '';
  var name = 'Come to Ghana';
  var links = [['index.html', 'Home'], ['pages/services.html', 'Plans'], ['pages/guides/index.html', 'Guides'], ['pages/account.html', 'My purchases']];
  var cta = ['pages/services.html', 'Choose a plan'];
  var here = location.pathname.replace(/\/$/, '/index.html');
  function isHere(href) { return here.slice(-href.length) === href; }
  function li(l, c) { return '<li><a' + (c ? ' class="hv-nav-cta"' : '') + ' href="' + base + l[0] + '"' + (isHere(l[0]) ? ' aria-current="page"' : '') + '>' + l[1] + '</a></li>'; }
  var body = document.body;
  if (!document.querySelector('.hv-skip')) {
    var s = document.createElement('a'); s.className = 'hv-skip'; s.href = '#main'; s.textContent = 'Skip to content'; body.insertBefore(s, body.firstChild);
  }
  var main = document.querySelector('main'); if (main) { if (!main.id) main.id = 'main'; if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1'); }
  if (!document.querySelector('.hv-header')) {
    var h = document.createElement('header'); h.className = 'hv-header';
    h.innerHTML = '<div class="hv-header-in"><a class="hv-logo" href="' + base + 'index.html">' + name + '</a>' +
      '<button class="hv-nav-toggle" type="button" aria-expanded="false" aria-controls="hv-nav">Menu</button>' +
      '<nav class="hv-nav" id="hv-nav" aria-label="Main"><ul>' + links.map(function (l) { return li(l); }).join('') + li(cta, true) + '</ul></nav></div>';
    var after = body.querySelector('.hv-skip'); body.insertBefore(h, after ? after.nextSibling : body.firstChild);
    var btn = h.querySelector('.hv-nav-toggle'), nav = h.querySelector('.hv-nav');
    var close = function () { nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', function () { btn.setAttribute('aria-expanded', nav.classList.toggle('is-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { close(); btn.focus(); } });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    var onScroll = function () { h.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  // The cart drawer (js/shop/cart.js) adds its own button; keep it in the header bar, next to the menu button.
  function placeCart() {
    var b = document.querySelector('.cd-btn'), bar = document.querySelector('.hv-header-in');
    if (b && bar && b.parentNode !== bar) { b.classList.remove('cd-btn--float'); b.classList.add('hv-cart'); bar.insertBefore(b, bar.querySelector('.hv-nav-toggle')); }
  }
  window.addEventListener('load', placeCart); document.addEventListener('DOMContentLoaded', function () { setTimeout(placeCart, 0); });
  if (!document.querySelector('.hv-footer')) {
    var f = document.createElement('footer'); f.className = 'hv-footer';
    f.innerHTML = '<div class="hv-footer-in"><div><strong>' + name + '</strong><p>Plans and guides for every kind of traveller heading to Ghana.</p></div>' +
      '<div><h2>Pages</h2><ul>' + links.map(function (l) { return li(l); }).join('') + li(cta) + '</ul></div>' +
      '<div><h2>Good to know</h2><small>Demo shop: test payments only, no real money moves. Guides are general information, not legal, tax or immigration advice. Built by the Orchestrate Solutions team.</small></div></div>';
    body.appendChild(f);
  }
})();
