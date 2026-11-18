/* Shared page shell: skip link, header (cart, nav, full-screen menu on phones), footer. */
(function () {
  var script = document.currentScript || document.querySelector('script[src$="nav.js"]');
  var base = script ? script.getAttribute('src').replace(/js\/nav\.js.*$/, '') : '';
  var name = 'Come to Ghana';
  var path = location.pathname.replace(/\/$/, '/index.html');
  function ends(h) { return path.slice(-h.length) === h; }
  var links = [
    { href: 'pages/services.html', label: 'Plans', on: function () { return ends('pages/services.html'); } },
    { href: 'pages/guides/index.html', label: 'Guides', on: function () { return /pages\/guides\//.test(path) && !ends('how-it-works.html'); } },
    { href: 'pages/guides/how-it-works.html', label: 'How it works', on: function () { return ends('how-it-works.html'); } },
    { href: 'pages/account.html', label: 'My purchases', on: function () { return ends('pages/account.html'); } }
  ];
  function a(l, cls) { return '<a' + (cls ? ' class="' + cls + '"' : '') + ' href="' + base + l.href + '"' + (l.on && l.on() ? ' aria-current="page"' : '') + '>' + l.label + '</a>'; }
  var body = document.body;

  if (!document.querySelector('.hv-skip')) {
    var s = document.createElement('a'); s.className = 'hv-skip'; s.href = '#main'; s.textContent = 'Skip to content'; body.insertBefore(s, body.firstChild);
  }
  var main = document.querySelector('main');
  if (main) { if (!main.id) main.id = 'main'; if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1'); }

  if (!document.querySelector('.hv-header')) {
    var h = document.createElement('header'); h.className = 'hv-header';
    var items = links.map(function (l, i) { return '<li style="--n:' + i + '">' + a(l) + '</li>'; }).join('') +
      '<li class="hv-nav-last" style="--n:' + links.length + '"><a class="hv-nav-cta" href="' + base + 'pages/services.html#plans">Choose a plan <span aria-hidden="true">&rarr;</span></a></li>';
    h.innerHTML = '<div class="hv-header-in"><a class="hv-logo" href="' + base + 'index.html" aria-label="' + name + ', home">' + name + '</a>' +
      '<nav class="hv-nav" id="hv-nav" aria-label="Main"><ul>' + items + '</ul><p class="hv-nav-foot">Demo shop: test payments only. Guides are general information, not legal, tax or immigration advice.</p></nav>' +
      '<a class="hv-cart" href="' + base + 'pages/checkout.html" data-cart-open aria-label="Cart">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 4h2l2.4 11h9.7l2-8H6.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19" r="1.4" fill="currentColor"/><circle cx="16.5" cy="19" r="1.4" fill="currentColor"/></svg>' +
      '<span class="hv-cart-label">Cart</span><span class="hv-cart-n" data-cart-count hidden>0</span></a>' +
      '<button class="hv-nav-toggle" type="button" aria-expanded="false" aria-controls="hv-nav" aria-label="Menu"><i></i></button></div>';
    var after = body.querySelector('.hv-skip'); body.insertBefore(h, after ? after.nextSibling : body.firstChild);

    var btn = h.querySelector('.hv-nav-toggle'), nav = h.querySelector('.hv-nav');
    var desktop = window.matchMedia('(min-width: 62rem)');
    function setOpen(o) {
      h.classList.toggle('menu-open', o); document.documentElement.classList.toggle('hv-lock', o);
      btn.setAttribute('aria-expanded', o); btn.setAttribute('aria-label', o ? 'Close menu' : 'Menu');
      if (o) h.classList.remove('is-hidden');
    }
    btn.addEventListener('click', function () { setOpen(!h.classList.contains('menu-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (!h.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { setOpen(false); btn.focus(); return; }
      if (e.key !== 'Tab') return;
      var f = [].slice.call(h.querySelectorAll('a[href], button')).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    (desktop.addEventListener ? desktop.addEventListener.bind(desktop, 'change') : desktop.addListener.bind(desktop))(function () { if (desktop.matches) setOpen(false); });

    // Shrinks after a little scroll; hides when scrolling down, returns when scrolling up.
    var lastY = window.scrollY, tick = false;
    function onScroll() {
      tick = false; var y = window.scrollY;
      h.classList.toggle('is-stuck', y > 8);
      if (!h.classList.contains('menu-open')) {
        if (y > lastY + 6 && y > 240 && !h.contains(document.activeElement)) h.classList.add('is-hidden');
        else if (y < lastY - 4 || y < 240) h.classList.remove('is-hidden');
      }
      lastY = y;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
    h.addEventListener('focusin', function () { h.classList.remove('is-hidden'); });
    onScroll();
  }

  function paintCart() {
    var c = 0; try { c = window.Shop && Shop.cartCount ? Shop.cartCount() : 0; } catch (e) {}
    document.querySelectorAll('.hv-cart').forEach(function (b) { b.setAttribute('aria-label', 'Cart, ' + c + (c === 1 ? ' item' : ' items')); });
    document.querySelectorAll('[data-cart-count]').forEach(function (n) { n.textContent = c; n.hidden = !c; });
  }
  window.addEventListener('shop:cart', paintCart); window.addEventListener('storage', paintCart); window.addEventListener('load', paintCart); paintCart();

  if (!document.querySelector('.hv-footer')) {
    var g = function (file, label) { return '<li><a href="' + base + 'pages/guides/' + file + '">' + label + '</a></li>'; };
    var f = document.createElement('footer'); f.className = 'hv-footer';
    f.innerHTML = '<div class="hv-footer-in">' +
      '<div class="hv-footer-top"><h2>Your journey starts with one plan.</h2><div><p>Pick the plan that fits how you are travelling. We prepare your documents, check them against the official sources and walk you through each step.</p>' +
      '<div class="hv-footer-cta"><a class="hv-btn-gold" href="' + base + 'pages/services.html#plans">Choose a plan <span aria-hidden="true">&rarr;</span></a><a class="hv-btn-line" href="' + base + 'pages/guides/index.html">Read the guides</a></div></div></div>' +
      '<div class="hv-footer-cols">' +
      '<div class="hv-footer-brand"><strong>' + name + '</strong><p>Guidance and document preparation for people travelling to, working in or moving to Ghana.</p></div>' +
      '<div><h3>For every traveller</h3><ul>' + g('tourist.html', 'Tourists') + g('business.html', 'Business visitors') + g('property.html', 'Property investors') + g('diaspora.html', 'Diaspora and returnees') + g('student.html', 'Students') + g('remote-work.html', 'Remote workers') + '</ul></div>' +
      '<div><h3>Explore</h3><ul><li><a href="' + base + 'pages/services.html">Plans and prices</a></li>' + g('index.html', 'All guides') + g('how-it-works.html', 'How it works') +
      '<li><a href="' + base + 'pages/account.html">My purchases</a></li><li><a href="' + base + 'pages/checkout.html">Checkout</a></li></ul></div>' +
      '<div><h3>Good to know</h3><p class="hv-footer-note">Demo shop: test payments only, no real money moves.</p><p class="hv-footer-note">We are not a government body, embassy or licensed immigration practitioner. Guides are general information, not legal, tax or immigration advice, and we never promise approval.</p></div></div>' +
      '<div class="hv-footer-base"><span>&copy; ' + new Date().getFullYear() + ' ' + name + ' &middot; Built by the Orchestrate Solutions team</span><a href="#main">Back to top &uarr;</a></div>' +
      '<div class="hv-footer-mark" aria-hidden="true">Akwaaba</div></div>';
    body.appendChild(f);
  }
})();
