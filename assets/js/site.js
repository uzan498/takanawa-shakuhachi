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
        ? '<div class="flyer"><img src="' + esc(g.flyer) + '" alt="' + esc(g.title) + 'のチラシ" loading="lazy"></div>'
        : '<div class="flyer">チラシ準備中</div>';
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
        ? '<div class="thumb"><img src="' + esc(g.flyer) + '" alt="' + esc(g.title) + 'のチラシ" loading="lazy"></div>'
        : '<div class="thumb">チラシ準備中</div>';
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

  /* ── 左のレールと、スマホ下部のボタン ── */
  function railAndCta() {
    var rail = document.querySelector('.rail');
    var mcta = document.getElementById('mcta');
    var hero = document.getElementById('top');
    var artist = document.getElementById('artist');
    var apply = document.getElementById('apply');
    if (!rail && !mcta) return;

    var links = rail ? Array.prototype.slice.call(rail.querySelectorAll('a')) : [];
    var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });

    function sync() {
      var y = window.scrollY + window.innerHeight * 0.42;
      if (rail) {
        var cur = -1;
        secs.forEach(function (s, i) { if (s && s.offsetTop <= y) cur = i; });
        links.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
        var inHero = hero && window.scrollY < hero.offsetHeight - 40;
        var inArtist = artist && y > artist.offsetTop && y < artist.offsetTop + artist.offsetHeight;
        rail.classList.toggle('dark', !!(inHero || inArtist));
      }
      if (mcta && apply) {
        var progress = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
        mcta.classList.toggle('show',
          progress > 0.5 && window.scrollY + window.innerHeight < apply.offsetTop + 200);
      }
    }
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadGigs();
    reveal();
    railAndCta();
  });
})();
