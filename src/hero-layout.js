/** Настройки раскладки блока «Обо мне» — content.json → hero.layout */

export const HERO_BLOCK_IDS = [
  'tagline',
  'title',
  'intro',
  'photo',
  'approach',
  'lessons',
  'note',
  'cta',
];

export const BLOCK_LABELS = {
  tagline: 'Подзаголовок',
  title: 'Заголовок',
  intro: 'Вводная',
  photo: 'Фото',
  approach: 'Мой подход',
  lessons: 'На занятиях',
  note: 'Примечание',
  cta: 'Кнопки',
  badges: 'Бейджи',
};

export const DEFAULT_HERO_LAYOUT = {
  photoSize: 280,
  mobilePhotoSize: 88,
  photoShape: 'rounded',
  photoPosition: 'left',
  photoBorder: 4,
  photoBorderColor: '#d7ffb8',
  photoRingColor: '#58cc02',
  photoOffsetX: 0,
  photoOffsetY: 0,
  titleSize: 42,
  titleColor: '#58cc02',
  taglineSize: 18,
  introSize: 16,
  textColor: '#3c3c3c',
  accentColor: '#58cc02',
  blockGap: 16,
  listGap: 8,
  sectionPaddingTop: 64,
  sectionPaddingBottom: 40,
  primaryBtnBg: '#58a700',
  secondaryBtnColor: '#1cb0f6',
  ctaGap: 12,
  badgeSize: 15,
  blockOrder: [...HERO_BLOCK_IDS],
  extraBlocks: [],
  hiddenBlocks: [],
};

export function mergeHeroLayout(layout) {
  const src = layout || {};
  return {
    ...DEFAULT_HERO_LAYOUT,
    ...src,
    blockOrder: src.blockOrder?.length ? [...src.blockOrder] : [...HERO_BLOCK_IDS],
    extraBlocks: (src.extraBlocks || []).map((b) => ({
      ...b,
      items: b.items ? [...b.items] : undefined,
    })),
    hiddenBlocks: src.hiddenBlocks ? [...src.hiddenBlocks] : [],
  };
}

export function getBlockLabel(id, layout) {
  if (id.startsWith('extra-')) {
    const extraId = id.slice(6);
    const block = layout.extraBlocks?.find((b) => b.id === extraId);
    return block?.title || 'Новый блок';
  }
  return BLOCK_LABELS[id] || id;
}

export function createExtraBlockElement(extra) {
  const wrap = document.createElement('div');
  wrap.className = 'hero__block hero__block--extra';
  wrap.dataset.heroBlock = `extra-${extra.id}`;

  if (extra.type === 'list') {
    const items = (extra.items || []).map((t) => `<li>${t}</li>`).join('');
    wrap.innerHTML = `
      <p class="hero__block-title">${extra.title || ''}</p>
      <ul class="hero__list hero__list--extra">${items}</ul>`;
  } else {
    wrap.innerHTML = `
      <p class="hero__block-title">${extra.title || ''}</p>
      <p class="hero__extra-text">${extra.content || ''}</p>`;
  }
  return wrap;
}

export function applyHeroExtras(section, extraBlocks) {
  if (!section) return;
  section.querySelectorAll('[data-hero-block^="extra-"]').forEach((el) => el.remove());
  const canvas = section.querySelector('.hero__canvas');
  const anchor = canvas?.querySelector('[data-hero-block="cta"]');
  if (!canvas || !anchor) return;

  (extraBlocks || []).forEach((extra) => {
    canvas.insertBefore(createExtraBlockElement(extra), anchor);
  });
}

function gridAreaName(id) {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function getHeroBlockOrder(layout) {
  const l = mergeHeroLayout(layout);
  const order = [...l.blockOrder];
  l.extraBlocks.forEach((extra) => {
    const key = `extra-${extra.id}`;
    if (!order.includes(key)) order.push(key);
  });
  return order;
}

function setBlockGridArea(section, id) {
  const area = id === 'photo' ? 'photo' : gridAreaName(id);
  section.querySelector(`[data-hero-block="${id}"]`)?.style.setProperty('grid-area', area);
}

function buildDesktopAreas(textIds, photoPos) {
  return textIds.map((id) => {
    const name = gridAreaName(id);
    return photoPos === 'left' ? `"photo ${name}"` : `"${name} photo"`;
  });
}

const HERO_SIDE_CLASS = 'hero__side';

function unwrapHeroSide(canvas) {
  const wrap = canvas?.querySelector(`.${HERO_SIDE_CLASS}`);
  if (!wrap) return;

  const photo = canvas.querySelector('[data-hero-block="photo"]');
  while (wrap.firstChild) {
    canvas.insertBefore(wrap.firstChild, photo?.nextSibling || null);
  }
  wrap.remove();
}

function wrapHeroSide(section, layout) {
  const canvas = section.querySelector('.hero__canvas');
  if (!canvas) return false;

  unwrapHeroSide(canvas);

  const l = mergeHeroLayout(layout);
  if (l.photoPosition === 'top') return false;

  const order = getHeroBlockOrder(l);
  const photoIdx = order.indexOf('photo');
  if (photoIdx === -1) return false;

  const tailIds = order.slice(photoIdx + 1).filter((id) => !l.hiddenBlocks.includes(id));
  const lessonsIdx = tailIds.indexOf('lessons');
  const sideIds = lessonsIdx >= 0 ? tailIds.slice(0, lessonsIdx) : tailIds;
  if (sideIds.length < 2) return false;

  const photo = canvas.querySelector('[data-hero-block="photo"]');
  if (!photo) return false;

  const wrap = document.createElement('div');
  wrap.className = HERO_SIDE_CLASS;
  photo.insertAdjacentElement('afterend', wrap);

  sideIds.forEach((id) => {
    const el = canvas.querySelector(`[data-hero-block="${id}"]`);
    if (el) wrap.appendChild(el);
  });

  return true;
}

function buildMobileAreas(order, layout, hasSideWrap) {
  const l = mergeHeroLayout(layout);
  const photoPos = l.photoPosition;
  const visible = order.filter((id) => !l.hiddenBlocks.includes(id));
  const lines = [];

  if (photoPos === 'top' || !visible.includes('photo')) {
    visible.forEach((id) =>
      lines.push({ blockIds: [id], row: `"${gridAreaName(id)} ${gridAreaName(id)}"` }),
    );
    return lines;
  }

  const photoIdx = order.indexOf('photo');
  const headIds = order.slice(0, photoIdx).filter((id) => !l.hiddenBlocks.includes(id));
  const tailIds = order.slice(photoIdx + 1).filter((id) => !l.hiddenBlocks.includes(id));

  headIds.forEach((id) =>
    lines.push({ blockIds: [id], row: `"${gridAreaName(id)} ${gridAreaName(id)}"` }),
  );

  const lessonsIdx = tailIds.indexOf('lessons');
  const sideIds = lessonsIdx >= 0 ? tailIds.slice(0, lessonsIdx) : tailIds;
  const belowIds = lessonsIdx >= 0 ? tailIds.slice(lessonsIdx) : [];

  if (sideIds.length) {
    if (hasSideWrap) {
      lines.push({
        blockIds: ['photo'],
        sideWrap: true,
        row: photoPos === 'left' ? '"photo side"' : '"side photo"',
      });
    } else {
      const sideId = sideIds[0];
      const name = gridAreaName(sideId);
      lines.push({
        blockIds: ['photo', sideId],
        row: photoPos === 'left' ? `"photo ${name}"` : `"${name} photo"`,
      });
    }
  }

  belowIds.forEach((id) => {
    const name = gridAreaName(id);
    lines.push({ blockIds: [id], row: `"${name} ${name}"` });
  });

  return lines;
}

function applyHeroGrid(section, layout) {
  const l = mergeHeroLayout(layout);
  const canvas = section.querySelector('.hero__canvas');
  if (!canvas) return;

  canvas.style.removeProperty('grid-template-areas');
  section.querySelectorAll('[data-hero-block]').forEach((el) => {
    el.style.removeProperty('grid-area');
    el.style.removeProperty('grid-column');
    el.style.removeProperty('grid-row');
  });

  const order = getHeroBlockOrder(l);
  const photoPos = l.photoPosition;
  const textIds = order.filter((id) => id !== 'photo' && !l.hiddenBlocks.includes(id));
  const isMobile = window.matchMedia('(max-width: 900px)').matches;

  const useMobileSide = isMobile && wrapHeroSide(section, l);
  if (!useMobileSide) {
    unwrapHeroSide(canvas);
  }

  if (!isMobile && (photoPos === 'left' || photoPos === 'right') && textIds.length) {
    canvas.style.gridTemplateAreas = buildDesktopAreas(textIds, photoPos).join('\n');
    setBlockGridArea(section, 'photo');
    textIds.forEach((id) => setBlockGridArea(section, id));
    return;
  }

  if (isMobile) {
    const mobileLines = buildMobileAreas(order, l, useMobileSide);
    if (!mobileLines.length) return;

    canvas.style.gridTemplateAreas = mobileLines.map((line) => line.row).join('\n');
    const assigned = new Set();
    mobileLines.forEach((line) => {
      line.blockIds.forEach((id) => {
        if (assigned.has(id)) return;
        setBlockGridArea(section, id);
        assigned.add(id);
      });

      if (line.sideWrap) {
        canvas.querySelector(`.${HERO_SIDE_CLASS}`)?.style.setProperty('grid-area', 'side');
      }
    });
  }
}

export function applyHeroStructure(section, layout) {
  const l = mergeHeroLayout(layout);
  section.dataset.heroPhotoPosition = l.photoPosition;

  section.querySelectorAll('[data-hero-block]').forEach((el) => {
    el.style.removeProperty('display');
    el.style.removeProperty('order');
  });

  const order = [...l.blockOrder];
  l.extraBlocks.forEach((extra) => {
    const key = `extra-${extra.id}`;
    if (!order.includes(key)) order.push(key);
  });

  order.forEach((id, index) => {
    section.querySelector(`[data-hero-block="${id}"]`)?.style.setProperty('order', String(index));
  });

  l.hiddenBlocks.forEach((id) => {
    section.querySelector(`[data-hero-block="${id}"]`)?.style.setProperty('display', 'none');
  });

  applyHeroGrid(section, l);
}

export function applyHeroLayout(section, layout) {
  if (!section) return;
  const l = mergeHeroLayout(layout);
  section._heroLayout = l;

  if (!section._heroResizeBound) {
    section._heroResizeBound = true;
    window.addEventListener('resize', () => {
      applyHeroStructure(section, section._heroLayout);
    });
  }
  const isCircle = l.photoShape === 'circle';

  section.style.setProperty('--hero-photo-size', `${l.photoSize}px`);
  section.style.setProperty('--hero-photo-size-mobile', `${l.mobilePhotoSize}px`);
  section.style.setProperty('--hero-photo-radius', isCircle ? '50%' : '16px');
  section.style.setProperty('--hero-photo-aspect', isCircle ? '1 / 1' : '4 / 5');
  section.style.setProperty('--hero-photo-border-w', `${l.photoBorder}px`);
  section.style.setProperty('--hero-photo-border-color', l.photoBorderColor);
  section.style.setProperty('--hero-photo-ring-color', l.photoRingColor);
  section.style.setProperty('--hero-photo-offset-x', `${l.photoOffsetX}px`);
  section.style.setProperty('--hero-photo-offset-y', `${l.photoOffsetY}px`);
  section.style.setProperty('--hero-title-size', `${l.titleSize}px`);
  section.style.setProperty('--hero-title-color', l.titleColor);
  section.style.setProperty('--hero-tagline-size', `${l.taglineSize}px`);
  section.style.setProperty('--hero-intro-size', `${l.introSize}px`);
  section.style.setProperty('--hero-text-color', l.textColor);
  section.style.setProperty('--hero-accent-color', l.accentColor);
  section.style.setProperty('--hero-block-gap', `${l.blockGap}px`);
  section.style.setProperty('--hero-list-gap', `${l.listGap}px`);
  section.style.setProperty('--hero-section-pt', `${l.sectionPaddingTop}px`);
  section.style.setProperty('--hero-section-pb', `${l.sectionPaddingBottom}px`);
  section.style.setProperty('--hero-cta-primary-bg', l.primaryBtnBg);
  section.style.setProperty('--hero-cta-secondary-color', l.secondaryBtnColor);
  section.style.setProperty('--hero-cta-gap', `${l.ctaGap}px`);
  section.style.setProperty('--hero-badge-size', `${l.badgeSize}px`);

  applyHeroExtras(section, l.extraBlocks);
  applyHeroStructure(section, l);
}
