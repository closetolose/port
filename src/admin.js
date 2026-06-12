import {
  bindHeroTabs,
  getHeroLayoutState,
  renderHeroSection,
  setHeroLayoutState,
} from './admin-visual-hero.js';
import { mergeHeroLayout } from './hero-layout.js';

const STORAGE_KEY = 'port-admin-password';
const DEFAULT_PASSWORD = 'port2026';
const DEV_URL = 'http://127.0.0.1:5173/admin.html';

const SECTIONS = [
  { id: 'site', title: 'Сайт', icon: '⚙' },
  { id: 'hero', title: 'Обо мне', icon: '👤' },
  { id: 'programs', title: 'Занятия', icon: '📚' },
  { id: 'benefits', title: 'Плюсы', icon: '★' },
  { id: 'dashboard', title: 'Дашборд', icon: '▣' },
  { id: 'reviews', title: 'Отзывы', icon: '💬' },
  { id: 'skills', title: 'Программа', icon: '📊' },
  { id: 'contact', title: 'Контакты', icon: '✉' },
  { id: 'tools', title: 'Ноутбук', icon: '💻' },
];

let content = null;
let formReady = false;

function getPassword() {
  return sessionStorage.getItem(STORAGE_KEY) || '';
}

function setPassword(value) {
  if (value) sessionStorage.setItem(STORAGE_KEY, value);
  else sessionStorage.removeItem(STORAGE_KEY);
}

function setMode(mode) {
  const isApp = mode === 'app';
  document.body.classList.remove('admin-page--login', 'admin-page--app');
  document.body.classList.add(isApp ? 'admin-page--app' : 'admin-page--login');
  document.getElementById('login').hidden = isApp;
  document.getElementById('app').hidden = !isApp;
}

function normalizePassword(value) {
  return String(value ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

async function isDevServerRunning() {
  try {
    const res = await fetch('/api/ping', { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

function showServerWarning(visible) {
  const el = document.getElementById('server-warning');
  if (el) el.hidden = !visible;
}

async function verifyPassword(pwd) {
  const attempt = normalizePassword(pwd);
  if (!attempt) throw new Error('Введите пароль');

  let res;
  try {
    res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: attempt }),
    });
  } catch {
    throw new Error(
      `Сервер не запущен. В терминале: npm.cmd run dev — затем откройте ${DEV_URL}`
    );
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 404) {
    throw new Error(
      `CMS-сервер недоступен (открыта не та страница). Запустите npm.cmd run dev и откройте ${DEV_URL}`
    );
  }

  if (res.ok) return attempt;

  if (res.status === 401) {
    throw new Error(
      data.error ||
        `Неверный пароль. По умолчанию: ${DEFAULT_PASSWORD} (латинские буквы, без пробелов)`
    );
  }

  throw new Error(data.error || `Ошибка сервера (${res.status})`);
}

async function loadContentData() {
  const res = await fetch('/content.json');
  if (res.ok) return res.json();
  return api('/api/content');
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': getPassword(),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.dataset.type = type;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 3200);
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  if (!el) return;
  if (msg) {
    el.textContent = msg;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

function setLoading(loading) {
  document.getElementById('loading').hidden = !loading;
  document.getElementById('admin-form').hidden = loading;
}

function renderNav() {
  const nav = document.getElementById('admin-nav');
  if (!nav) return;
  nav.innerHTML = SECTIONS.map(
    (s) =>
      `<a class="admin-nav__link" href="#section-${s.id}" data-section="${s.id}">${s.title}</a>`
  ).join('');

  const links = nav.querySelectorAll('.admin-nav__link');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle(
            'is-active',
            link.dataset.section === entry.target.dataset.section
          );
        });
      });
    },
    { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
  );

  document.querySelectorAll('.admin-section').forEach((section) => {
    observer.observe(section);
  });
}

function field(label, key, value, type = 'text', hint = '') {
  const id = `f-${key.replace(/\./g, '-')}`;
  if (type === 'textarea') {
    return `
      <label class="admin-field" for="${id}">
        <span class="admin-field__label">${label}</span>
        ${hint ? `<span class="admin-field__hint">${hint}</span>` : ''}
        <textarea class="admin-input admin-textarea" id="${id}" data-key="${key}">${escapeHtml(value ?? '')}</textarea>
      </label>`;
  }
  if (type === 'html') {
    return `
      <label class="admin-field" for="${id}">
        <span class="admin-field__label">${label}</span>
        ${hint ? `<span class="admin-field__hint">${hint}</span>` : ''}
        <textarea class="admin-input admin-textarea admin-textarea--html" id="${id}" data-key="${key}">${escapeHtml(value ?? '')}</textarea>
      </label>`;
  }
  if (type === 'image') {
    return `
      <div class="admin-field">
        <span class="admin-field__label">${label}</span>
        ${hint ? `<span class="admin-field__hint">${hint}</span>` : ''}
        <div class="admin-image-row">
          <input class="admin-input" type="text" id="${id}" data-key="${key}" value="${escapeAttr(value ?? '')}" />
          <label class="admin-btn admin-btn--ghost admin-upload">
            Загрузить
            <input type="file" accept="image/*" data-upload-for="${id}" hidden />
          </label>
        </div>
        ${value ? `<img class="admin-preview" src="${escapeAttr(value)}" alt="" />` : ''}
      </div>`;
  }
  return `
    <label class="admin-field" for="${id}">
      <span class="admin-field__label">${label}</span>
      ${hint ? `<span class="admin-field__hint">${hint}</span>` : ''}
      <input class="admin-input" type="${type}" id="${id}" data-key="${key}" value="${escapeAttr(value ?? '')}" />
    </label>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

function section(id, title, icon, body) {
  return `
    <section class="admin-section" id="section-${id}" data-section="${id}">
      <div class="admin-section__head">
        <span class="admin-section__icon" aria-hidden="true">${icon}</span>
        <h2 class="admin-section__title">${title}</h2>
      </div>
      <div class="admin-section__body">${body}</div>
    </section>`;
}

function renderForm(c) {
  const meta = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

  const programsCards = c.programs.cards
    .map(
      (card, i) => `
      <div class="admin-card-block">
        <h3 class="admin-card-block__title">Карточка ${i + 1}</h3>
        ${field('Буква в значке', `programs.cards.${i}.letter`, card.letter)}
        ${field('Заголовок', `programs.cards.${i}.title`, card.title)}
        ${field('Описание', `programs.cards.${i}.desc`, card.desc, 'textarea')}
        ${field('Индивидуально, ₽', `programs.cards.${i}.individualPrice`, card.individualPrice)}
        ${field('В группе, ₽', `programs.cards.${i}.groupPrice`, card.groupPrice)}
      </div>`
    )
    .join('');

  const benefits = c.benefits.items
    .map(
      (item, i) => `
      <div class="admin-card-block">
        <h3 class="admin-card-block__title">Плюс ${i + 1}</h3>
        ${field('Заголовок', `benefits.items.${i}.title`, item.title)}
        ${field('Текст', `benefits.items.${i}.text`, item.text, 'textarea')}
      </div>`
    )
    .join('');

  const dashboardFeatures = c.dashboard.features
    .map((text, i) => field(`Пункт ${i + 1}`, `dashboard.features.${i}`, text, 'textarea'))
    .join('');

  const reviews = c.reviews.slides
    .map(
      (slide, i) => `
      <div class="admin-card-block" data-review-index="${i}">
        <div class="admin-card-block__head">
          <h3 class="admin-card-block__title">Отзыв ${i + 1}</h3>
          <button type="button" class="admin-btn admin-btn--danger admin-remove-review" data-index="${i}">Удалить</button>
        </div>
        ${field('Картинка', `reviews.slides.${i}.src`, slide.src, 'image')}
        ${field('Подпись (alt)', `reviews.slides.${i}.alt`, slide.alt)}
      </div>`
    )
    .join('');

  const skillItems = (items, prefix) =>
    items
      .map(
        (item, i) => `
        <div class="admin-inline-row">
          ${field('Тема', `${prefix}.items.${i}.label`, item.label)}
          ${field('%', `${prefix}.items.${i}.width`, item.width, 'number')}
        </div>`
      )
      .join('');

  return `
    ${section('site', meta.site.title, meta.site.icon, `
      ${field('Title (вкладка браузера)', 'site.title', c.site.title)}
      ${field('Meta description', 'site.description', c.site.description, 'textarea')}
      ${field('Логотип в шапке', 'site.logo', c.site.logo)}
      ${field('Кнопка в шапке', 'site.ctaHeader', c.site.ctaHeader)}
    `)}

    ${section('hero', meta.hero.title, meta.hero.icon, renderHeroSection(`
      ${field('Фото', 'hero.photo', c.hero.photo, 'image', 'Путь или загрузите новый файл')}
      ${field('Alt фото', 'hero.photoAlt', c.hero.photoAlt)}
      ${field('Бейдж ЕГЭ', 'hero.badgeEge', c.hero.badgeEge)}
      ${field('Бейдж ОГЭ', 'hero.badgeOge', c.hero.badgeOge)}
      ${field('Подзаголовок', 'hero.tagline', c.hero.tagline)}
      ${field('Заголовок', 'hero.title', c.hero.title)}
      ${field('Вводная строка', 'hero.intro', c.hero.intro, 'html', 'HTML: <strong>, <em>')}
      ${field('Заголовок «Мой подход»', 'hero.approachTitle', c.hero.approachTitle)}
      ${field('Пункты подхода', 'hero.approachItems', (c.hero.approachItems || []).join('\n'), 'textarea', 'Один пункт на строку')}
      ${field('Заголовок «На занятиях»', 'hero.lessonsTitle', c.hero.lessonsTitle)}
      ${field('Пункты занятий', 'hero.lessonsItems', (c.hero.lessonsItems || []).join('\n'), 'textarea', 'Один пункт на строку')}
      ${field('Примечание', 'hero.note', c.hero.note)}
      ${field('Кнопка 1', 'hero.ctaPrimary', c.hero.ctaPrimary)}
      ${field('Кнопка 2', 'hero.ctaSecondary', c.hero.ctaSecondary)}
    `))}

    ${section('programs', meta.programs.title, meta.programs.icon, `
      ${field('Заголовок', 'programs.title', c.programs.title)}
      ${field('Вступление', 'programs.intro', c.programs.intro, 'textarea')}
      ${programsCards}
    `)}

    ${section('benefits', meta.benefits.title, meta.benefits.icon, `
      ${field('Заголовок', 'benefits.title', c.benefits.title)}
      ${field('Вступление', 'benefits.intro', c.benefits.intro, 'textarea')}
      ${benefits}
    `)}

    ${section('dashboard', meta.dashboard.title, meta.dashboard.icon, `
      ${field('Бейдж', 'dashboard.eyebrow', c.dashboard.eyebrow)}
      ${field('Заголовок', 'dashboard.title', c.dashboard.title)}
      ${field('Текст', 'dashboard.lead', c.dashboard.lead, 'html')}
      ${dashboardFeatures}
      ${field('Кнопка', 'dashboard.cta', c.dashboard.cta)}
      ${field('Подпись', 'dashboard.brand', c.dashboard.brand, 'html')}
      ${field('Скриншот', 'dashboard.screenshot', c.dashboard.screenshot, 'image')}
      ${field('Alt скриншота', 'dashboard.screenshotAlt', c.dashboard.screenshotAlt)}
    `)}

    ${section('reviews', meta.reviews.title, meta.reviews.icon, `
      ${field('Заголовок', 'reviews.title', c.reviews.title)}
      ${field('Вступление', 'reviews.intro', c.reviews.intro, 'textarea')}
      <div id="reviews-list">${reviews}</div>
      <button type="button" class="admin-btn admin-btn--ghost" id="add-review">+ Добавить отзыв</button>
    `)}

    ${section('skills', meta.skills.title, meta.skills.icon, `
      ${field('Заголовок', 'skills.title', c.skills.title)}
      ${field('Вступление', 'skills.intro', c.skills.intro, 'textarea')}
      <h3 class="admin-subtitle">ЕГЭ</h3>
      ${field('Бейдж', 'skills.ege.badge', c.skills.ege.badge)}
      ${skillItems(c.skills.ege.items, 'skills.ege')}
      <h3 class="admin-subtitle">ОГЭ</h3>
      ${field('Бейдж', 'skills.oge.badge', c.skills.oge.badge)}
      ${skillItems(c.skills.oge.items, 'skills.oge')}
    `)}

    ${section('contact', meta.contact.title, meta.contact.icon, `
      ${field('Заголовок', 'contact.title', c.contact.title)}
      ${field('Текст', 'contact.text', c.contact.text, 'textarea')}
      ${field('Placeholder имени', 'contact.formNamePlaceholder', c.contact.formNamePlaceholder)}
      ${field('Placeholder email', 'contact.formEmailPlaceholder', c.contact.formEmailPlaceholder)}
      ${field('Placeholder сообщения', 'contact.formMessagePlaceholder', c.contact.formMessagePlaceholder)}
      ${field('Кнопка формы', 'contact.formSubmit', c.contact.formSubmit)}
      ${field('Фото в карточке', 'contact.photo', c.contact.photo, 'image')}
      ${field('Имя', 'contact.name', c.contact.name)}
      ${field('Роль', 'contact.role', c.contact.role)}
      ${field('Телефон (текст)', 'contact.phone', c.contact.phone)}
      ${field('Телефон (ссылка)', 'contact.phoneHref', c.contact.phoneHref)}
      ${field('Telegram (текст)', 'contact.telegram', c.contact.telegram)}
      ${field('Telegram (ссылка)', 'contact.telegramHref', c.contact.telegramHref)}
      ${field('Email (текст)', 'contact.email', c.contact.email)}
      ${field('Email (ссылка)', 'contact.emailHref', c.contact.emailHref)}
    `)}

    ${section('tools', meta.tools.title, meta.tools.icon, `
      ${field('Заголовок', 'tools.title', c.tools.title)}
      ${field('Подзаголовок', 'tools.subtitle', c.tools.subtitle, 'textarea')}
      ${field('Кнопка', 'tools.cta', c.tools.cta)}
    `)}
  `;
}

function setDeep(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const nextNum = Number(keys[i + 1]);
    if (!cur[key]) cur[key] = Number.isInteger(nextNum) ? [] : {};
    cur = cur[key];
  }
  cur[keys[keys.length - 1]] = value;
}

function collectForm() {
  const next = structuredClone(content);
  document.querySelectorAll('[data-key]').forEach((el) => {
    let value = el.value;
    if (el.type === 'number') value = Number(value);
    if (el.dataset.key === 'hero.approachItems' || el.dataset.key === 'hero.lessonsItems') {
      value = value.split('\n').map((s) => s.trim()).filter(Boolean);
    }
    setDeep(next, el.dataset.key, value);
  });
  next.hero.layout = mergeHeroLayout(getHeroLayoutState());
  return next;
}

async function uploadFile(file, targetInputId) {
  const reader = new FileReader();
  const dataUrl = await new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const result = await api('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, data: dataUrl }),
  });
  const input = document.getElementById(targetInputId);
  if (input) input.value = result.path;
  toast('Картинка загружена');
}

function refreshForm(preserveDraft = false) {
  if (preserveDraft) content = collectForm();
  document.getElementById('admin-fields').innerHTML = renderForm(content);
  setHeroLayoutState(content.hero?.layout);
  bindHeroTabs(document.getElementById('section-hero'), () => content.hero?.layout);
  renderNav();
}

async function saveContent() {
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  try {
    const next = collectForm();
    await api('/api/content', {
      method: 'POST',
      body: JSON.stringify(next),
    });
    content = next;
    toast('Сохранено! Обновите главную страницу.');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

function bindGlobalEvents() {
  if (formReady) return;
  formReady = true;

  document.getElementById('admin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveContent();
  });

  document.getElementById('admin-fields')?.addEventListener('click', (e) => {
    if (e.target.id === 'add-review') {
      content = collectForm();
      content.reviews.slides.push({ src: '/uploads/new-review.png', alt: 'Новый отзыв' });
      refreshForm();
      return;
    }
    if (e.target.classList.contains('admin-remove-review')) {
      content = collectForm();
      content.reviews.slides.splice(Number(e.target.dataset.index), 1);
      refreshForm();
    }
  });

  document.getElementById('admin-fields')?.addEventListener('change', async (e) => {
    const input = e.target;
    if (!input.matches('[data-upload-for]')) return;
    const file = input.files?.[0];
    if (!file) return;
    try {
      content = collectForm();
      await uploadFile(file, input.dataset.uploadFor);
      refreshForm(true);
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    setPassword('');
    setMode('login');
    showLoginError('');
    document.getElementById('login-password').value = '';
  });

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('login-password');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const pwd = input.value;
    showLoginError('');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Проверяем…';
    try {
      const verified = await verifyPassword(pwd);
      setPassword(verified);
      try {
        await enterApp();
      } catch (err) {
        setPassword('');
        setMode('login');
        showLoginError(`Пароль верный, но редактор не загрузился: ${err.message}`);
      }
    } catch (err) {
      setPassword('');
      showLoginError(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Войти';
    }
  });
}

async function enterApp() {
  setLoading(true);
  setMode('app');
  try {
    content = await loadContentData();
    document.getElementById('admin-fields').innerHTML = renderForm(content);
    setHeroLayoutState(content.hero?.layout);
    bindHeroTabs(document.getElementById('section-hero'), () => content.hero?.layout);
    renderNav();
  } catch (err) {
    setMode('login');
    throw err;
  } finally {
    setLoading(false);
  }
}

async function init() {
  if (location.protocol === 'file:') {
    document.body.innerHTML =
      '<div style="max-width:480px;margin:48px auto;padding:24px;font-family:sans-serif;line-height:1.5">' +
      '<h1 style="color:#58cc02">Админка</h1>' +
      '<p>Откройте через dev-сервер, а не файл напрямую:</p>' +
      '<ol><li><code>npm.cmd run dev</code> (если PowerShell блокирует npm)</li>' +
      '<li><a href="http://127.0.0.1:5173/admin.html">http://127.0.0.1:5173/admin.html</a></li></ol></div>';
    return;
  }

  bindGlobalEvents();
  setMode('login');

  const serverOk = await isDevServerRunning();
  showServerWarning(!serverOk);

  const saved = getPassword();
  if (saved && serverOk) {
    try {
      const verified = await verifyPassword(saved);
      setPassword(verified);
      await enterApp();
    } catch {
      setPassword('');
      setMode('login');
    }
  }
}

init();
