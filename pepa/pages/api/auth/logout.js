import cookie from 'cookie';
export default async function handler(req, res) {
  res.setHeader('Set-Cookie', cookie.serialize('pepa_token', '', { httpOnly: true, path: '/', maxAge: -1 }));
  res.json({ ok: true });
}
