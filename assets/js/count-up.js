// The passport phone: while the panel is on screen, the numbers count up from zero and the progress
// bar grows, as if the passport were filling in, then hold for a moment and start again. It watches
// the whole panel, because the panel crops the phone and most of the screenshot is never on screen.
// With reduced motion the final numbers simply stay.
(function () {
  var shot = document.querySelector('.pass-shot');
  if (!shot || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var nums = [].slice.call(shot.querySelectorAll('.pnum'));
  var bar = shot.querySelector('.pbar i');
  var full = bar.parentElement.dataset.fill || '54.5%'; // countries / total, like the app's bar
  var DURATION = 1800, HOLD = 2600, PAUSE = 500;
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var raf = 0, timer = 0, on = false;

  function show(k) {
    nums.forEach(function (n) { n.textContent = String(Math.round(k * Number(n.dataset.to))); });
  }
  function reset() {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    show(0);
    bar.style.transition = 'none';
    bar.style.width = '0%';
  }
  function play() {
    reset();
    void bar.offsetWidth;
    bar.style.transition = 'width ' + DURATION + 'ms cubic-bezier(.2,.8,.2,1)';
    bar.style.width = full;
    var t0 = null;
    (function step(t) {
      if (t0 === null) t0 = t;
      var k = ease(Math.min(1, (t - t0) / DURATION));
      show(k);
      if (k < 1) { raf = requestAnimationFrame(step); return; }
      // Hold the full numbers, drop back to zero, then count up again.
      timer = setTimeout(function () {
        if (!on) return;
        reset();
        timer = setTimeout(function () { if (on) play(); }, PAUSE);
      }, HOLD);
    })(performance.now());
  }

  reset();
  new IntersectionObserver(function (entries) {
    on = entries[0].isIntersecting;
    if (on) play(); else reset();
  }, { threshold: 0.35 }).observe(shot.closest('.feat') || shot);
})();
