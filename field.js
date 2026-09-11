/* ═══════════════════════════════════════════════════════════════
   field.js — V3 hero: the geometric field behind the building.
   ~35 flat shapes authored as data, rendered as clip-path polygons, pushed
   apart by the cursor (impulse into a damped spring) and driven from the one
   frame loop in app.js through window.HERO_FIELD.step(). No rAF here.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var field = document.getElementById('field');
  var copyEl = document.querySelector('.hero-copy');
  if (!field) return;

  /* palette — sampled from assets/ref/new_background_element.jpg
     (tools: PIL median-cut, 24 colours). sage and slate are the two hues the
     clustering folds into olive/navy; they are read off the plate by eye. */
  var C = {
    navy: '#2d3140', ink: '#2c282d', charcoal: '#3d3c3f', olive: '#494a43',
    taupe: '#625c51', rust: '#6f3a2b', sienna: '#8d563c', tan: '#ac8f77',
    sand: '#ceb095', sage: '#5b6a5c', slate: '#4f5f6e'
  };

  /* unit-box polygons */
  var TRI = {
    tl: [[0, 0], [1, 0], [0, 1]], tr: [[0, 0], [1, 0], [1, 1]],
    bl: [[0, 0], [1, 1], [0, 1]], br: [[1, 0], [1, 1], [0, 1]],
    up: [[0.5, 0], [1, 1], [0, 1]], down: [[0, 0], [1, 0], [0.5, 1]]
  };
  function arc(cx, cy, r, a0, a1, n) {
    var p = [];
    for (var i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * i / n;
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return p;
  }
  var PI = Math.PI;
  var SHAPE = {
    rect: [[0, 0], [1, 0], [1, 1], [0, 1]],
    circle: arc(0.5, 0.5, 0.5, 0, PI * 2, 56),
    /* quarter discs: the corner that holds the right angle */
    qtl: [[0, 0]].concat(arc(0, 0, 1, 0, PI / 2, 24)),
    qtr: [[1, 0]].concat(arc(1, 0, 1, PI / 2, PI, 24)),
    qbr: [[1, 1]].concat(arc(1, 1, 1, PI, PI * 1.5, 24)),
    qbl: [[0, 1]].concat(arc(0, 1, 1, PI * 1.5, PI * 2, 24)),
    /* half discs: the flat side */
    htop: arc(0.5, 0, 0.5, 0, PI, 30),          /* flat on top, bulge down */
    hbot: arc(0.5, 1, 0.5, PI, PI * 2, 30),
    hleft: arc(0, 0.5, 0.5, -PI / 2, PI / 2, 30),
    hright: arc(1, 0.5, 0.5, PI / 2, PI * 1.5, 30)
  };

  /* x,y: fractions of field width/height. w,h: fractions of field WIDTH (so
     shapes keep their proportions on every viewport). split: unit normal of
     the cut line through the shape's centre (the two halves fly apart along
     it). Quiet zone: nothing lives in the type column (left ~36% × 20–80%). */
  /* V3.1: only small discs — the large blocks read badly when they rotated.
     x,y fractions of the field; w,h fractions of the field width. Nothing in
     the type column or the nav band; the building's centre is left clear. */
  /* V3.2: six discs, scattered. Nothing in the type column, the nav band, or
     under the ground strip (bottom ~32% of the viewport). */
  var DEFS = [
    { p: SHAPE.circle, x: .72, y: .15, w: .040, h: .040, c: C.navy },
    { p: SHAPE.circle, x: .91, y: .30, w: .022, h: .022, c: C.rust },
    { p: SHAPE.circle, x: .64, y: .55, w: .018, h: .018, c: C.slate },
    { p: SHAPE.circle, x: .86, y: .52, w: .052, h: .052, c: C.olive },
    { p: SHAPE.circle, x: .17, y: .075, w: .020, h: .020, c: C.sienna },
    { p: SHAPE.circle, x: .41, y: .095, w: .016, h: .016, c: C.sage }
  ];

  /* Sutherland–Hodgman: keep the side of the line (through c, normal n) where
     (p - c)·n * sign >= 0 */
  function clipHalf(poly, cx, cy, nx, ny, sign) {
    var out = [], n = poly.length;
    var side = function (p) { return ((p[0] - cx) * nx + (p[1] - cy) * ny) * sign; };
    for (var i = 0; i < n; i++) {
      var a = poly[i], b = poly[(i + 1) % n], sa = side(a), sb = side(b);
      if (sa >= 0) out.push(a);
      if ((sa >= 0) !== (sb >= 0)) {
        var t = sa / (sa - sb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }
  function polyCss(poly) {
    return 'polygon(' + poly.map(function (p) {
      return (p[0] * 100).toFixed(2) + '% ' + (p[1] * 100).toFixed(2) + '%';
    }).join(',') + ')';
  }
  function centroid(poly) {
    var x = 0, y = 0;
    for (var i = 0; i < poly.length; i++) { x += poly[i][0]; y += poly[i][1]; }
    return [x / poly.length, y / poly.length];
  }

  var shapes = [];
  function make(def, poly, part) {
    var el = document.createElement('div');
    el.className = 'fshape';
    el.style.background = def.c;
    el.style.clipPath = polyCss(poly);
    field.appendChild(el);
    var c = centroid(poly);
    shapes.push({ el: el, def: def, part: part, ccx: c[0], ccy: c[1],
                  x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0, area: 1,
                  ox: 0, oy: 0, vx: 0, vy: 0, rot: 0, vr: 0, disp: false, hidden: false });
  }
  DEFS.forEach(function (d) {
    if (d.split) {
      /* the cut runs through the unit box centre; halves are flush at rest */
      make(d, clipHalf(d.p, 0.5, 0.5, d.split[0], d.split[1], 1), 1);
      make(d, clipHalf(d.p, 0.5, 0.5, d.split[0], d.split[1], -1), -1);
    } else make(d, d.p, 0);
  });

  var W = 0, H = 0, KEEP = null, mobile = false;
  function layout() {
    var r = field.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    W = r.width; H = r.height; mobile = W < 860;
    KEEP = null;
    if (copyEl) {
      var k = copyEl.getBoundingClientRect();
      if (k.width > 2) KEEP = { l: k.left - 18, t: k.top - 18, r: k.right + 18, b: k.bottom + 18 };
    }
    shapes.forEach(function (s) {
      var d = s.def, scale = mobile ? 1.35 : 1;      /* fewer pixels → bigger blocks */
      s.w = d.w * W * scale; s.h = d.h * W * scale;
      s.x = d.x * W; s.y = d.y * H;
      s.cx = s.x + s.ccx * s.w; s.cy = s.y + s.ccy * s.h;
      s.area = s.w * s.h;
      s.el.style.left = s.x.toFixed(1) + 'px'; s.el.style.top = s.y.toFixed(1) + 'px';
      s.el.style.width = s.w.toFixed(1) + 'px'; s.el.style.height = s.h.toFixed(1) + 'px';
      /* contrast guard: a shape whose home overlaps the type column is not
         shown at all (this happens on narrow viewports, where the copy sits on
         top of the field) */
      s.hidden = !!KEEP && s.x < KEEP.r && s.x + s.w > KEEP.l && s.y < KEEP.b && s.y + s.h > KEEP.t;
      s.el.style.display = s.hidden ? 'none' : '';
    });
  }

  /* ── the repulsor ── */
  /* Critically damped and heavy: ω = √K ≈ 0.0245/frame, 1 − DAMP ≈ 2ω. A flick
     peaks ~0.7 s out and takes ~3 s to come home with no bounce. (The duck's
     shove used K .028 / DAMP .86 — over-damped, which snapped back in 0.5 s.) */
  var R = 190, MAXD = 150, K = 0.0006, DAMP = 0.951, VMAX = 20;
  var HOLD = 0.03, FLICK = 0.12;             /* per-frame shove while inside R; extra per px of cursor speed */
  var AREA_REF = 0.012;                      /* w·h as a fraction of W² */
  var ptr = { x: -1e5, y: -1e5, lx: -1e5, ly: -1e5, active: false, moved: false };
  var displaced = [], faded = false;

  if (!REDUCED) {
    window.addEventListener('pointermove', function (e) {
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true; ptr.moved = true;
    }, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true; ptr.moved = true;
    }, { passive: true });
    var off = function () { ptr.active = false; ptr.lx = ptr.ly = -1e5; };
    window.addEventListener('pointerup', off, { passive: true });
    window.addEventListener('pointercancel', off, { passive: true });
    window.addEventListener('pointerleave', off, { passive: true });
    document.addEventListener('mouseleave', off);
  }

  /* Runs every frame the pointer is inside the hero. A resting cursor keeps a
     bounded dent open (HOLD/K ≈ 50 px at the centre, falling to 0 at R); a
     moving one adds an impulse proportional to its speed, so a flick sends
     shapes flying and the spring brings them back slowly. */
  function push(dt) {
    var vx = ptr.lx > -1e4 ? ptr.x - ptr.lx : 0, vy = ptr.ly > -1e4 ? ptr.y - ptr.ly : 0;
    var speed = Math.min(70, Math.sqrt(vx * vx + vy * vy));
    ptr.lx = ptr.x; ptr.ly = ptr.y;
    var base = HOLD + speed * FLICK;
    for (var i = 0; i < shapes.length; i++) {
      var s = shapes[i];
      if (s.hidden) continue;
      var dx = s.cx + s.ox - ptr.x, dy = s.cy + s.oy - ptr.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d >= R || d < 0.5) continue;
      var t = 1 - d / R, f = t * t * (3 - 2 * t);           /* smoothstep falloff */
      var size = clamp(Math.sqrt(AREA_REF * W * W / s.area), 0.55, 2.4);
      var imp = base * f * size * dt;
      var ux = dx / d, uy = dy / d;
      if (s.part) {
        /* halves crack open along the cut normal, with a little of the
           radial shove so the whole shape still drifts off the cursor */
        var nx = s.def.split[0] * s.part, ny = s.def.split[1] * s.part;
        ux = nx * 0.8 + ux * 0.35; uy = ny * 0.8 + uy * 0.35;
      }
      s.vx += imp * ux; s.vy += imp * uy;
      s.vr += imp * 1.2 * (s.part || ((i & 1) ? 1 : -1));
      if (!s.disp) { s.disp = true; displaced.push(s); }
    }
  }

  function step(dt) {
    if (REDUCED || faded) return;
    if (ptr.active) push(dt);
    if (!displaced.length) return;
    var damp = Math.pow(DAMP, dt), i, s;
    for (i = displaced.length - 1; i >= 0; i--) {
      s = displaced[i];
      s.vx = clamp((s.vx - s.ox * K * dt) * damp, -VMAX, VMAX);
      s.vy = clamp((s.vy - s.oy * K * dt) * damp, -VMAX, VMAX);
      s.ox += s.vx * dt; s.oy += s.vy * dt;
      var m = Math.sqrt(s.ox * s.ox + s.oy * s.oy);
      if (m > MAXD) { s.ox *= MAXD / m; s.oy *= MAXD / m; }
      s.vr = (s.vr - s.rot * K * 1.4 * dt) * damp;
      s.rot += s.vr * dt;
      /* the type column is a wall: a shape may not be pushed under the copy */
      if (KEEP) {
        var l = s.x + s.ox, t = s.y + s.oy, r = l + s.w, b = t + s.h;
        if (l < KEEP.r && r > KEEP.l && t < KEEP.b && b > KEEP.t) {
          var px = Math.min(r - KEEP.l, KEEP.r - l), py = Math.min(b - KEEP.t, KEEP.b - t);
          if (px < py) { s.ox += (r - KEEP.l < KEEP.r - l) ? -px : px; s.vx = 0; }
          else         { s.oy += (b - KEEP.t < KEEP.b - t) ? -py : py; s.vy = 0; }
        }
      }
      if (Math.abs(s.ox) + Math.abs(s.oy) < 0.15 && Math.abs(s.vx) + Math.abs(s.vy) < 0.05 &&
          Math.abs(s.rot) < 0.02 && Math.abs(s.vr) < 0.01) {
        s.ox = s.oy = s.vx = s.vy = s.rot = s.vr = 0; s.disp = false;
        s.el.style.transform = '';
        displaced.splice(i, 1);
        continue;
      }
      s.el.style.transform = 'translate3d(' + s.ox.toFixed(2) + 'px,' + s.oy.toFixed(2) + 'px,0) rotate(' +
                             s.rot.toFixed(3) + 'deg)';
    }
  }

  /* ── scroll hand-over: recede with the building ── */
  function handover(pw, idleX, ty) {
    var o = 1 - pw;
    field.style.opacity = o.toFixed(3);
    field.style.transform = 'translate3d(' + (idleX * 0.6).toFixed(2) + 'px,' + (ty * 0.55).toFixed(2) + 'px,0)';
    var gone = o <= 0.002;
    if (gone !== faded) { faded = gone; field.style.visibility = gone ? 'hidden' : ''; }
  }

  window.HERO_FIELD = { step: step, layout: layout, handover: handover, shapes: shapes, keep: function () { return KEEP; } };
  layout();
})();
