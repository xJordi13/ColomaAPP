import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.NEXTAUTH_SECRET, { expiresIn: '8h' });
  res.setHeader('Set-Cookie', cookie.serialize('pepa_token', token, { httpOnly: true, path: '/', maxAge: 8 * 3600 }));
  res.json({ ok: true });
}
