import { readSession } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Sesión no válida.' });
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });
    return res.status(200).json(user);
  } catch {
    return res.status(500).json({ error: 'No fue posible consultar el perfil.' });
  }
}
