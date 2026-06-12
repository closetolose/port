export function initReviewsCarousel() {
  const root = document.querySelector('[data-reviews-carousel]');
  if (!root) return;

  const track = root.querySelector('.reviews-carousel__track');
  const slides = [...root.querySelectorAll('.review-slide')];
  const prevBtn = root.querySelector('.reviews-carousel__arrow--prev');
  const nextBtn = root.querySelector('.reviews-carousel__arrow--next');
  const dotsWrap = root.querySelector('.reviews-carousel__dots');

  if (!track || slides.length === 0) return;

  let index = 0;
  let touchStartX = 0;

  const dots = slides.map((_, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'reviews-carousel__dot';
    btn.setAttribute('aria-label', `Отзыв ${i + 1}`);
    btn.addEventListener('click', () => goTo(i));
    dotsWrap?.appendChild(btn);
    return btn;
  });

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
    prevBtn?.toggleAttribute('disabled', slides.length <= 1);
    nextBtn?.toggleAttribute('disabled', slides.length <= 1);
  }

  function goTo(i) {
    index = ((i % slides.length) + slides.length) % slides.length;
    update();
  }

  prevBtn?.addEventListener('click', () => goTo(index - 1));
  nextBtn?.addEventListener('click', () => goTo(index + 1));

  root.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );

  root.addEventListener(
    'touchend',
    (e) => {
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) < 40) return;
      goTo(diff < 0 ? index + 1 : index - 1);
    },
    { passive: true }
  );

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(index - 1);
    if (e.key === 'ArrowRight') goTo(index + 1);
  });

  update();
}
