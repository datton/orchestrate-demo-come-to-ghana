/* Motion: word reveals, mask headings, scroll reveals, counters, statement fill, scrollytelling, parallax, progress bar. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  function split(el, mask) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          if (!n.nodeValue.trim()) return;
          var frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'hv-word'; w.style.setProperty('--i', i++); w.textContent = part;
            if (mask) { var m = document.createElement('span'); m.className = 'hv-mw'; m.appendChild(w); frag.appendChild(m); } else frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('hv-rotate')) walk(n);
      });
    })(el);
  }
  var OWN = '.hv-w, .hv-mask, .hv-sw, [data-rotate]'; // markup a page already animates itself

  ready(function () {
    var main = document.querySelector('main') || document.body;
    var h1 = main.querySelector('h1');
    if (h1 && !h1.hasAttribute('data-split')) h1.setAttribute('data-split', 'words');
    main.querySelectorAll('h2').forEach(function (h) { if (!h.hasAttribute('data-split') && !h.classList.contains('sr-only') && !h.closest('.shop-drawer, [role="dialog"]')) h.setAttribute('data-split', 'mask'); });
    main.querySelectorAll('[data-split]').forEach(function (el) { if (el.querySelector(OWN)) return; split(el, el.getAttribute('data-split') === 'mask'); });
    main.querySelectorAll('section > p, .hv-grid > *, [data-reveal-auto]').forEach(function (el, k) {
      if (!el.hasAttribute('data-reveal') && !el.closest('[data-scrolly], .hv-statement')) { el.setAttribute('data-reveal', ''); el.style.setProperty('--d', (k % 4) * 80 + 'ms'); }
    });

    var statements = [].slice.call(document.querySelectorAll('.hv-statement')).filter(function (s) { if (s.querySelector(OWN)) return false; split(s, false); return true; });

    document.querySelectorAll('.hv-rotate[data-words]').forEach(function (r) {
      var words = r.getAttribute('data-words').split('|'); r.innerHTML = '';
      words.forEach(function (w, k) { var s = document.createElement('span'); s.textContent = w; if (!k) s.classList.add('is-on'); r.appendChild(s); });
      if (reduce || words.length < 2) return;
      var k = 0; setInterval(function () { r.children[k].classList.remove('is-on'); k = (k + 1) % words.length; r.children[k].classList.add('is-on'); }, 2400);
    });
    document.querySelectorAll('.hv-marquee-track').forEach(function (t) { t.setAttribute('aria-hidden', 'true'); if (!t.hasAttribute('data-dup')) t.innerHTML += t.innerHTML; });

    function count(el) {
      var raw = el.getAttribute('data-count'), to = parseFloat(raw), dec = (raw.split('.')[1] || '').length;
      var suf = el.getAttribute('data-suffix') || '', pre = el.getAttribute('data-prefix') || '';
      if (reduce) { el.textContent = pre + to.toFixed(dec) + suf; return; }
      var t0 = performance.now();
      (function tick(t) { var p = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - p, 3); el.textContent = pre + (to * e).toFixed(dec) + suf; if (p < 1) requestAnimationFrame(tick); })(t0);
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in'); io.unobserve(e.target);
        if (e.target.hasAttribute('data-count')) count(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-split], [data-reveal], [data-count], .hv-rule').forEach(function (el) {
      if (el.hasAttribute('data-count') && reduce) { count(el); return; }
      io.observe(el);
    });
    if (h1) requestAnimationFrame(function () { requestAnimationFrame(function () { h1.classList.add('is-in'); }); });

    document.querySelectorAll('[data-scrolly]').forEach(function (sc) {
      var word = sc.querySelector('.hv-scrolly-word'), steps = [].slice.call(sc.querySelectorAll('[data-step]'));
      if (!word || !steps.length) return;
      word.textContent = steps[0].getAttribute('data-word') || word.textContent; steps[0].classList.add('is-active');
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          steps.forEach(function (s) { s.classList.toggle('is-active', s === e.target); });
          var w = e.target.getAttribute('data-word'); if (w && word.textContent !== w) word.textContent = w;
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(function (s) { so.observe(s); });
    });

    var bar = document.createElement('div'); bar.className = 'hv-progress'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i>'; document.body.appendChild(bar);
    // Marquee speeds up with scroll speed and eases back (playbackRate only; no scroll hijacking).
    var tracks = [].slice.call(document.querySelectorAll('.hv-marquee-track')), vel = 0, lastY = scrollY, rate = 1;
    if (!reduce && tracks.length) (function loop() {
      var y = scrollY; vel = vel * 0.9 + (y - lastY) * 0.1; lastY = y;
      var target = 1 + Math.min(Math.abs(vel) * 0.35, 5); rate += (target - rate) * 0.08;
      tracks.forEach(function (t) { var an = t.getAnimations && t.getAnimations()[0]; if (an) an.playbackRate = rate; });
      requestAnimationFrame(loop);
    })();
    var par = [].slice.call(document.querySelectorAll('[data-parallax]')), ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      root.style.setProperty('--hv-p', max > 0 ? Math.min(1, scrollY / max) : 0);
      statements.forEach(function (s) {
        var ws = s.querySelectorAll('.hv-word'), r = s.getBoundingClientRect();
        var p = (innerHeight * 0.85 - r.top) / (innerHeight * 0.5 + r.height);
        var lit = reduce ? ws.length : Math.round(Math.max(0, Math.min(1, p)) * ws.length);
        ws.forEach(function (w, k) { w.classList.toggle('is-lit', k < lit); });
      });
      if (!reduce) par.forEach(function (el) {
        var r = el.getBoundingClientRect(), sp = parseFloat(el.getAttribute('data-parallax')) || 0.08;
        el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - innerHeight / 2) * -sp).toFixed(1) + 'px,0)';
      });
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); update();
  });
})();
