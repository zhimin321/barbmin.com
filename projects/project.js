/* Case-study pages: navbar state, mobile menu and the contact modal.
   The hero page's app.js is not loaded here — these pages have no canvas. */
(function () {
  'use strict';
  var EMAIL = 'zhiminzhangcn@gmail.com';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var nav = $('#nav'), burger = $('#burger'), overlay = $('#mobile-menu');

  function onScroll() { nav.classList.toggle('is-stuck', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    burger.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!overlay.classList.contains('open')); });
  $$('a', overlay).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  var modal = $('#modal'), copyBtn = $('#copy-btn'), copyLabel = $('.copy-label', copyBtn);
  var lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    setMenu(false);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    copyBtn.focus();
  }
  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-contact]').forEach(function (b) { b.addEventListener('click', openModal); });
  $('#modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('open')) closeModal();
    else if (overlay.classList.contains('open')) setMenu(false);
  });

  function fallbackCopy() {
    var ta = document.createElement('textarea');
    ta.value = EMAIL; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  copyBtn.addEventListener('click', function () {
    var done = function (ok) {
      copyBtn.classList.toggle('copied', ok);
      copyLabel.textContent = ok ? 'Copied' : 'Press ⌘C';
      setTimeout(function () { copyBtn.classList.remove('copied'); copyLabel.textContent = 'Copy'; }, 1900);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, function () { done(fallbackCopy()); });
    } else { done(fallbackCopy()); }
  });

  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
})();
