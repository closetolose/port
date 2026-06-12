import fs from 'node:fs';
import path from 'node:path';

import {
  createTransporter,
  getMailConfig,
  sendContactMail,
  validateContactPayload,
} from './mail.mjs';

export function createApiMiddleware({ env, root }) {
  const contentPath = path.join(root, 'public', 'content.json');
  const publicDir = path.join(root, 'public');
  const password = env.ADMIN_PASSWORD || 'port2026';
  const mailConfig = getMailConfig(env);
  const mailer = mailConfig ? createTransporter(mailConfig) : null;

  return async function apiMiddleware(req, res, next) {
    if (!req.url?.startsWith('/api/')) return next();

    const apiPath = req.url.split('?')[0];

    if (req.method === 'GET' && apiPath === '/api/ping') {
      sendJson(res, 200, {
        ok: true,
        cms: true,
        mail: Boolean(mailer),
      });
      return;
    }

    if (req.method === 'POST' && apiPath === '/api/auth') {
      try {
        const raw = await readBody(req);
        const { password: attempt } = JSON.parse(raw);
        const normalized = String(attempt ?? '').trim();
        if (normalized !== password.trim()) {
          sendJson(res, 401, { error: 'Неверный пароль' });
          return;
        }
        sendJson(res, 200, { ok: true });
      } catch {
        sendJson(res, 400, { error: 'Неверный запрос' });
      }
      return;
    }

    if (req.method === 'POST' && apiPath === '/api/contact') {
      if (!mailer || !mailConfig) {
        sendJson(res, 503, {
          error:
            'Почта не настроена. Добавьте SMTP_* в .env и перезапустите npm run dev',
        });
        return;
      }

      try {
        const raw = await readBody(req);
        const payload = JSON.parse(raw);
        const check = validateContactPayload(payload);
        if (!check.ok) {
          sendJson(res, 400, { error: check.error });
          return;
        }

        await sendContactMail(mailer, mailConfig, check.data);
        sendJson(res, 200, { ok: true });
      } catch (err) {
        console.error('[contact]', err);
        sendJson(res, 500, {
          error: 'Не удалось отправить письмо. Попробуйте Telegram или email вручную.',
        });
      }
      return;
    }

    if (req.method === 'GET' && apiPath === '/api/content') {
      try {
        const data = fs.readFileSync(contentPath, 'utf8');
        sendJson(res, 200, JSON.parse(data));
      } catch {
        sendJson(res, 500, { error: 'Не удалось прочитать content.json' });
      }
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const auth = String(req.headers['x-admin-password'] ?? '').trim();
    if (auth !== password.trim()) {
      sendJson(res, 401, { error: 'Неверный пароль' });
      return;
    }

    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw);

      if (apiPath === '/api/content') {
        fs.writeFileSync(contentPath, JSON.stringify(payload, null, 2), 'utf8');
        sendJson(res, 200, { ok: true });
        return;
      }

      if (apiPath === '/api/upload') {
        const { filename, data } = payload;
        if (!filename || !data) {
          sendJson(res, 400, { error: 'Нужны filename и data' });
          return;
        }
        const safeName = path.basename(filename).replace(/[^\w.\-]/g, '_');
        const base64 = data.includes(',') ? data.split(',')[1] : data;
        const buffer = Buffer.from(base64, 'base64');
        const uploadsDir = path.join(publicDir, 'uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, safeName);
        fs.writeFileSync(filePath, buffer);
        sendJson(res, 200, { path: `/uploads/${safeName}` });
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch {
      sendJson(res, 500, { error: 'Ошибка сервера' });
    }
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}
