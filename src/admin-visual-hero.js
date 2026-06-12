import {
  BLOCK_LABELS,
  DEFAULT_HERO_LAYOUT,
  HERO_BLOCK_IDS,
  getBlockLabel,
  mergeHeroLayout,
} from './hero-layout.js';

const TARGET_LABELS = { ...BLOCK_LABELS, badges: 'Бейджи' };

const CONTROLS = {
  photo: [
    { key: 'photoPosition', label: 'Позиция фото', type: 'select', options: [['left', 'Слева'], ['right', 'Справа'], ['top', 'Сверху']] },
    { key: 'photoSize', label: 'Размер (десктоп), px', type: 'range', min: 140, max: 360, step: 4, desktop: true },
    { key: 'mobilePhotoSize', label: 'Размер (телефон), px', type: 'range', min: 56, max: 160, step: 4, mobile: true },
    { key: 'photoShape', label: 'Форма', type: 'select', options: [['rounded', 'Скруглённая'], ['circle', 'Круг']] },
    { key: 'photoBorder', label: 'Толщина рамки', type: 'range', min: 0, max: 8, step: 1 },
    { key: 'photoBorderColor', label: 'Цвет рамки', type: 'color' },
    { key: 'photoRingColor', label: 'Цвет кольца', type: 'color' },
    { key: 'photoOffsetX', label: 'Сдвиг по X', type: 'range', min: -80, max: 80, step: 1 },
    { key: 'photoOffsetY', label: 'Сдвиг по Y', type: 'range', min: -80, max: 80, step: 1 },
  ],
  title: [
    { key: 'titleSize', label: 'Размер, px', type: 'range', min: 28, max: 64, step: 1 },
    { key: 'titleColor', label: 'Цвет', type: 'color' },
  ],
  tagline: [
    { key: 'taglineSize', label: 'Размер, px', type: 'range', min: 12, max: 24, step: 1 },
    { key: 'textColor', label: 'Цвет', type: 'color' },
  ],
  intro: [
    { key: 'introSize', label: 'Размер, px', type: 'range', min: 13, max: 22, step: 1 },
    { key: 'textColor', label: 'Цвет', type: 'color' },
  ],
  approach: [
    { key: 'blockGap', label: 'Отступ между блоками', type: 'range', min: 4, max: 32, step: 2 },
    { key: 'listGap', label: 'Отступ в списке', type: 'range', min: 2, max: 20, step: 1 },
    { key: 'accentColor', label: 'Цвет галочек', type: 'color' },
    { key: 'textColor', label: 'Цвет текста', type: 'color' },
  ],
  lessons: [
    { key: 'blockGap', label: 'Отступ между блоками', type: 'range', min: 4, max: 32, step: 2 },
    { key: 'listGap', label: 'Отступ в списке', type: 'range', min: 2, max: 20, step: 1 },
    { key: 'accentColor', label: 'Цвет галочек', type: 'color' },
    { key: 'textColor', label: 'Цвет текста', type: 'color' },
  ],
  note: [{ key: 'textColor', label: 'Цвет', type: 'color' }],
  cta: [
    { key: 'primaryBtnBg', label: 'Кнопка «Записаться»', type: 'color' },
    { key: 'secondaryBtnColor', label: 'Кнопка «Форматы»', type: 'color' },
    { key: 'ctaGap', label: 'Расстояние между кнопками', type: 'range', min: 4, max: 24, step: 2 },
  ],
  badges: [{ key: 'badgeSize', label: 'Размер шрифта', type: 'range', min: 10, max: 20, step: 1 }],
};

let layoutState = mergeHeroLayout();
let activeTarget = 'photo';
let viewport = 'desktop';
let iframe = null;
let panelEl = null;
let blockListEl = null;
let previewWrap = null;
let previewScaler = null;
let previewSizer = null;
let previewHeight = 0;
let onChange = null;
let dragBlockId = null;
let resizeObserver = null;

const PREVIEW_VIEWPORTS = {
  desktop: { width: 1024, fallbackHeight: 480 },
  mobile: { width: 390, fallbackHeight: 620 },
};

function post(type, payload = {}) {
  iframe?.contentWindow?.postMessage({ source: 'hero-admin', type, ...payload }, '*');
}

function getOrderedBlockIds() {
  const order = [...layoutState.blockOrder];
  layoutState.extraBlocks.forEach((extra) => {
    const key = `extra-${extra.id}`;
    if (!order.includes(key)) order.push(key);
  });
  return order.filter((id) => {
    if (id.startsWith('extra-')) {
      return layoutState.extraBlocks.some((b) => `extra-${b.id}` === id);
    }
    return HERO_BLOCK_IDS.includes(id);
  });
}

function getExtraBlock(targetId) {
  if (!targetId?.startsWith('extra-')) return null;
  const id = targetId.slice(6);
  return layoutState.extraBlocks.find((b) => b.id === id) || null;
}

function renderControl(control, value) {
  const id = `hv-${control.key}`;
  if (control.type === 'range') {
    return `
      <label class="admin-visual__control" for="${id}">
        <span class="admin-visual__control-label">${control.label}</span>
        <div class="admin-visual__range-row">
          <input type="range" id="${id}" data-key="${control.key}" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" />
          <output for="${id}">${value}</output>
        </div>
      </label>`;
  }
  if (control.type === 'color') {
    return `
      <label class="admin-visual__control" for="${id}">
        <span class="admin-visual__control-label">${control.label}</span>
        <input type="color" id="${id}" data-key="${control.key}" value="${value}" />
      </label>`;
  }
  if (control.type === 'select') {
    const opts = control.options
      .map(([v, label]) => `<option value="${v}"${v === value ? ' selected' : ''}>${label}</option>`)
      .join('');
    return `
      <label class="admin-visual__control" for="${id}">
        <span class="admin-visual__control-label">${control.label}</span>
        <select class="admin-input" id="${id}" data-key="${control.key}">${opts}</select>
      </label>`;
  }
  return '';
}

function renderExtraControls(extra) {
  const base = `
    <label class="admin-visual__control">
      <span class="admin-visual__control-label">Заголовок блока</span>
      <input class="admin-input" type="text" data-extra-field="title" value="${escapeAttr(extra.title || '')}" />
    </label>`;

  if (extra.type === 'list') {
    return `${base}
      <label class="admin-visual__control">
        <span class="admin-visual__control-label">Пункты списка</span>
        <textarea class="admin-input admin-textarea" data-extra-field="items" rows="4">${escapeHtml((extra.items || []).join('\n'))}</textarea>
      </label>`;
  }

  return `${base}
    <label class="admin-visual__control">
      <span class="admin-visual__control-label">Текст</span>
      <textarea class="admin-input admin-textarea" data-extra-field="content" rows="4">${escapeHtml(extra.content || '')}</textarea>
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

function renderBlockList() {
  if (!blockListEl) return;

  blockListEl.innerHTML = `
    <div class="admin-visual__blocks-head">
      <h3 class="admin-visual__blocks-title">Блоки на странице</h3>
      <div class="admin-visual__blocks-add">
        <button type="button" class="admin-btn admin-btn--ghost admin-btn--sm" data-add-block="text">+ Текст</button>
        <button type="button" class="admin-btn admin-btn--ghost admin-btn--sm" data-add-block="list">+ Список</button>
      </div>
    </div>
    <ul class="admin-block-list" id="hero-block-sortable">
      ${getOrderedBlockIds()
        .map((id) => {
          const hidden = layoutState.hiddenBlocks.includes(id);
          const isExtra = id.startsWith('extra-');
          return `
            <li
              class="admin-block-item${hidden ? ' is-hidden' : ''}${activeTarget === id ? ' is-selected' : ''}"
              draggable="true"
              data-block-id="${id}"
            >
              <span class="admin-block-item__handle" aria-hidden="true">⠿</span>
              <button type="button" class="admin-block-item__label" data-select-block="${id}">
                ${getBlockLabel(id, layoutState)}
              </button>
              <button type="button" class="admin-block-item__toggle" data-toggle-block="${id}" title="${hidden ? 'Показать' : 'Скрыть'}">
                ${hidden ? '◌' : '●'}
              </button>
              ${isExtra ? `<button type="button" class="admin-block-item__remove" data-remove-block="${id}" title="Удалить">×</button>` : ''}
            </li>`;
        })
        .join('')}
    </ul>
    <p class="admin-visual__hint admin-visual__hint--sm">Перетащите ⠿ чтобы изменить порядок. В превью — клик или перетаскивание фото, уголок — размер.</p>
  `;
}

function renderPanel() {
  if (!panelEl) return;

  const extra = getExtraBlock(activeTarget);
  let controlsHtml = '';

  if (extra) {
    controlsHtml = renderExtraControls(extra);
  } else {
    const controls = (CONTROLS[activeTarget] || []).filter((c) => {
      if (c.desktop && viewport !== 'desktop') return false;
      if (c.mobile && viewport !== 'mobile') return false;
      return true;
    });
    controlsHtml = controls.map((c) => renderControl(c, layoutState[c.key])).join('');
  }

  const label = extra
    ? getBlockLabel(activeTarget, layoutState)
    : TARGET_LABELS[activeTarget] || activeTarget;

  panelEl.innerHTML = `
    <p class="admin-visual__selection">Выбрано: <strong>${label}</strong></p>
    <div class="admin-visual__controls">${controlsHtml}</div>
  `;

  renderBlockList();
}

function pushLayout() {
  post('layout', { layout: layoutState, target: activeTarget });
  onChange?.(layoutState);
}

function fitPreview() {
  if (!previewWrap || !previewScaler || !iframe) return;

  const spec = PREVIEW_VIEWPORTS[viewport] || PREVIEW_VIEWPORTS.desktop;
  const vw = spec.width;
  const vh = previewHeight || spec.fallbackHeight;
  const pad = 20;
  const topInset = 32;
  const scaleLabel = previewWrap.querySelector('.admin-visual__scale-label');
  const labelH = scaleLabel ? scaleLabel.offsetHeight + 10 : 0;
  const availW = Math.max(200, previewWrap.clientWidth - pad);
  const availH = Math.max(280, previewWrap.clientHeight - pad - labelH - topInset);
  const scale = Math.min(availW / vw, availH / vh, 1) * 0.98;

  iframe.style.width = `${vw}px`;
  iframe.style.height = `${vh}px`;
  previewScaler.style.width = `${vw}px`;
  previewScaler.style.height = `${vh}px`;
  previewScaler.style.transform = `scale(${scale})`;

  if (previewSizer) {
    previewSizer.style.paddingTop = `${topInset}px`;
    previewSizer.style.height = `${Math.ceil(vh * scale + topInset)}px`;
  }

  if (scaleLabel) {
    scaleLabel.textContent =
      scale < 0.999 ? `Масштаб ${Math.round(scale * 100)}% — весь блок влезает в окно` : 'Масштаб 100%';
  }
}

function setViewport(next) {
  viewport = next;
  previewHeight = 0;
  document.querySelectorAll('[data-hero-viewport]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.heroViewport === next);
  });
  post('viewport', { viewport: next });
  renderPanel();
  requestAnimationFrame(() => fitPreview());
}

function addBlock(type) {
  const id = `b${Date.now().toString(36)}`;
  const block =
    type === 'list'
      ? { id, type: 'list', title: 'Новый список', items: ['Пункт 1', 'Пункт 2'] }
      : { id, type: 'text', title: 'Новый текст', content: 'Добавьте описание…' };

  layoutState = {
    ...layoutState,
    extraBlocks: [...layoutState.extraBlocks, block],
    blockOrder: [...layoutState.blockOrder, `extra-${id}`],
  };
  activeTarget = `extra-${id}`;
  pushLayout();
  renderPanel();
}

function removeBlock(blockId) {
  const id = blockId.slice(6);
  layoutState = {
    ...layoutState,
    extraBlocks: layoutState.extraBlocks.filter((b) => b.id !== id),
    blockOrder: layoutState.blockOrder.filter((b) => b !== blockId),
    hiddenBlocks: layoutState.hiddenBlocks.filter((b) => b !== blockId),
  };
  if (activeTarget === blockId) activeTarget = 'photo';
  pushLayout();
  renderPanel();
}

function toggleBlockVisibility(blockId) {
  const hidden = new Set(layoutState.hiddenBlocks);
  if (hidden.has(blockId)) hidden.delete(blockId);
  else hidden.add(blockId);
  layoutState = { ...layoutState, hiddenBlocks: [...hidden] };
  pushLayout();
  renderPanel();
}

function reorderBlocks(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const order = getOrderedBlockIds();
  const fromIndex = order.indexOf(fromId);
  const toIndex = order.indexOf(toId);
  if (fromIndex < 0 || toIndex < 0) return;
  order.splice(fromIndex, 1);
  order.splice(toIndex, 0, fromId);
  layoutState = { ...layoutState, blockOrder: order };
  pushLayout();
  renderPanel();
}

function bindBlockListEvents(root) {
  root.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add-block]');
    if (addBtn) {
      addBlock(addBtn.dataset.addBlock);
      return;
    }

    const selectBtn = e.target.closest('[data-select-block]');
    if (selectBtn) {
      activeTarget = selectBtn.dataset.selectBlock;
      pushLayout();
      renderPanel();
      return;
    }

    const toggleBtn = e.target.closest('[data-toggle-block]');
    if (toggleBtn) {
      toggleBlockVisibility(toggleBtn.dataset.toggleBlock);
      return;
    }

    const removeBtn = e.target.closest('[data-remove-block]');
    if (removeBtn) {
      removeBlock(removeBtn.dataset.removeBlock);
    }
  });

  root.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.admin-block-item');
    if (!item) return;
    dragBlockId = item.dataset.blockId;
    item.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  root.addEventListener('dragend', (e) => {
    e.target.closest('.admin-block-item')?.classList.remove('is-dragging');
    dragBlockId = null;
  });

  root.addEventListener('dragover', (e) => {
    const item = e.target.closest('.admin-block-item');
    if (!item || !dragBlockId) return;
    e.preventDefault();
    item.classList.add('is-drop-target');
  });

  root.addEventListener('dragleave', (e) => {
    e.target.closest('.admin-block-item')?.classList.remove('is-drop-target');
  });

  root.addEventListener('drop', (e) => {
    const item = e.target.closest('.admin-block-item');
    if (!item || !dragBlockId) return;
    e.preventDefault();
    item.classList.remove('is-drop-target');
    reorderBlocks(dragBlockId, item.dataset.blockId);
  });
}

export function getHeroLayoutState() {
  return mergeHeroLayout(layoutState);
}

export function setHeroLayoutState(layout) {
  layoutState = mergeHeroLayout(layout);
  pushLayout();
  renderPanel();
}

export function initHeroVisualEditor(root, initialLayout, changeCallback) {
  onChange = changeCallback;
  layoutState = mergeHeroLayout(initialLayout);

  root.innerHTML = `
    <div class="admin-visual">
      <div class="admin-visual__toolbar">
        <div class="admin-visual__viewports">
          <button type="button" class="admin-btn admin-btn--ghost is-active" data-hero-viewport="desktop">Десктоп</button>
          <button type="button" class="admin-btn admin-btn--ghost" data-hero-viewport="mobile">Телефон</button>
        </div>
        <button type="button" class="admin-btn admin-btn--ghost" id="hero-visual-reset">Сбросить</button>
      </div>
      <div class="admin-visual__body">
        <div class="admin-visual__preview-wrap" id="hero-preview-wrap">
          <p class="admin-visual__scale-label" aria-live="polite">Загрузка превью…</p>
          <div class="admin-visual__preview-sizer" id="hero-preview-sizer">
            <div class="admin-visual__preview-scaler" id="hero-preview-scaler">
              <iframe class="admin-visual__iframe" id="hero-visual-iframe" title="Превью «Обо мне»" src="/?hero-edit=1#about"></iframe>
            </div>
          </div>
        </div>
        <aside class="admin-visual__sidebar">
          <div class="admin-visual__blocks" id="hero-block-list"></div>
          <div class="admin-visual__panel" id="hero-visual-panel"></div>
        </aside>
      </div>
    </div>
  `;

  iframe = root.querySelector('#hero-visual-iframe');
  panelEl = root.querySelector('#hero-visual-panel');
  blockListEl = root.querySelector('#hero-block-list');
  previewWrap = root.querySelector('#hero-preview-wrap');
  previewScaler = root.querySelector('#hero-preview-scaler');
  previewSizer = root.querySelector('#hero-preview-sizer');

  bindBlockListEvents(root);

  resizeObserver = new ResizeObserver(() => fitPreview());
  if (previewWrap) resizeObserver.observe(previewWrap);

  root.querySelector('#hero-visual-reset')?.addEventListener('click', () => {
    layoutState = mergeHeroLayout(DEFAULT_HERO_LAYOUT);
    activeTarget = 'photo';
    pushLayout();
    renderPanel();
  });

  root.querySelectorAll('[data-hero-viewport]').forEach((btn) => {
    btn.addEventListener('click', () => setViewport(btn.dataset.heroViewport));
  });

  panelEl.addEventListener('input', (e) => {
    const extraField = e.target.closest('[data-extra-field]');
    if (extraField) {
      const extra = getExtraBlock(activeTarget);
      if (!extra) return;
      const field = extraField.dataset.extraField;
      const value =
        field === 'items'
          ? extraField.value.split('\n').map((s) => s.trim()).filter(Boolean)
          : extraField.value;
      layoutState = {
        ...layoutState,
        extraBlocks: layoutState.extraBlocks.map((b) =>
          b.id === extra.id ? { ...b, [field]: value } : b
        ),
      };
      pushLayout();
      onChange?.(layoutState);
      return;
    }

    const input = e.target.closest('[data-key]');
    if (!input) return;
    let value = input.value;
    if (input.type === 'range') {
      value = Number(value);
      const out = input.parentElement?.querySelector('output');
      if (out) out.textContent = value;
    }
    layoutState = { ...layoutState, [input.dataset.key]: value };
    pushLayout();
    onChange?.(layoutState);
  });

  panelEl.addEventListener('change', (e) => {
    const input = e.target.closest('[data-key]');
    if (!input || input.type === 'range') return;
    layoutState = { ...layoutState, [input.dataset.key]: input.value };
    pushLayout();
    onChange?.(layoutState);
  });

  iframe?.addEventListener('load', () => {
    pushLayout();
    setViewport(viewport);
    fitPreview();
  });

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.source !== 'hero-preview') return;

    if (data.type === 'ready') {
      pushLayout();
      setViewport(viewport);
      fitPreview();
      return;
    }

    if (data.type === 'measure' && data.height) {
      previewHeight = data.height;
      fitPreview();
      return;
    }

    if (data.type === 'select' && data.target) {
      activeTarget = data.target;
      renderPanel();
    }

    if (data.type === 'layout' && data.layout) {
      layoutState = mergeHeroLayout(data.layout);
      onChange?.(layoutState);
      renderPanel();
    }
  });

  renderPanel();
}

export function renderHeroSection(textFieldsHtml) {
  return `
    <div class="admin-hero-tabs">
      <button type="button" class="admin-hero-tabs__btn is-active" data-hero-tab="text">Тексты</button>
      <button type="button" class="admin-hero-tabs__btn" data-hero-tab="visual">Визуально</button>
    </div>
    <div class="admin-hero-panel" data-hero-panel="text">${textFieldsHtml}</div>
    <div class="admin-hero-panel" data-hero-panel="visual" hidden>
      <div id="hero-visual-root"></div>
    </div>
  `;
}

export function bindHeroTabs(section, getInitialLayout) {
  if (!section) return;

  const textPanel = section.querySelector('[data-hero-panel="text"]');
  const visualPanel = section.querySelector('[data-hero-panel="visual"]');
  let visualReady = false;

  section.querySelectorAll('[data-hero-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.heroTab;
      section.querySelectorAll('[data-hero-tab]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
      });
      textPanel.hidden = tab !== 'text';
      visualPanel.hidden = tab !== 'visual';

      if (tab === 'visual' && !visualReady) {
        visualReady = true;
        const root = section.querySelector('#hero-visual-root');
        if (root) {
          const initial = mergeHeroLayout(getInitialLayout?.());
          layoutState = initial;
          initHeroVisualEditor(root, initial, (layout) => {
            layoutState = layout;
          });
        }
      }
    });
  });
}
