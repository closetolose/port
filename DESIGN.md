---
name: Никита · информатика
description: Дружелюбный лендинг репетитора по информатике в энергичном Duolingo-вайбе
colors:
  duo-green: "#58cc02"
  duo-green-deep: "#256300"
  duo-green-text: "#3a7d01"
  duo-green-shadow: "#3f8f01"
  duo-green-light: "#d7ffb8"
  sky-blue: "#1cb0f6"
  sky-blue-deep: "#0a7099"
  sky-blue-text: "#0a6fa8"
  video-bg: "#f4f8fe"
  snow-white: "#ffffff"
  charcoal: "#4b4b4b"
  almost-black: "#3c3c3c"
  border: "#b8c4d4"
typography:
  display:
    fontFamily: "'Fredoka', ui-sans-serif, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.96px"
  body:
    fontFamily: "'Nunito Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  cards: "12px"
  buttons: "12px"
  inputs: "12px"
spacing:
  unit: "4px"
  section: "100px"
  card: "24px"
components:
  button-primary:
    backgroundColor: "{colors.duo-green-deep}"
    textColor: "{colors.snow-white}"
    rounded: "{rounded.buttons}"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "{colors.duo-green-deep}"
    textColor: "{colors.snow-white}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.sky-blue-text}"
    rounded: "{rounded.buttons}"
    padding: "14px 24px"
---

# Design System: Никита · информатика

## Overview

**Creative North Star: "Урок, который хочется открыть"**

Визуальная система лендинга репетитора: яркий, понятный, без корпоративного холода. Тёмно-зелёные CTA и читаемые заголовки на светлом голубом фоне задают ощущение «можно справиться». Типографика Fredoka + Nunito Sans несёт игривую энергию, но контент и цены держат взрослый тон.

Система отвергает SaaS-градиенты, hero-метрики, glassmorphism и инфантильный клон Duolingo. Глубина через 3D-кнопки, bento-сетку преимуществ и живые иллюстрации.

**Key Characteristics:**
- Committed color: зелёный как главный акцент действия (deep для кнопок, text для заголовков)
- 3D tactile buttons с нижней тенью
- Светлый холодный фон (#f4f8fe), не cream
- Заголовки секций в lowercase Fredoka, тёмно-зелёные
- Карточки занятий: иконка и заголовок в одной строке

## Colors

### Primary
- **Duo Green** (#58cc02): декоративные акценты, прогресс-бары.
- **Duo Green Deep** (#256300): фон primary-кнопок и тёмных секций (tools).
- **Duo Green Text** (#3a7d01): `.headline-green`, логотип, читаемый зелёный на светлом фоне.
- **Duo Green Shadow** (#3f8f01): нижняя грань 3D-кнопок.

### Secondary
- **Sky Blue** (#1cb0f6): фокус полей, декоративные акценты.
- **Sky Blue Deep** (#0a7099): фон `btn--sky`.
- **Sky Blue Text** (#0a6fa8): ссылки и outline-кнопки (WCAG AA на белом).

### Neutral
- **Video Background** (#f4f8fe): основной фон.
- **Snow White**, **Charcoal**, **Almost Black**, **Border**: как в `tokens.css`.

## Typography

**Display:** Fredoka · **Body:** Nunito Sans

- Body tracking: `0.02em` (не широкий Duolingo-трекинг).
- Heading tracking: `0.03em` на sm/section headings.
- Body copy: `max-width: 65ch`, `text-wrap: pretty`.

## Elevation

3D-кнопки (`box-shadow: 0 4px 0`) и карточки с border-shadow. Без backdrop-blur в header.

## Components

### Buttons
- Primary: `duo-green-deep` + белый текст, 3D shadow.
- Outline: `sky-blue-text`, border 2px.
- Focus: `outline` sky-blue 3px.

### Cards
- Тарифы: grid, иконка слева от заголовка.
- Benefits: lead full-width; accent без side-tab; остальные с горизонтальной иконкой.

### Navigation
- Sticky header без glassmorphism.
- Desktop: inline nav. Mobile: burger + `<dialog>` drawer.

### Forms
- Labels, `aria-invalid`, loading/success/error states.
- `mailto:` + Telegram fallback.

## Do's and Don'ts

### Do:
- Токены из `tokens.css`.
- Контраст AA: deep green / blue-text на светлых фонах.
- `prefers-reduced-motion` для reveal и карусели.

### Don't:
- SaaS-градиенты, Inter, hero-метрики.
- Side-tab borders, icon-tile stacks.
- Bounce/elastic easing, em-dash в body copy.
- `opacity: 0` на контенте до JS (reveal только через transform).
