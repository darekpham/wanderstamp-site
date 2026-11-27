// The hero globe: the app's map drawn on a canvas with d3-geo, spinning slowly.
// Colours follow the app's Sunset map theme (src/mapThemes.ts). The countries and cities are a
// demo passport like the one in the screenshots. If anything fails, the globe picture under the
// canvas stays visible.
(function () {
  var wrap = document.querySelector('.globe-wrap');
  var canvas = wrap && wrap.querySelector('canvas');
  if (!canvas || !window.d3 || !window.topojson || !canvas.getContext) return;

  var VISITED = ['Chile', 'Algeria', 'China', 'Morocco', 'Netherlands', 'Italy', 'Spain', 'Mexico',
    'Iceland', 'Portugal', 'Brazil', 'Sweden', 'United Kingdom', 'Cambodia', 'Peru', 'Thailand',
    'Egypt', 'Indonesia', 'South Africa', 'Kenya', 'United States of America', 'Canada',
    'Australia', 'New Zealand', 'Ireland', 'India', 'Japan', 'Nepal', 'France', 'Greece', 'Jordan',
    'Norway', 'Vietnam', 'South Korea', 'Turkey', 'Israel', 'Malaysia', 'Laos', 'Germany',
    'Switzerland', 'Austria', 'Tanzania', 'Mongolia'];
  var WISHLIST = ['Russia', 'Philippines', 'Namibia', 'Argentina'];
  var CITIES = [[105.85, 21.03], [106.7, 10.78], [139.69, 35.69], [135.77, 35.01], [126.98, 37.57],
    [77.21, 28.61], [85.32, 27.72], [100.5, 13.75], [104.92, 11.56], [103.86, 13.36],
    [115.22, -8.65], [151.21, -33.87], [36.82, -1.29], [18.42, -33.92], [31.24, 30.04],
    [28.98, 41.01], [2.35, 48.86], [12.5, 41.9], [2.17, 41.39], [-9.14, 38.72], [-0.13, 51.51],
    [-21.9, 64.15], [10.75, 59.91], [18.07, 59.33], [-74.0, 40.71], [-99.13, 19.43],
    [-77.04, -12.05], [-71.97, -13.53], [-43.2, -22.9], [-70.67, -33.45], [-7.99, 31.63],
    [35.93, 31.95], [-123.12, 49.28], [174.76, -36.85]];
  var C = { rim: '#E3E0DA', sea: '#EEF3F2', grid: 'rgba(31,127,134,0.22)', land: '#E7E1D6',
    wish: '#E9B44C', visited: '#F26B3A', border: '#F5F4F1', city: '#1F7F86' };

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  fetch('assets/world-110m.json').then(function (r) { return r.json(); }).then(function (topo) {
    var all = topojson.feature(topo, topo.objects.countries).features;
    var group = function (test) { return { type: 'FeatureCollection', features: all.filter(test) }; };
    var visited = group(function (f) { return VISITED.indexOf(f.properties.name) >= 0; });
    var wish = group(function (f) { return WISHLIST.indexOf(f.properties.name) >= 0; });
    var land = group(function (f) { return VISITED.indexOf(f.properties.name) < 0 && WISHLIST.indexOf(f.properties.name) < 0; });
    var borders = topojson.mesh(topo, topo.objects.countries, function (a, b) { return a !== b; });
    var grid = d3.geoGraticule10();
    var sphere = { type: 'Sphere' };

    var ctx = canvas.getContext('2d');
    var projection = d3.geoOrthographic().precision(0.4);
    var path = d3.geoPath(projection, ctx);
    var lambda = -95, phi = -16, size = 0;

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      size = canvas.getBoundingClientRect().width;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function fill(geo, colour) { ctx.beginPath(); path(geo); ctx.fillStyle = colour; ctx.fill(); }

    function draw() {
      var r = size / 2;
      projection.scale(r - 7).translate([r, r]).rotate([lambda, phi]);
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath(); ctx.arc(r, r, r - 1, 0, 2 * Math.PI); ctx.fillStyle = C.rim; ctx.fill();
      fill(sphere, C.sea);
      ctx.beginPath(); path(grid); ctx.strokeStyle = C.grid; ctx.lineWidth = 0.8; ctx.stroke();
      fill(land, C.land);
      fill(wish, C.wish);
      fill(visited, C.visited);
      ctx.beginPath(); path(borders); ctx.strokeStyle = C.border; ctx.lineWidth = 0.7; ctx.stroke();
      var centre = [-lambda, -phi];
      CITIES.forEach(function (c) {
        if (d3.geoDistance(c, centre) > 1.45) return;
        var p = projection(c);
        ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(2.6, size / 130), 0, 2 * Math.PI);
        ctx.fillStyle = C.city; ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = '#fff'; ctx.stroke();
      });
    }

    // Spin while on screen.
    var visible = true, last = 0;
    function frame(t) {
      if (visible) lambda += Math.min(64, t - (last || t)) * 0.006;
      last = t;
      draw();
      requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(canvas);
    }
    window.addEventListener('resize', function () { resize(); draw(); });

    resize();
    draw();
    wrap.classList.add('live');
    if (!still) requestAnimationFrame(frame);
  }).catch(function () { /* keep the picture */ });
})();
