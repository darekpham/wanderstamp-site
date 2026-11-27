// The stamp collection phone: the first row stays in colour; while the panel is on screen, the
// greyed-out stamps from the second row on turn back to
// colour one by one, in reading order, as if each trip had just been stamped; then it holds, greys
// them all out again and starts over. With reduced motion every stamp simply stays in colour.
(function () {
  var layer = document.querySelector('.gs-layer');
  if (!layer) return;
  var slots = [].slice.call(layer.querySelectorAll('.gs'));
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) { slots.forEach(function (s) { s.classList.add('on'); }); return; }
  var STEP = 420, HOLD = 2600, PAUSE = 700;
  var timers = [], on = false;

  function clear() { timers.forEach(clearTimeout); timers = []; }
  function greyAll() { slots.forEach(function (s) { s.classList.remove('on'); }); }
  function play() {
    clear();
    greyAll();
    slots.forEach(function (s, i) {
      timers.push(setTimeout(function () { s.classList.add('on'); }, PAUSE + i * STEP));
    });
    timers.push(setTimeout(function () { if (on) play(); }, PAUSE + slots.length * STEP + HOLD));
  }

  new IntersectionObserver(function (entries) {
    on = entries[0].isIntersecting;
    if (on) play(); else { clear(); greyAll(); }
  }, { threshold: 0.35 }).observe(layer.closest('.feat') || layer);
})();
