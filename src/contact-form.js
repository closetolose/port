const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



function setFieldError(field, message) {

  const wrap = field.closest('.form-field');

  if (!wrap) return;

  const errorEl = wrap.querySelector('.form-field__error');

  if (message) {

    field.setAttribute('aria-invalid', 'true');

    if (errorEl) {

      errorEl.textContent = message;

      errorEl.hidden = false;

    }

  } else {

    field.removeAttribute('aria-invalid');

    if (errorEl) {

      errorEl.textContent = '';

      errorEl.hidden = true;

    }

  }

}



function validateField(field) {

  const value = field.value.trim();

  if (field.required && !value) {

    setFieldError(field, 'Заполните это поле');

    return false;

  }

  if (field.type === 'email' && value && !EMAIL_RE.test(value)) {

    setFieldError(field, 'Введите корректный email');

    return false;

  }

  if (field.name === 'message' && value.length < 10) {

    setFieldError(field, 'Напишите чуть подробнее (от 10 символов)');

    return false;

  }

  setFieldError(field, '');

  return true;

}



export function initContactForm() {

  const form = document.querySelector('.contact-form');

  if (!form) return;



  const status = form.querySelector('.form-status');

  const submitBtn = form.querySelector('[type="submit"]');

  const fields = [...form.querySelectorAll('.input')];



  fields.forEach((field) => {

    field.addEventListener('blur', () => validateField(field));

    field.addEventListener('input', () => {

      if (field.hasAttribute('aria-invalid')) validateField(field);

    });

  });



  form.addEventListener('submit', async (e) => {

    e.preventDefault();

    if (submitBtn?.disabled) return;



    const valid = fields.every((field) => validateField(field));

    if (!valid) {

      if (status) {

        status.hidden = false;

        status.className = 'form-status form-status--error';

        status.textContent =

          'Проверьте поля формы: имя, email и сообщение должны быть заполнены.';

      }

      fields.find((f) => f.hasAttribute('aria-invalid'))?.focus();

      return;

    }



    const name = form.elements.name.value.trim();

    const email = form.elements.email.value.trim();

    const message = form.elements.message.value.trim();



    if (status) {

      status.hidden = false;

      status.className = 'form-status form-status--loading';

      status.textContent = 'Отправляем…';

    }



    submitBtn.disabled = true;

    submitBtn.classList.add('btn--loading');

    const originalLabel = submitBtn.textContent;

    submitBtn.textContent = 'Отправляем…';



    try {

      const res = await fetch('/api/contact', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ name, email, message }),

      });



      const data = await res.json().catch(() => ({}));



      if (!res.ok) {

        throw new Error(

          data.error ||

            'Не удалось отправить. Напишите на closetolose@gmail.com или в Telegram @closetolose'

        );

      }



      if (status) {

        status.className = 'form-status form-status--success';

        status.textContent =

          'Спасибо! Заявка отправлена. Отвечу в течение суток.';

      }

      form.reset();

      fields.forEach((field) => setFieldError(field, ''));

    } catch (err) {

      if (status) {

        status.className = 'form-status form-status--error';

        status.textContent =

          err.message ||

          'Не удалось отправить. Напишите на closetolose@gmail.com или в Telegram @closetolose';

      }

    } finally {

      submitBtn.disabled = false;

      submitBtn.classList.remove('btn--loading');

      submitBtn.textContent = originalLabel;

    }

  });

}

