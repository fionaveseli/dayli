(function () {
  let body = document.body;
  let reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Waitlist form: message only for now (connected in task 39).
  let form = document.getElementById('signup');
  let msg = document.getElementById('signup-msg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let input = document.getElementById('email');
    msg.textContent =
      input.checkValidity() && input.value
        ? 'Thank you! Sign-ups are coming soon. Check back shortly.'
        : 'Please enter a valid email address.';
  });

  if (reduce || !('IntersectionObserver' in window)) return;
  body.classList.add('anim');

  const io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.remove('pre');
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  [].slice.call(document.querySelectorAll('[data-reveal]')).forEach(function (el) {
    if (el.getBoundingClientRect().top > window.innerHeight * 0.9) {
      el.classList.add('pre');
      io.observe(el);
    } else {
      requestAnimationFrame(function () {
        el.classList.add('in');
      });
    }
  });

  let prog = document.getElementById('prog');
  let onScroll = function () {
    let max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    prog.style.transform = 'scaleX(' + Math.min(1, window.scrollY / max) + ')';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
