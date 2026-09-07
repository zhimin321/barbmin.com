/* ═══════════════════════════════════════════════════════════════
   Zhimin Barbara Zhang — hero landing page
   Vanilla JS, no build step, no runtime dependencies.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EMAIL = 'zhiminzhangcn@gmail.com';

  /* V3 hero: the factory building at the centre of a geometric field that the
     cursor pushes apart (field.js). The duck and the gear river are gone; their
     last version is kept in ../website_element/v2 and tools/app.v2-duck.js.bak. */

  /* Backdrop works — mirrors assets/building_meta.json */
  var BUILDING = {
    w: 560, h: 835,
    gears: [
      { name: 'big1', sx: 248, sy: 286, sw: 125, sh: 125, dir:  1, speed: 0.55 },
      { name: 'big2', sx: 311, sy: 433, sw: 112, sh: 112, dir: -1, speed: 0.62 },
      { name: 'mid',  sx: 228, sy: 393, sw:  59, sh:  59, dir: -1, speed: 1.20 },
      { name: 'sm1',  sx: 364, sy: 354, sw:  42, sh:  42, dir:  1, speed: 1.75 },
      { name: 'sm2',  sx: 376, sy: 262, sw:  36, sh:  36, dir: -1, speed: 2.10 }
    ],
    chimneys: [
      { x: 132, y: 141, s: 1.00 }, { x: 300, y:  54, s: 0.80 },
      { x: 394, y:  77, s: 0.95 }, { x: 474, y: 371, s: 0.55 },
      { x:  85, y: 371, s: 0.45 }
    ]
  };

  /* The Lab's machine — mirrors assets/lab_meta.json (tools/cut_lab.py) */
  var LAB = {
    w: 660, h: 672,
    gears: [
      { name: 'big1', sx: 414, sy: 470, sw: 82, sh: 82, dir: 1, speed: 0.60 },
      { name: 'sm1', sx: 420, sy: 427, sw: 42, sh: 42, dir: -1, speed: 1.30 },
      { name: 'sm2', sx: 247, sy: 408, sw: 38, sh: 38, dir: 1, speed: 1.50 },
      { name: 'inA', sx: 325, sy: 308, sw: 54, sh: 54, dir: 1, speed: 1.00 },
      { name: 'inB', sx: 287, sy: 358, sw: 46, sh: 46, dir: -1, speed: 1.20 },
      { name: 'pulley', sx: 342, sy: 174, sw: 30, sh: 30, dir: 1, speed: 2.00 },
      { name: 'valve', sx: 325, sy: 566, sw: 50, sh: 50, dir: -1, speed: 0.50 }
    ],
    chimneys: [ { x: 238, y: 66, s: 1.00 }, { x: 168, y: 195, s: 0.70 } ]
  };

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ═══════════════ NAVBAR ═══════════════ */
  var nav = $('#nav'), burger = $('#burger'), overlay = $('#mobile-menu');

  function onScroll() { nav.classList.toggle('is-stuck', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    burger.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!overlay.classList.contains('open')); });
  $$('a', overlay).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* active nav link follows the section in view */
  var navLinks = $$('.nav-link');
  if (window.IntersectionObserver) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['home', 'projects', 'prompt-lab'].forEach(function (id) {
      var el = document.getElementById(id); if (el) spy.observe(el);
    });
  }

  /* ═══════════════ CONTACT MODAL ═══════════════ */
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
    else if (sheet.classList.contains('open')) closeSheet();
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

  $('#year').textContent = new Date().getFullYear();

  /* ═══════════════ PROMPT SHEET ═══════════════ */
  var sheet = $('#sheet'), sheetBody = $('#sheet-body'), sheetFocus = null;

  function openSheet(name) {
    var tpl = document.getElementById('sheet-' + name);
    if (!tpl) return;
    sheetFocus = document.activeElement;
    setMenu(false);
    sheetBody.textContent = '';
    sheetBody.appendChild(tpl.content.cloneNode(true));
    sheetBody.scrollTop = 0;
    sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('#sheet-close').focus();
  }
  function closeSheet() {
    sheet.classList.remove('open');
    document.body.style.overflow = '';
    if (sheetFocus && sheetFocus.focus) sheetFocus.focus();
  }
  $$('[data-sheet]').forEach(function (b) {
    b.addEventListener('click', function () { openSheet(b.getAttribute('data-sheet')); });
  });
  $('#sheet-close').addEventListener('click', closeSheet);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });

  /* tabs and copy buttons are inside cloned content, so they are delegated */
  sheetBody.addEventListener('click', function (e) {
    var tab = e.target.closest('.tab');
    if (tab) {
      var key = tab.getAttribute('data-tab');
      $$('.tab', sheetBody).forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      $$('.tabpanel', sheetBody).forEach(function (p) {
        p.classList.toggle('is-on', p.getAttribute('data-panel') === key);
      });
      sheetBody.scrollTop = 0;
      return;
    }
    var copy = e.target.closest('.prompt-copy');
    if (copy) {
      var pre = copy.closest('.prompt-block').querySelector('.prompt-text');
      var label = copy.querySelector('span');
      var done = function (ok) {
        copy.classList.toggle('copied', ok);
        label.textContent = ok ? 'Copied' : 'Press ⌘C';
        setTimeout(function () { copy.classList.remove('copied'); label.textContent = 'Copy prompt'; }, 1900);
      };
      var text = pre.textContent;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(copyFallback(text)); });
      } else { done(copyFallback(text)); }
    }
  });

  function copyFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  /* ═══════════════ TYPEWRITER ═══════════════ */
  var TW_TEXT = 'A broadcast AI specialist building practical tools that automate ' +
                'repetition and empower operators.';
  var twOut = $('.tw-text'), twCursor = $('.tw-cursor');
  (function typewriter(text, speed, startDelay) {
    if (REDUCED) { twOut.textContent = text; twCursor.classList.add('done'); return; }
    setTimeout(function () {
      var i = 0;
      var id = setInterval(function () {
        i += 1; twOut.textContent = text.slice(0, i);
        if (i >= text.length) { clearInterval(id); twCursor.classList.add('done'); }
      }, speed);
    }, startDelay);
  })(TW_TEXT, 21, 500);
  setTimeout(function () { $('#actions').classList.add('show'); }, 400);

  /* ═══════════════ HERO ELEMENTS ═══════════════ */
  var heroEl = $('.hero');
  var pct = function (v, total) { return (v / total) * 100 + '%'; };

  /* ═══════════════ BACKDROP GEARS ═══════════════ */
  var backdropEl = $('#backdrop'), pageWash = $('#page-wash');
  var bdInners = $$('.backdrop-inner', backdropEl);
  var bdDark = $('.backdrop-layer.is-dark', backdropEl);
  var bdLight = $('.backdrop-layer.is-light', backdropEl);
  var backdropPlate = $('.backdrop-plate', backdropEl);
  var bdInnerDark = $('.backdrop-layer.is-dark .backdrop-inner', backdropEl);
  var bdInnerLight = $('.backdrop-layer.is-light .backdrop-inner', backdropEl);
  var bdInnerBlue = $('.backdrop-layer.is-blue .backdrop-inner', backdropEl);
  var bdBlue = $('.backdrop-layer.is-blue', backdropEl);
  var labEl = $('#prompt-lab');
  var bgGearEls = [];
  bdInners.forEach(function (inner) {
    var isLab = inner.classList.contains('is-lab');
    var M = isLab ? LAB : BUILDING, prefix = isLab ? 'assets/lab_gear_' : 'assets/bg_';
    M.gears.forEach(function (g) {
      var img = new Image();
      img.src = prefix + g.name + '.png'; img.alt = ''; img.className = 'bg-gear';
      img.style.left = pct(g.sx, M.w);
      img.style.top = pct(g.sy, M.h);
      img.style.width = pct(g.sw, M.w);
      img.style.height = pct(g.sh, M.h);
      /* the hands sit above the gears */
      var hands = $('.lab-hands', inner);
      if (hands) inner.insertBefore(img, hands); else inner.appendChild(img);
      bgGearEls.push({ def: g, el: img });
    });
  });
  var projectsEl = $('#projects');

  /* ═══════════════ STATE ═══════════════ */
  var S = { W: 0, H: 0, scrollRot: 0, scrollTarget: 0, scrollPush: 0, mouseRot: 0, mouseTarget: 0, plate: null, gl: 1 };

  /* ═══════════════ SCENE (chimney steam) ═══════════════ */
  var canvas = $('#scene'), ctx = canvas.getContext('2d');
  var dpr = 1, smoke = [], blobSprite = null, blobPale = null;
  var time = 0;

  function makeBlob(rgb) {
    var s = 96;
    var c = document.createElement('canvas');
    c.width = c.height = s;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0.00, 'rgba(' + rgb + ',0.62)');
    gr.addColorStop(0.45, 'rgba(' + rgb + ',0.26)');
    gr.addColorStop(1.00, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return c;
  }
  function buildBlob() {
    blobSprite = makeBlob('112,100,88');       /* ink smoke on paper */
    blobPale = makeBlob('240,228,206');        /* pale steam on the dark chapters */
  }

  function emitters() {
    var out = [];
    var inner = S.plate || bdInnerDark;
    var M = inner.classList.contains('is-lab') ? LAB : BUILDING;
    var b = $('.backdrop-plate', inner).getBoundingClientRect();
    if (b.width > 4) {
      M.chimneys.forEach(function (c) {
        out.push({
          x: b.left + (c.x / M.w) * b.width,
          y: b.top + (c.y / M.h) * b.height,
          s: c.s, scale: b.width / M.w
        });
      });
    }
    return out;
  }

  function puffSmoke(x, y, s, boost, fg) {
    smoke.push({
      fg: !!fg,
      x: x + (Math.random() - 0.5) * 12 * s,
      y: y,
      vx: (Math.random() - 0.3) * 0.25,
      vy: -(0.26 + Math.random() * 0.40) * (0.7 + boost),
      r: (16 + Math.random() * 16) * s,
      grow: 0.16 + Math.random() * 0.18,
      life: 1, decay: 0.0022 + Math.random() * 0.0024,   /* V3.4: ~300-frame plume that drifts free */
      a: 0.5 + Math.random() * 0.5
    });
  }

  /* ═══════════════ LAYOUT ═══════════════ */
  function layout() {
    var r = heroEl.getBoundingClientRect();
    /* ResizeObserver also fires 0x0 while hidden or mid-transition; recomputing
       from that would zero the geometry, so keep the last good layout. */
    if (r.width < 2 || r.height < 2) return;
    S.W = r.width; S.H = r.height;
    var mobile = S.W < 860;

    /* V5 — one building, three chapters: every plate is the full viewport
       height and centred. The hero plate rests centred; the Projects plate is
       pre-offset by what its tear + parallax will lift it; the Lab plate rises
       into place from below, so it rests centred too. */
    var vh = window.innerHeight || S.H;
    var bwL = clamp(vh * 1.0 * BUILDING.w / BUILDING.h, 200, S.W * 0.9);
    var plateHL = bwL * BUILDING.h / BUILDING.w;
    var centred = Math.max(0, (vh - plateHL) / 2);
    bdInnerDark.style.width = bdInnerLight.style.width = bwL + 'px';
    bdInnerDark.style.marginBottom = centred + 'px';
    bdInnerLight.style.marginBottom = centred + 'px';
    /* the Lab's machine is nearly square: 85% of the viewport height, centred */
    var bwB = clamp(vh * 0.85 * LAB.w / LAB.h, 200, S.W * 0.92);
    bdInnerBlue.style.width = bwB + 'px';
    bdInnerBlue.style.marginBottom = Math.max(0, (vh - bwB * LAB.h / LAB.w) / 2) + 'px';

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cr = canvas.getBoundingClientRect();
    S.CW = cr.width || S.W; S.CH = cr.height || S.H;
    canvas.width = Math.round(S.CW * dpr);
    canvas.height = Math.round(S.CH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!blobSprite) buildBlob();
    if (window.HERO_FIELD) window.HERO_FIELD.layout();
    draw();
  }

  /* ═══════════════ SCROLL DRIVES THE WORKS ═══════════════ */
  window.addEventListener('scroll', function () {
    S.scrollTarget = window.scrollY * 0.42;
  }, { passive: true });
  /* V3.1: so does the mouse — every pixel of pointer travel winds the building's
     gears a little, as if the cursor were dragging a belt. Still cursor = still
     gears; the target only changes while the pointer moves. */
  var mlx = null, mly = null;
  window.addEventListener('pointermove', function (e) {
    if (REDUCED) return;
    if (mlx !== null) {
      var dx = e.clientX - mlx, dy = e.clientY - mly;
      S.mouseTarget += clamp(dx * 0.22 + dy * 0.12, -14, 14);
    }
    mlx = e.clientX; mly = e.clientY;
  }, { passive: true });
  window.addEventListener('pointerleave', function () { mlx = mly = null; });

  /* ═══════════════ FRAME ═══════════════ */
  var last = performance.now();
  /* One thrown frame used to kill the loop permanently, because the re-queue
     below never ran — and a dead loop looks identical to a live one in a still
     screenshot. Catch, report once, keep going. */
  var frameErrLogged = false;
  function frame(now) {
    try {
      stepOnce(now);
    } catch (err) {
      if (!frameErrLogged) { frameErrLogged = true; console.error('frame loop error (continuing):', err); }
    }
    requestAnimationFrame(frame);
  }

  function stepOnce(now) {
    if (S.W < 2) { layout(); if (S.W < 2) { last = now; return; } }
    var dt = clamp((now - last) / 16.667, 0, 2.5);
    last = now; time += dt / 60;

    /* --- scroll-driven rotation --- */
    var prevRot = S.scrollRot;
    S.scrollRot += (S.scrollTarget - S.scrollRot) * Math.min(1, 0.075 * dt);
    S.scrollPush = Math.abs(S.scrollRot - prevRot);
    S.mouseRot += (S.mouseTarget - S.mouseRot) * Math.min(1, 0.12 * dt);

    /* --- building gears: scroll + mouse --- */
    var rot = S.scrollRot + S.mouseRot;
    if (rot !== S.lastRot) {
      S.lastRot = rot;
      for (var b = 0; b < bgGearEls.length; b++) {
        var B = bgGearEls[b];
        B.el.style.transform = 'rotate(' + (rot * B.def.dir * B.def.speed).toFixed(2) + 'deg)';
      }
    }
    updateBackdrop();

    stepSmoke(dt);
    draw();
    /* the geometry field's push + spring (field.js) */
    if (window.HERO_FIELD) window.HERO_FIELD.step(dt);
    /* the ONE per-frame hook for motion.js — there is still only one rAF loop */
    if (typeof window.MOTION_STEP === 'function') window.MOTION_STEP(dt, time);
  }

  /* ═══════════════ BACKDROP: DRIFT, PARALLAX, HANDOVER ═══════════════ */
  /* V3: the building is the hero centrepiece, no longer a distant backdrop */
  var HERO_OPACITY = 0.55;          /* V5: a mid-strength engraving the type can sit on */
  var CREAM = [246, 236, 219], SEPIA = [74, 56, 41], VERD = [42, 72, 66];   /* verdigris: the Lab (V5.3: a shade darker) */
  /* Endpoints are pushed to the extremes on purpose: a muted body grey has no
     contrast headroom against a ground that passes through mid-tone. */
  var INK   = [17, 40, 53],   PAPER_TXT  = [250, 243, 228];
  var SOFT  = [38, 56, 66],   PAPER_SOFT = [240, 232, 214];
  var TERRA = [150, 58, 30],  TERRA_LT   = [243, 196, 166];

  function mixRGB(a, b, t) {
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' +
                    Math.round(a[1] + (b[1] - a[1]) * t) + ',' +
                    Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }

  function srgb(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function relLum(c) { return 0.2126 * srgb(c[0]) + 0.7152 * srgb(c[1]) + 0.0722 * srgb(c[2]); }

  function updateBackdrop() {
    var vh = window.innerHeight || S.H;
    var pr = projectsEl.getBoundingClientRect();
    /* 0 while Projects is a screen away, 1 once its top reaches the viewport top */
    var p = clamp(1 - pr.top / vh, 0, 1);
    /* hold off the handover until the hero has largely gone, so hero copy
       never has to read against a darkening ground */
    var pw = clamp((p - 0.46) / 0.34, 0, 1);
    /* and let go once Projects has passed */
    var exit = clamp(pr.bottom / (vh * 0.55), 0, 1);
    /* smootherstep: fastest through the middle, so the ground spends as little
       scroll as possible in the mid-tones where no text colour reads well */
    var pe = pw * pw * pw * (pw * (6 * pw - 15) + 10);
    var vis = pe;                    /* V5: the Lab's own hand-over now retires this plate */

    /* V5 — second hand-over, Projects → Lab, on the same window shape */
    var lr = labEl.getBoundingClientRect();
    var p2 = clamp(1 - lr.top / vh, 0, 1);
    var pw2 = clamp((p2 - 0.46) / 0.34, 0, 1);
    var pe2 = pw2 * pw2 * pw2 * (pw2 * (6 * pw2 - 15) + 10);

    /* V5.2 — back to the first version's motion (v1: pw³, plates stacked in
       one place, crossfade), scaled up for full-height plates: the cubic gives
       a visible slow start that accelerates; the outgoing plate is drawn
       0.75·vh off the top while it fades; the incoming one starts only
       0.26·vh below — overlapping the outgoing one for most of the move — and
       develops on the same smootherstep the wash uses. The curve's derivative
       stretches the plate a little while it is being pulled (max 6%). */
    var yank = function (t) { return t * t * t; };
    var pull = function (t) { return 6 * t * t * (1 - t); };      /* bell: 0 at rest, peaks at ⅔, back to 0 when the pull is over */
    var UP = vh * 0.75, IN = vh * 0.26;
    var tear = yank(pw), force = clamp(pull(pw) * 0.07, 0, 0.06);
    var tear2 = yank(pw2), force2 = clamp(pull(pw2) * 0.07, 0, 0.06);

    bdDark.style.opacity = (HERO_OPACITY * (1 - pw)).toFixed(3);      /* as v1: linear fade over the window */
    bdLight.style.opacity = (vis * (1 - pw2)).toFixed(3);
    bdBlue.style.opacity = (pe2 * 0.9).toFixed(3);
    S.plate = pe2 > 0.5 ? bdInnerBlue : (vis * (1 - pw2) > HERO_OPACITY * (1 - pw) ? bdInnerLight : bdInnerDark);

    var sy0 = window.scrollY || 0;

    var idleY = REDUCED ? 0 : Math.sin(time * 0.21) * 5.5;
    var idleX = REDUCED ? 0 : Math.cos(time * 0.147) * 3.2;
    /* fixed layer + a slow upward parallax, plus — motion pass — an UPWARD
       tear as the hero swipes away: barely moving at first, then snatched off
       (cubic ease-in, i.e. constant acceleration, like a fall). The exit
       factor lets it drift back as Projects hands over to the Lab, exactly as
       the old downward pull did. Opacity and wash are untouched. */
    var ty = idleY - tear * UP - (window.scrollY || 0) * 0.055;
    var sc = 1;
    var t = 'translate3d(' + idleX.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(1,' + (1 + force).toFixed(4) + ')';
    bdInnerDark.style.transform = t;
    /* Projects plate: dragged out from below by the hero's departure (same
       curve, so the two move as one chain), rests centred through Projects,
       then is yanked off the top itself as the Lab arrives */
    var tyL = idleY + (1 - tear) * IN - tear2 * UP;
    bdInnerLight.style.transform = 'translate3d(' + idleX.toFixed(2) + 'px,' + tyL.toFixed(2) + 'px,0) scale(1,' +
                                   (1 + force * 0.6 + force2).toFixed(4) + ')';
    /* Lab plate: pulled out from below by the Projects plate */
    var tyB = idleY + (1 - tear2) * IN;
    bdInnerBlue.style.transform = 'translate3d(' + idleX.toFixed(2) + 'px,' + tyB.toFixed(2) + 'px,0) scale(1,' +
                                  (1 + force2 * 0.6).toFixed(4) + ')';
    /* V3.3: the ground is part of the building's picture — same drift, same
       tear, and it fades out on the same window as the dark plate */
    /* V3: the geometry field recedes with the building — same tear, damped,
       and fades on the same hand-over window */
    if (window.HERO_FIELD) window.HERO_FIELD.handover(pw, idleX, ty);


    /* Type in Projects is chosen from the ground's own luminance rather than from
       scroll position, so it always takes whichever end reads better. The two
       are equal at a ground luminance of ~0.22; the blend either side of that is
       kept narrow so the unavoidable low-contrast crossover passes quickly. */
    /* V5.3 — the ground colour turns on a wider, earlier window than the
       plates (from the next section's top at 78% of the viewport to 15%), so
       the next chapter's colour is seen coming and never pushes up as a hard
       edge. Smootherstep, as before. */
    var ss = function (t) { t = clamp(t, 0, 1); return t * t * t * (t * (6 * t - 15) + 10); };
    var washA = ss((p - 0.22) / 0.63), washB = ss((p2 - 0.22) / 0.63);
    var ground = [CREAM[0] + (SEPIA[0] - CREAM[0]) * washA,
                  CREAM[1] + (SEPIA[1] - CREAM[1]) * washA,
                  CREAM[2] + (SEPIA[2] - CREAM[2]) * washA];
    ground = [ground[0] + (VERD[0] - ground[0]) * washB,
              ground[1] + (VERD[1] - ground[1]) * washB,
              ground[2] + (VERD[2] - ground[2]) * washB];
    /* A hard switch, not a blend: blending the two endpoints produces exactly the
       mid-grey the ground is passing through, which is how the type became
       unreadable mid-scroll. Flipping at the luminance where both ends give
       equal contrast keeps the floor at the best value available (~3.3:1). */
    var gl = relLum(ground);
    nav.classList.toggle('on-dark', gl < 0.22);          /* V5.3: follows the ground itself */
    var tv = gl < 0.215 ? 1 : 0;
    /* terracotta sits far higher up the luminance scale than ink, so its own
       break-even point is later — switching it there lifts its worst case */
    var ta = gl < 0.235 ? 1 : 0;
    var s = projectsEl.style;
    s.setProperty('--proj-ink',    mixRGB(INK,   PAPER_TXT,  tv));
    s.setProperty('--proj-soft',   mixRGB(SOFT,  PAPER_SOFT, tv));
    s.setProperty('--proj-accent', mixRGB(TERRA, TERRA_LT,   ta));

    S.gl = gl;
    pageWash.style.backgroundColor = 'rgb(' + Math.round(ground[0]) + ',' + Math.round(ground[1]) + ',' + Math.round(ground[2]) + ')';
  }

  function stepSmoke(dt) {
    var i, boost = clamp(S.scrollPush * 0.5, 0, 2.2);
    if (!REDUCED) {
      /* V5.5 trial: no smoke on the hero building — steam only on the dark chapters */
      var em = (S.plate && S.plate !== bdInnerDark) ? emitters() : [];
      for (i = 0; i < em.length; i++) {
        if (Math.random() < (0.16 + boost * 0.16) * em[i].s * dt) {
          puffSmoke(em[i].x, em[i].y, 0.85 + em[i].s * 0.75 * em[i].scale, boost);
        }
      }
    }
    for (i = smoke.length - 1; i >= 0; i--) {
      var p = smoke[i];
      p.x += (p.vx + 0.07 + boost * 0.08) * dt;
      p.y += p.vy * (1 + boost * 0.5) * dt;
      p.r += p.grow * dt;
      p.life -= p.decay * (1 + boost * 0.4) * dt;
      if (p.life <= 0 || p.y < -120) smoke.splice(i, 1);
    }
    if (smoke.length > 240) smoke.splice(0, smoke.length - 240);
  }

  /* ═══════════════ DRAW ═══════════════ */
  function paintSmoke(c, fg) {
    if (!blobSprite) return;
    var sprite = S.gl < 0.3 ? blobPale : blobSprite;
    for (var s = 0; s < smoke.length; s++) {
      var p = smoke[s];
      if (!!p.fg !== fg) continue;
      c.globalAlpha = clamp(p.life * p.a, 0, 1) * (sprite === blobPale ? 0.26 : 0.20);   /* V5.2: pale steam toned down too */
      c.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    c.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, S.CW || S.W, S.CH || S.H);
    paintSmoke(ctx, false);
    paintSmoke(ctx, true);
  }

  /* ═══════════════ GO ═══════════════ */
  if (window.ResizeObserver) new ResizeObserver(layout).observe(heroEl);
  window.addEventListener('resize', layout);
  window.addEventListener('pageshow', layout);
  window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
  backdropPlate.addEventListener('load', layout);

  /* If the first layout lands while the page is zero-sized, ResizeObserver
     normally recovers it — but rAF (and so the in-loop retry) is suspended in a
     background tab, so poll briefly as well. */
  var healTries = 0;
  function healLayout() {
    if (S.W >= 2 || healTries++ > 40) return;
    layout();
    setTimeout(healLayout, 120);
  }

  layout();
  healLayout();
  updateBackdrop();
  requestAnimationFrame(frame);   /* starts the one and only frame loop */

})();
