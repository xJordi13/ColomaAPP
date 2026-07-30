import bcrypt from 'bcryptjs';
import { createSessionToken, sessionCookie } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

const attemptStore = globalThis.__termosimLoginAttempts || new Map();
if (process.env.NODE_ENV !== 'production') globalThis.__termosimLoginAttempts = attemptStore;

function getAttemptKey(req, email) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return `${forwarded || req.socket?.remoteAddress || 'local'}:${email.toLowerCase()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  if (!email || !password || email.length > 254 || password.length > 128) {
    return res.status(400).json({ error: 'Ingresa correo y contraseña.' });
  }

  const attemptKey = getAttemptKey(req, email);
  const now = Date.now();
  const recentAttempts = (attemptStore.get(attemptKey) || []).filter(
    (timestamp) => now - timestamp < 10 * 60 * 1000
  );
  if (recentAttempts.length >= 5) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera 10 minutos antes de volver a intentar.' });
  }

  try {
    const users = await prisma.$queryRaw`
      SELECT id, name, email, password, role
      FROM User
      WHERE email = ${email} COLLATE NOCASE
      LIMIT 1
    `;
    const user = users[0];
    const valid = user ? await bcrypt.compare(password, user.password) : false;
    if (!valid) {
      attemptStore.set(attemptKey, [...recentAttempts, now]);
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    attemptStore.delete(attemptKey);
    const token = createSessionToken(user);
    res.setHeader('Set-Cookie', sessionCookie(token));
    return res.status(200).json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'No fue posible iniciar sesión. Revisa la configuración del servidor.',
    });
  }
}
