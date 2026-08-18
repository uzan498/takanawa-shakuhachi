/* 高輪尺八教室　共通スクリプト
   ふだんの更新でこのファイルを触る必要はありません。
   出演情報の追加・修正は gigs.json だけで完結します。 */

(function () {
  'use strict';

  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  /* ── 出演情報の読み込み ── */
  function loadGigs() {
    var latest = document.getElementById('latest-line');
    var cards = document.getElementById('gig-cards');
    var list = document.getElementById('gig-list');
    if (!latest && !cards && !list) return;

    fetch('gigs.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('gigs.json を読み込めませんでした');
        return r.json();
      })
      .then(function (data) {
        var items = (data && data.performances) || [];
        if (latest) renderLatest(latest, items);
        if (cards) renderCards(cards, items.slice(0, 3));
        if (list) renderList(list, items);
      })
      .catch(function (e) {
        console.error(e);
        if (latest) latest.closest('.latest').style.display = 'none';
        if (cards) cards.parentNode.style.display = 'none';
        if (list) list.innerHTML = '<li><p>出演情報を読み込めませんでした。</p></li>';
      });
  }

  function renderLatest(el, items) {
    if (!items.length) { el.closest('.latest').style.display = 'none'; return; }
    var g = items[0];
    var text = g.title + (g.venue ? '（' + g.venue + '）' : '');
    el.innerHTML =
      '<span class="label">最新情報</span>' +
      '<time>' + esc(g.date) + '</time>' +
      '<span class="t">' + esc(text) + '</span>' +
      '<a class="more" href="performances.html">出演情報をすべて見る</a>';
  }

  function renderCards(el, items) {
    if (!items.length) { el.parentNode.style.display = 'none'; return; }
    el.innerHTML = items.map(function (g) {
      var flyer = g.flyer
        ? '<div class="flyer"><img src="' + esc(g.flyer) + '" alt="' + esc(g.title) + 'のチラシ" loading="lazy"' +
          ' data-flyer="' + esc(g.flyer) + '" data-flyer-back="' + esc(g.flyerBack || '') + '" data-title="' + esc(g.title) + '"></div>'
        : '<div class="flyer">チラシなし</div>';
      var meta = [g.venue, g.time, g.note].filter(Boolean).map(esc).join('<br>');
      var inner = flyer +
        '<time>' + esc(g.date) + '</time>' +
        '<b>' + esc(g.title) + '</b>' +
        '<span>' + meta + '</span>';
      return '<li>' + (g.link
        ? '<a class="card" href="' + esc(g.link) + '">' + inner + '</a>'
        : '<div class="card">' + inner + '</div>') + '</li>';
    }).join('');
  }

  function renderList(el, items) {
    if (!items.length) {
      el.innerHTML = '<li><p>現在お知らせできる出演情報はありません。</p></li>';
      return;
    }
    el.innerHTML = items.map(function (g) {
      var thumb = g.flyer
        ? '<div class="thumb"><img src="' + esc(g.flyer) + '" alt="' + esc(g.title) + 'のチラシ" loading="lazy"' +
          ' data-flyer="' + esc(g.flyer) + '" data-flyer-back="' + esc(g.flyerBack || '') + '" data-title="' + esc(g.title) + '"></div>'
        : '<div class="thumb">チラシなし</div>';
      var lines = [g.venue, g.time].filter(Boolean).map(esc).join('<br>');
      return '<li>' + thumb + '<div>' +
        '<time>' + esc(g.date) + '</time>' +
        '<h3>' + esc(g.title) + '</h3>' +
        '<p>' + lines + '</p>' +
        (g.note ? '<span class="note">' + esc(g.note) + '</span>' : '') +
        (g.link ? '<br><a class="detail-link" href="' + esc(g.link) + '">詳しく見る</a>' : '') +
        '</div></li>';
    }).join('');
  }

  /* ── チラシの拡大表示 ── */
  function setupLightbox() {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML =
      '<button type="button" class="lb-close" aria-label="閉じる">×</button>' +
      '<img alt="">' +
      '<button type="button" class="lb-flip" hidden></button>';
    document.body.appendChild(box);

    var img = box.querySelector('img');
    var flipBtn = box.querySelector('.lb-flip');
    var closeBtn = box.querySelector('.lb-close');
    var front = '', back = '', title = '', showingBack = false, opener = null;

    function render() {
      img.src = showingBack ? back : front;
      img.alt = title + (showingBack ? 'のチラシ（裏面）' : 'のチラシ');
      flipBtn.textContent = showingBack ? '表面を見る' : '裏面を見る';
    }

    function open(el) {
      front = el.getAttribute('data-flyer') || el.src;
      back = el.getAttribute('data-flyer-back') || '';
      title = el.getAttribute('data-title') || el.alt || '';
      showingBack = false;
      flipBtn.hidden = !back;
      opener = el;
      render();
      box.classList.add('show');
      closeBtn.focus();
      document.addEventListener('keydown', onKey);
    }

    function close() {
      box.classList.remove('show');
      document.removeEventListener('keydown', onKey);
      if (opener) opener.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    document.addEventListener('click', function (e) {
      var t = e.target.closest('.flyer img, .thumb img');
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      open(t);
    });

    flipBtn.addEventListener('click', function () { showingBack = !showingBack; render(); });
    closeBtn.addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
  }

  /* ── スクロールに合わせた表示 ── */
  function reveal() {
    var els = document.querySelectorAll('.rv');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (x) {
        if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ── 左のレールと、スマホ下部のボタン ──
     セクションの並び順を変えても壊れないよう、位置ではなく
     「いまどのセクションの中にいるか」で判定しています。       */
  function railAndCta() {
    var rail = document.querySelector('.rail');
    var mcta = document.getElementById('mcta');
    var hero = document.getElementById('top');
    var apply = document.getElementById('apply');
    if (!rail && !mcta) return;

    var links = rail ? Array.prototype.slice.call(rail.querySelectorAll('a')) : [];
    var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });

    function sync() {
      var y = window.scrollY + window.innerHeight * 0.42;

      if (rail) {
        /* 到達済みのうち、いちばん下にあるものを現在地とする。
           レールの並びとDOMの並びがずれていても正しく灯る。 */
        var cur = -1, top = -1;
        secs.forEach(function (s, i) {
          if (s && s.offsetTop <= y && s.offsetTop >= top) { top = s.offsetTop; cur = i; }
        });
        links.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
      }

      if (mcta && hero) {
        /* ヒーローを抜けたら出す。申し込みを見ている間だけ引っ込める。 */
        var inApply = apply && y > apply.offsetTop && y < apply.offsetTop + apply.offsetHeight;
        mcta.classList.toggle('show', window.scrollY > hero.offsetHeight && !inApply);
      }
    }
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ── スマホのメニュー ── */
  function menu() {
    var btn = document.getElementById('hbg');
    var panel = document.getElementById('menu');
    if (!btn || !panel) return;

    function open() {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', btn.getAttribute('data-label-close') || 'メニューを閉じる');
      document.body.classList.add('menu-open');
    }
    function close() {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', btn.getAttribute('data-label-open') || 'メニューを開く');
      document.body.classList.remove('menu-open');
    }
    function isOpen() { return panel.classList.contains('open'); }

    btn.addEventListener('click', function () { isOpen() ? close() : open(); });
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { close(); btn.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && isOpen()) close();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadGigs();
    reveal();
    railAndCta();
    menu();
    setupLightbox();
  });
})();
