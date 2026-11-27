// The phone in "Watch your world fill in" plays a short loop, like a screen recording of the app:
// tap Vietnam on the map > its country page slides up > tap Visited > close > Vietnam fills in.
// The map is a small globe drawn over the globe in the map screenshot (same libraries, world
// shapes and Sunset colours as globe.js); the country page is the real Vietnam screenshot with
// its Visited button redrawn on top so it can switch on. Plays only while on screen; with
// reduced motion it shows the end state.
(function () {
  var shot = document.querySelector('.map-shot');
  var canvas = shot && shot.querySelector('.fill-globe');
  if (!canvas || !window.d3 || !window.topojson || !canvas.getContext) return;
  var tap = shot.querySelector('.tap');

  var TARGET = 'Vietnam';
  var VISITED = ['China', 'Japan', 'South Korea', 'Thailand', 'Cambodia', 'Laos', 'Malaysia',
    'Indonesia', 'Australia', 'India', 'Nepal', 'Mongolia', 'Jordan', 'Israel', 'Egypt', 'Kenya',
    'Tanzania', 'South Africa', 'Turkey', 'Greece'];
  var WISHLIST = ['Russia', 'Philippines', 'Namibia'];
  var C = { rim: '#E3E0DA', sea: '#EEF3F2', grid: 'rgba(31,127,134,0.22)', land: '#E7E1D6',
    wish: '#E9B44C', visited: '#F26B3A', border: '#F5F4F1' };
  // Where to tap on the country page, in % of the screenshot (measured from the picture).
  var VISITED_BTN = [27, 53.9], CLOSE_BTN = [90.6, 3.3];
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  fetch('assets/world-110m.json').then(function (r) { return r.json(); }).then(function (topo) {
    var all = topojson.feature(topo, topo.objects.countries).features;
    var byName = {};
    all.forEach(function (f) { byName[f.properties.name] = f; });
    var fc = function (names) { return { type: 'FeatureCollection', features: names.map(function (n) { return byName[n]; }).filter(Boolean) }; };
    var visited = fc(VISITED), wish = fc(WISHLIST), target = byName[TARGET];
    var land = { type: 'FeatureCollection', features: all };
    var borders = topojson.mesh(topo, topo.objects.countries, function (a, b) { return a !== b; });
    var grid = d3.geoGraticule10();

    var ctx = canvas.getContext('2d');
    var projection = d3.geoOrthographic().rotate([-108, -14]).precision(0.4);
    var path = d3.geoPath(projection, ctx);
    var size = 0;

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      size = canvas.offsetWidth;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var r = size / 2;
      projection.scale(r - r * 0.03).translate([r, r]);
    }

    // fill = how far Vietnam has filled in (0..1)
    function draw(fill) {
      var r = size / 2;
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath(); ctx.arc(r, r, r - 0.5, 0, 2 * Math.PI); ctx.fillStyle = C.rim; ctx.fill();
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = C.sea; ctx.fill();
      ctx.beginPath(); path(grid); ctx.strokeStyle = C.grid; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.beginPath(); path(land); ctx.fillStyle = C.land; ctx.fill();
      ctx.beginPath(); path(wish); ctx.fillStyle = C.wish; ctx.fill();
      ctx.beginPath(); path(visited); ctx.fillStyle = C.visited; ctx.fill();
      if (fill > 0) {
        ctx.globalAlpha = fill;
        ctx.beginPath(); path(target); ctx.fillStyle = C.visited; ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath(); path(borders); ctx.strokeStyle = C.border; ctx.lineWidth = 0.5; ctx.stroke();
    }

    // Vietnam's middle, in % of the screenshot box, for the tap ring.
    function targetSpot() {
      var p = projection(d3.geoCentroid(target));
      return [(canvas.offsetLeft + p[0]) / shot.offsetWidth * 100, (canvas.offsetTop + p[1]) / shot.offsetHeight * 100];
    }
    function tapAt(spot) {
      tap.style.left = spot[0] + '%';
      tap.style.top = spot[1] + '%';
      tap.classList.remove('go'); void tap.offsetWidth; tap.classList.add('go');
    }
    function fadeIn(ms) {
      var t0 = null;
      (function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / ms);
        draw(k);
        if (k < 1 && running) requestAnimationFrame(step);
      })(performance.now());
    }

    var running = false, timers = [];
    function later(ms, fn) { timers.push(setTimeout(function () { if (running) fn(); }, ms)); }
    function play() {
      shot.classList.remove('sheet-up', 'visited');
      draw(0);
      later(900, function () { tapAt(targetSpot()); });
      later(1250, function () { shot.classList.add('sheet-up'); });
      later(2700, function () { tapAt(VISITED_BTN); });
      later(2900, function () { shot.classList.add('visited'); });
      later(4300, function () { tapAt(CLOSE_BTN); });
      later(4550, function () { shot.classList.remove('sheet-up'); });
      later(5150, function () { fadeIn(450); shot.classList.add('pulse'); tapAt(targetSpot()); });
      later(5900, function () { shot.classList.remove('pulse'); });
      later(8400, play);
    }
    function stop() { running = false; timers.forEach(clearTimeout); timers = []; }

    resize();
    shot.classList.add('live');
    if (still) { draw(1); return; }
    draw(0);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !running) { running = true; play(); }
        else if (!entries[0].isIntersecting && running) stop();
      }, { threshold: 0.4 }).observe(canvas);
    } else { running = true; play(); }
    window.addEventListener('resize', function () { resize(); draw(shot.classList.contains('visited') ? 1 : 0); });
  }).catch(function () { /* keep the screenshot */ });
})();
