import './styles/main.css';
import { logoMark } from './illustrations.js';
import { loadContent } from './content.js';
import {
  initScrollReveals,
  initHeroEntrance,
  initSkillBars,
} from './animations.js';
import { initReviewsCarousel } from './reviews-carousel.js';
import { initMobileNav } from './nav.js';
import { initContactForm } from './contact-form.js';
import { initMobileLayout } from './mobile-layout.js';
import { initHeroVisualBridge } from './hero-visual-bridge.js';

function mountIllustrations() {
  document.querySelectorAll('[data-logo]').forEach((el) => {
    el.insertAdjacentHTML('afterbegin', logoMark());
  });
}

async function bootstrap() {
  mountIllustrations();
  await loadContent();
  initHeroVisualBridge();
  initSkillBars();
  initHeroEntrance();
  initScrollReveals();
  initReviewsCarousel();
  initMobileNav();
  initContactForm();
  initMobileLayout();
}

bootstrap();
