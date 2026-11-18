/* Come to Ghana: shared shop helpers. window.Shop is used by every page (cart, checkout, order, account, guides). */
(function () {
  'use strict';
  var script = document.currentScript;
  var ROOT = new URL('../../', script ? script.src : location.href).href;
  var API = ROOT + 'api/shop/';
  var SITE = (function () { var m = /\/s\/([^/]+)\//.exec(ROOT); return m ? m[1] : location.hostname.split('.')[0]; })();
  var PREFIX = 'shop:' + SITE + ':';

  function get(key, fallback) { try { var v = localStorage.getItem(PREFIX + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } }
  function set(key, value) { try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) {} return value; }

  function api(path, body) {
    var opt = body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    return fetch(API + path, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || j.error) throw new Error(j.error || 'Something went wrong. Please try again.');
        return j;
      });
    });
  }

  var catalogPromise;
  function catalog() { return catalogPromise || (catalogPromise = fetch(ROOT + 'shop/catalog.json').then(function (r) { return r.json(); })); }
  function item(cat, id) { return (cat.items || []).filter(function (i) { return i.id === id; })[0]; }

  var currency = 'EUR';
  catalog().then(function (c) { currency = c.currency || currency; }).catch(function () {});
  function money(cents, cur) {
    try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur || currency, minimumFractionDigits: cents % 100 ? 2 : 0 }).format((cents || 0) / 100); }
    catch (e) { return (cents / 100).toFixed(2); }
  }

  function customer() {
    var id = get('customer', null);
    if (!id) { var a = 'abcdefghijklmnopqrstuvwxyz0123456789', s = ''; for (var i = 0; i < 24; i++) s += a[Math.floor(Math.random() * a.length)]; id = set('customer', s); }
    return id;
  }

  function cart() { return get('cart', []); }
  function saveCart(lines) { set('cart', lines); window.dispatchEvent(new Event('shop:cart')); return lines; }
  function addToCart(line) {
    var lines = cart(), key = JSON.stringify([line.item, line.options || {}, line.note || '']);
    var hit = lines.filter(function (l) { return JSON.stringify([l.item, l.options || {}, l.note || '']) === key; })[0];
    if (hit) hit.qty += line.qty || 1; else lines.push({ item: line.item, qty: line.qty || 1, options: line.options || {}, note: line.note || '' });
    saveCart(lines);
    toast('Added to your cart');
  }
  function cartCount() { return cart().reduce(function (n, l) { return n + l.qty; }, 0); }
  function addOrder(token) { var o = get('orders', []).filter(function (t) { return t !== token; }); o.unshift(token); set('orders', o); }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function q(name) { return new URLSearchParams(location.search).get(name); }
  function link(path) { return ROOT + path; }

  function toast(msg) {
    var host = document.getElementById('shop-toasts');
    if (!host) { host = document.createElement('div'); host.id = 'shop-toasts'; host.className = 'shop-toasts'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    var t = document.createElement('div'); t.className = 'shop-toast'; t.textContent = msg; host.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 400); }, 2600);
  }

  window.Shop = { ROOT: ROOT, API: API, SITE: SITE, get: get, set: set, api: api, catalog: catalog, item: item, money: money,
    customer: customer, cart: cart, saveCart: saveCart, addToCart: addToCart, cartCount: cartCount, addOrder: addOrder,
    esc: esc, q: q, link: link, toast: toast };
})();
