/* میگزین ویور: ایک صفحہ / دو صفحات، زوم، تھمب نیل، کی بورڈ اور سوائپ */
(function () {
  'use strict';

  var TOTAL = 15;                       // کل صفحات
  var ASPECT = 595.3 / 841.9;           // A4 چوڑائی / اونچائی
  var TITLE = 'الحاج شمیم الدین رحمہ اللہ کی دینی، مذہبی و ملی خدمات';
  var SUB = 'تحقیقی مقالے کا خلاصہ (Abstract) — ایم فل اسلامیات';
  var ZMIN = 0.5, ZMAX = 4, ZSTEP = 1.25;

  var body = document.body;
  var PAGE_MODE = body.dataset.mode === 'page';
  var stage = document.getElementById('stage');
  var book = document.getElementById('book');

  var state = { page: 1, view: 1, zoom: 1 };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function imgSrc(n) { return 'images/page-' + pad(n) + '.jpg'; }
  function thumbSrc(n) { return 'images/thumb-' + pad(n) + '.jpg'; }
  function pageUrl(n) { return 'page-' + pad(n) + '.html'; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* سرورق اکیلا، پھر (2،3) (4،5) ... */
  function spread(p, view) {
    if (view === 1 || p <= 1) return [clamp(p, 1, TOTAL)];
    var a = p % 2 === 0 ? p : p - 1;
    return a + 1 <= TOTAL ? [a, a + 1] : [a];
  }

  /* ---------- UI ---------- */
  var ICON = {
    menu: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    fit: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* آٹھ کونوں والا ستارہ (لوگو) */
  function LOGO(draw) {
    return '<svg class="logo" viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#e0be72" stroke-width="2.2">' +
      '<g class="spin"><rect class="' + (draw ? 'draw' : '') + '" x="22" y="22" width="56" height="56"/>' +
      '<rect class="' + (draw ? 'draw' : '') + '" x="22" y="22" width="56" height="56" transform="rotate(45 50 50)"/></g>' +
      '<circle class="' + (draw ? 'draw' : '') + '" cx="50" cy="50" r="15"/><circle cx="50" cy="50" r="4" fill="#e0be72"/></svg>';
  }

  function buildDust() {
    var d = document.createElement('div'); d.className = 'dust'; d.setAttribute('aria-hidden', 'true');
    var h = '';
    for (var i = 0; i < 18; i++) {
      h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;--s:' + (2 + Math.random() * 4).toFixed(1) + 'px;' +
           '--d:' + (14 + Math.random() * 16).toFixed(1) + 's;--l:-' + (Math.random() * 20).toFixed(1) + 's;' +
           '--x:' + (Math.random() * 120 - 60).toFixed(0) + 'px"></i>';
    }
    d.innerHTML = h;
    body.insertBefore(d, body.firstChild);
  }

  function buildSplash() {
    var seen = null;
    try { seen = sessionStorage.getItem('mag-splash'); } catch (e) {}
    if (seen || location.hash || PAGE_MODE) return;
    try { sessionStorage.setItem('mag-splash', '1'); } catch (e) {}
    var s = document.createElement('div'); s.id = 'splash';
    s.innerHTML = LOGO(true) + '<h1>' + TITLE + '</h1><p>تحقیقی و تجزیاتی مطالعہ — ایم فل اسلامیات</p><small>شروع کرنے کے لیے کلک کریں</small>';
    body.appendChild(s);
    var close = function () { s.classList.add('hide'); setTimeout(function () { s.remove(); }, 1000); };
    s.onclick = close; setTimeout(close, 3200);
  }

  function buildChrome() {
    buildDust();
    var bar = document.createElement('header');
    bar.className = 'bar';
    bar.innerHTML =
      '<button class="btn group" id="bThumbs" title="فہرستِ صفحات" aria-label="فہرستِ صفحات">' + ICON.menu + '<span class="lbl">صفحات</span></button>' +
      '<a class="brand" href="index.html">' + LOGO(false) + '<span class="t"><b>' + TITLE + '</b><small>' + SUB + '</small></span></a>' +
      '<div class="tools">' +
        '<div class="group view-grp">' +
          '<button class="btn" id="bV1" title="ایک صفحہ">ایک صفحہ</button>' +
          '<span class="sep"></span>' +
          '<button class="btn" id="bV2" title="دو صفحات">دو صفحات</button>' +
        '</div>' +
        '<div class="group">' +
          '<button class="btn" id="bZin" title="زوم اِن (+)" aria-label="زوم اِن">' + ICON.plus + '</button>' +
          '<span class="zoom-val" id="zVal">100%</span>' +
          '<button class="btn" id="bZout" title="زوم آؤٹ (-)" aria-label="زوم آؤٹ">' + ICON.minus + '</button>' +
          '<span class="sep"></span>' +
          '<button class="btn" id="bZfit" title="اسکرین کے مطابق (0)" aria-label="اسکرین کے مطابق">' + ICON.fit + '</button>' +
        '</div>' +
        '<div class="group">' +
          '<button class="btn" id="bLink" title="اس صفحے کا لنک کاپی کریں" aria-label="لنک کاپی کریں">' + ICON.link + '</button>' +
          '<span class="sep"></span>' +
          '<button class="btn" id="bFull" title="فل اسکرین (F)" aria-label="فل اسکرین">' + ICON.full + '</button>' +
        '</div>' +
      '</div>';
    body.insertBefore(bar, stage);

    var pager = document.createElement('nav');
    pager.className = 'pager';
    pager.setAttribute('aria-label', 'صفحات');
    pager.innerHTML =
      '<div class="progress"><i id="pBar"></i></div>' +
      '<button class="btn" id="bPrev" aria-label="پچھلا صفحہ">' + ICON.right + '<span class="lbl">پچھلا</span></button>' +
      '<div class="num"><input id="pNum" type="number" min="1" max="' + TOTAL + '" inputmode="numeric" aria-label="صفحہ نمبر"><span id="pTot"></span></div>' +
      '<button class="btn" id="bNext" aria-label="اگلا صفحہ"><span class="lbl">اگلا</span>' + ICON.left + '</button>';
    body.appendChild(pager);

    var scrim = document.createElement('div'); scrim.id = 'scrim';
    var th = document.createElement('aside'); th.id = 'thumbs';
    th.setAttribute('aria-label', 'فہرستِ صفحات');
    var items = '';
    for (var i = 1; i <= TOTAL; i++) {
      items += '<a data-p="' + i + '" style="--i:' + (i - 1) + '" href="' + (PAGE_MODE ? pageUrl(i) : '#' + i) + '">' +
               '<img loading="lazy" alt="صفحہ ' + i + '" src="' + thumbSrc(i) + '"><span>صفحہ ' + i + '</span></a>';
    }
    th.innerHTML = '<header><b>فہرستِ صفحات</b><button class="btn" id="bClose" aria-label="بند کریں">' + ICON.close + '</button></header><div class="grid">' + items + '</div>';
    var toast = document.createElement('div'); toast.id = 'toast';
    body.appendChild(scrim); body.appendChild(th); body.appendChild(toast);
  }

  buildChrome();
  buildSplash();
  var $ = function (id) { return document.getElementById(id); };
  var turnDir = '';                       // 'next' | 'prev' | ''

  /* تصویر لوڈ ہونے پر خاکہ ہٹائیں */
  function markLoaded(im) {
    if (im.complete && im.naturalWidth) { im.classList.add('ld'); }
    else { im.addEventListener('load', function () { im.classList.add('ld'); }); im.addEventListener('error', function () { im.classList.add('ld'); }); }
  }
  Array.prototype.forEach.call(book.querySelectorAll('img'), markLoaded);

  /* بٹنوں پر لہر کا اثر */
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn');
    if (!b || b.disabled) return;
    b.classList.remove('rip'); void b.offsetWidth; b.classList.add('rip');
  });

  /* ---------- fit & zoom ---------- */
  function fit() {
    var n = book.children.length || 1;
    var W = stage.clientWidth - 32, H = stage.clientHeight - 32;
    var base = Math.max(120, Math.min(H, W / (n * ASPECT)));
    var h = base * state.zoom;
    book.style.setProperty('--h', h + 'px');
    book.style.setProperty('--w', (h * ASPECT) + 'px');
    var zv = $('zVal'), txt = Math.round(state.zoom * 100) + '%';
    if (zv.textContent !== txt) { zv.textContent = txt; zv.classList.remove('pop'); void zv.offsetWidth; zv.classList.add('pop'); }
    stage.classList.toggle('zoomed', state.zoom > 1.02);
    $('bZin').disabled = state.zoom >= ZMAX - 0.001;
    $('bZout').disabled = state.zoom <= ZMIN + 0.001;
  }

  function setZoom(z) {
    z = clamp(z, ZMIN, ZMAX);
    // موجودہ مرکز محفوظ رکھیں
    var fx = (stage.scrollLeft + stage.clientWidth / 2) / (stage.scrollWidth || 1);
    var fy = (stage.scrollTop + stage.clientHeight / 2) / (stage.scrollHeight || 1);
    state.zoom = z;
    fit();
    stage.scrollLeft = fx * stage.scrollWidth - stage.clientWidth / 2;
    stage.scrollTop = fy * stage.scrollHeight - stage.clientHeight / 2;
  }

  /* ---------- navigation ---------- */
  function lastOf(p) { var s = spread(p, state.view); return s[s.length - 1]; }
  function firstOf(p) { return spread(p, state.view)[0]; }

  function go(p) {
    p = clamp(p, 1, TOTAL);
    if (PAGE_MODE) { if (p !== state.page) location.href = pageUrl(p); return; }
    turnDir = p > state.page ? 'next' : (p < state.page ? 'prev' : '');
    if (location.hash !== '#' + p + '&v=' + state.view) {
      location.hash = p + '&v=' + state.view;   // hashchange → render
    } else { render(); }
  }
  function next() { go(PAGE_MODE ? state.page + 1 : lastOf(state.page) + 1); }
  function prev() { go(PAGE_MODE ? state.page - 1 : firstOf(state.page) - 1); }

  function render() {
    var pages = spread(state.page, state.view);
    state.page = pages[0];
    book.innerHTML = '';
    pages.forEach(function (p) {
      var im = new Image();
      im.src = imgSrc(p); im.alt = 'صفحہ ' + p; im.draggable = false;
      markLoaded(im);
      book.appendChild(im);
    });
    book.className = 'book' + (pages.length > 1 ? ' spread' : '');
    if (turnDir) { book.setAttribute('data-turn', turnDir); } else { book.removeAttribute('data-turn'); }
    turnDir = '';
    document.title = (pages.length > 1 ? 'صفحات ' + pages[0] + '–' + pages[1] : 'صفحہ ' + pages[0]) + ' — ' + TITLE;
    stage.scrollLeft = 0; stage.scrollTop = 0;
    fit(); updateUI(pages);
    [pages[0] - 1, pages[pages.length - 1] + 1].forEach(function (p) {
      if (p >= 1 && p <= TOTAL) { new Image().src = imgSrc(p); }
    });
  }

  function updateUI(pages) {
    pages = pages || spread(state.page, state.view);
    var shown = PAGE_MODE ? [state.page] : pages;
    $('pNum').value = shown[0];
    $('pTot').textContent = (shown.length > 1 ? ' – ' + shown[1] : '') + ' / ' + TOTAL;
    $('bV1').classList.toggle('on', state.view === 1);
    $('bV2').classList.toggle('on', state.view === 2);
    var first = shown[0], last = shown[shown.length - 1];
    $('pBar').style.width = (last / TOTAL * 100) + '%';
    $('bPrev').disabled = first <= 1;
    $('bNext').disabled = last >= TOTAL;
    var links = document.querySelectorAll('#thumbs a');
    for (var i = 0; i < links.length; i++) {
      var p = +links[i].dataset.p;
      links[i].classList.toggle('active', shown.indexOf(p) !== -1);
    }
  }

  /* ---------- شروع ---------- */
  if (PAGE_MODE) {
    state.page = clamp(parseInt(body.dataset.page, 10) || 1, 1, TOTAL);
    state.view = 1;
    fit(); updateUI();
  } else {
    var saved = parseInt(load('mag-view'), 10);
    state.view = saved === 1 || saved === 2 ? saved : (window.innerWidth >= 900 ? 2 : 1);
    var readHash = function () {
      var m = /^#(\d+)(?:&v=([12]))?/.exec(location.hash);
      state.page = m ? clamp(parseInt(m[1], 10), 1, TOTAL) : 1;
      if (m && m[2]) { state.view = +m[2]; store('mag-view', state.view); }
      render();
    };
    window.addEventListener('hashchange', readHash);
    readHash();
  }

  /* ---------- events ---------- */
  $('bV1').onclick = function () {
    if (state.view === 1) return;
    state.view = 1; store('mag-view', 1);
    if (PAGE_MODE) return;
    go(state.page);
  };
  $('bV2').onclick = function () {
    store('mag-view', 2);
    if (PAGE_MODE) { location.href = 'index.html#' + state.page + '&v=2'; return; }
    if (state.view === 2) return;
    state.view = 2; go(state.page);
  };
  $('bZin').onclick = function () { setZoom(state.zoom * ZSTEP); };
  $('bZout').onclick = function () { setZoom(state.zoom / ZSTEP); };
  $('bZfit').onclick = function () { setZoom(1); stage.scrollLeft = 0; stage.scrollTop = 0; };
  $('bPrev').onclick = prev;
  $('bNext').onclick = next;
  $('pNum').onchange = function () { go(parseInt(this.value, 10) || 1); };
  $('pNum').onfocus = function () { this.select(); };

  function showToast(t) {
    var el = $('toast'); el.textContent = t; el.classList.add('show');
    clearTimeout(showToast.t); showToast.t = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }
  $('bLink').onclick = function () {
    var url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { showToast('لنک کاپی ہو گیا'); },
        function () { prompt('لنک کاپی کریں:', url); });
    } else { prompt('لنک کاپی کریں:', url); }
  };
  $('bFull').onclick = toggleFull;
  function toggleFull() {
    var d = document;
    if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || function () {}).call(d.documentElement); }
    else { d.exitFullscreen(); }
  }

  function drawer(open) {
    $('thumbs').classList.toggle('show', open);
    $('scrim').classList.toggle('show', open);
    if (open) {
      var a = document.querySelector('#thumbs a.active');
      if (a && a.scrollIntoView) a.scrollIntoView({ block: 'center' });
    }
  }
  $('bThumbs').onclick = function () { drawer(true); };
  $('bClose').onclick = function () { drawer(false); };
  $('scrim').onclick = function () { drawer(false); };
  $('thumbs').addEventListener('click', function (e) {
    if (e.target.closest('a')) drawer(false);
  });

  window.addEventListener('resize', fit);
  document.addEventListener('keydown', function (e) {
    if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    switch (e.key) {
      case 'ArrowLeft': next(); break;      // دائیں سے بائیں کتاب
      case 'ArrowRight': prev(); break;
      case 'PageDown': next(); break;
      case 'PageUp': prev(); break;
      case 'Home': go(1); break;
      case 'End': go(TOTAL); break;
      case '+': case '=': setZoom(state.zoom * ZSTEP); break;
      case '-': case '_': setZoom(state.zoom / ZSTEP); break;
      case '0': setZoom(1); break;
      case 'f': case 'F': toggleFull(); break;
      case 'Escape': drawer(false); break;
      default: return;
    }
    e.preventDefault();
  });

  /* ماؤس: Ctrl+وہیل سے زوم، ڈبل کلک، کھینچ کر حرکت */
  stage.addEventListener('wheel', function (e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom(state.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
  }, { passive: false });
  stage.addEventListener('dblclick', function () { setZoom(state.zoom > 1.05 ? 1 : 2); });

  var drag = null;
  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || state.zoom <= 1.02) return;
    drag = { x: e.clientX, y: e.clientY, l: stage.scrollLeft, t: stage.scrollTop };
    stage.classList.add('dragging');
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    stage.scrollLeft = drag.l - (e.clientX - drag.x);
    stage.scrollTop = drag.t - (e.clientY - drag.y);
  });
  window.addEventListener('pointerup', function () { drag = null; stage.classList.remove('dragging'); });

  /* ٹچ: زوم 100% پر سوائپ سے صفحہ پلٹیں (دائیں سوائپ = اگلا) */
  var t0 = null;
  stage.addEventListener('touchstart', function (e) {
    t0 = (e.touches.length === 1 && state.zoom <= 1.02) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!t0) return;
    var t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y;
    t0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx > 0 ? next() : prev(); }
  }, { passive: true });
})();
