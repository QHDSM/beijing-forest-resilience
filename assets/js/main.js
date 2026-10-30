/* =========================================================
   交互脚本：版本切换 / 滚动进度 / 导航高亮 / 入场动效
   无依赖，兼容 GitHub Pages
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. 技术路线版本切换 ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = {
    v1: document.getElementById('panel-v1'),
    v2: document.getElementById('panel-v2')
  };

  function activate(ver, focus) {
    tabs.forEach(function (t) {
      var on = t.dataset.ver === ver;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    Object.keys(panels).forEach(function (k) {
      if (panels[k]) panels[k].hidden = (k !== ver);
    });
    // 切换后重新触发展开动画
    var current = panels[ver];
    if (current) {
      current.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.remove('in');
        requestAnimationFrame(function () { el.classList.add('in'); });
      });
    }
    try { sessionStorage.setItem('route-ver', ver); } catch (e) {}
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { activate(tab.dataset.ver, false); });
    tab.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(tab);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
        activate(tabs[next].dataset.ver, true);
      }
    });
  });

  if (tabs.length) {
    var saved = null;
    try { saved = sessionStorage.getItem('route-ver'); } catch (e) {}
    activate(saved === 'v1' ? 'v1' : 'v2', false);
  }

  /* ---------- 2. 滚动进度条 ---------- */
  var progress = document.getElementById('progress');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
    if (progress) progress.style.width = pct.toFixed(2) + '%';
    spy();
  }

  /* ---------- 3. 导航高亮 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var targets = navLinks.map(function (a) {
    var id = a.getAttribute('href').slice(1);
    return { link: a, el: document.getElementById(id) };
  }).filter(function (t) { return t.el; });

  var spyTick = false;
  function spy() {
    if (spyTick) return;
    spyTick = true;
    requestAnimationFrame(function () {
      spyTick = false;
      var y = window.scrollY + 120;
      var active = null;
      targets.forEach(function (t) {
        if (t.el.offsetTop <= y) active = t;
      });
      navLinks.forEach(function (a) { a.classList.remove('active'); });
      if (active) active.link.classList.add('active');
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- 4. 入场动效 ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 5. 平滑锚点（兼容旧浏览器） ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });
})();
