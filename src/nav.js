export function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('site-menu');
  if (!toggle || !menu || !(menu instanceof HTMLDialogElement)) return;

  const closeBtn = menu.querySelector('.site-menu__close');
  const links = menu.querySelectorAll('a[href^="#"]');

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('menu-open', open);
  };

  toggle.addEventListener('click', () => {
    if (menu.open) {
      menu.close();
      setOpen(false);
      toggle.focus();
    } else {
      menu.showModal();
      setOpen(true);
      closeBtn?.focus();
    }
  });

  closeBtn?.addEventListener('click', () => {
    menu.close();
    setOpen(false);
    toggle.focus();
  });

  menu.addEventListener('close', () => setOpen(false));

  menu.addEventListener('click', (e) => {
    if (e.target === menu) {
      menu.close();
    }
  });

  links.forEach((link) => {
    link.addEventListener('click', () => {
      menu.close();
      setOpen(false);
    });
  });
}
