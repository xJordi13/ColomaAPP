import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const token = req.cookies.pepa_token || null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const data = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: data.sub } });
    if (!user) return res.status(401).json({ error: 'Not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
