import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const COOKIE_NAME = 'pepa_token';
const SESSION_SECONDS = 8 * 60 * 60;
const useSecureCookie = String(process.env.NEXTAUTH_URL || '').startsWith('https://');

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('NEXTAUTH_SECRET debe contener al menos 32 caracteres.');
  }
  return secret;
}

export function createSessionToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, role: user.role },
    getSecret(),
    { expiresIn: SESSION_SECONDS, issuer: 'termosim' }
  );
}

export function readSession(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getSecret(), { issuer: 'termosim' });
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;
    return { userId, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export function sessionCookie(token) {
  return cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: useSecureCookie,
    path: '/',
    maxAge: SESSION_SECONDS,
  });
}

export function clearSessionCookie() {
  return cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: useSecureCookie,
    path: '/',
    expires: new Date(0),
  });
}

export function requirePageAuth(context) {
  const session = readSession(context.req);
  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.userId,
        email: session.email || '',
        role: session.role || 'user',
      },
    },
  };
}
