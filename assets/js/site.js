/* Superior Shavings — no dependencies, no build step. */
(function () {
  'use strict';

  // Armed from here, not the head: if this file fails, nothing is hidden.
  document.documentElement.classList.add('js');

  function mobileMenu() {
    var nav = document.querySelector('.mobnav');
    if (!nav) return;
    var close = function () { nav.removeAttribute('open'); };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.hasAttribute('open')) {
        close();
        var t = nav.querySelector('summary'); if (t) t.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (nav.hasAttribute('open') && !nav.contains(e.target)) close();
    });
    nav.querySelectorAll('a[href*="#"]').forEach(function (a) { a.addEventListener('click', close); });
    var wide = window.matchMedia('(min-width: 62rem)');
    var sync = function () { if (wide.matches) close(); };
    wide.addEventListener ? wide.addEventListener('change', sync) : wide.addListener(sync);
  }

  function reveals() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      obs.observe(el);
    });
  }

  try { mobileMenu(); } catch (e) {}
  try { reveals(); } catch (e) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
  }
})();
