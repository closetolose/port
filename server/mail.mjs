import nodemailer from 'nodemailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getMailConfig(env) {
  const host = String(env.SMTP_HOST ?? '').trim();
  const user = String(env.SMTP_USER ?? '').trim();
  const pass = String(env.SMTP_PASS ?? '').trim();
  if (!host || !user || !pass) return null;

  const port = Number(env.SMTP_PORT || 587);
  const secure =
    env.SMTP_SECURE === 'true' || env.SMTP_SECURE === '1' || port === 465;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from: String(env.MAIL_FROM ?? user).trim(),
    to: String(env.MAIL_TO ?? user).trim(),
  };
}

export function createTransporter(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
}

export function validateContactPayload(body) {
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const message = String(body?.message ?? '').trim();

  if (!name || name.length > 80) {
    return { ok: false, error: 'Укажите имя (до 80 символов)' };
  }
  if (!email || !EMAIL_RE.test(email) || email.length > 120) {
    return { ok: false, error: 'Укажите корректный email' };
  }
  if (!message || message.length < 10) {
    return { ok: false, error: 'Сообщение слишком короткое' };
  }
  if (message.length > 2000) {
    return { ok: false, error: 'Сообщение слишком длинное' };
  }

  return { ok: true, data: { name, email, message } };
}

export async function sendContactMail(transporter, config, { name, email, message }) {
  const subject = `Заявка с сайта: ${name}`;
  const text = `Имя: ${name}\nEmail: ${email}\n\n${message}`;

  await transporter.sendMail({
    from: config.from,
    to: config.to,
    replyTo: email,
    subject,
    text,
  });
}
