import { readSession } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

const { sanitizeDesign, sanitizeProfile } = require('../../lib/processModel.cjs');

export default async function handler(req, res) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Sesión no válida.' });

  if (req.method === 'GET') {
    try {
      const state = await prisma.processState.findUnique({ where: { userId: session.userId } });
      if (!state) return res.status(204).end();

      return res.status(200).json({
        design: sanitizeDesign(JSON.parse(state.designJson)),
        profile: sanitizeProfile(JSON.parse(state.profileJson)),
        updatedAt: state.updatedAt,
      });
    } catch {
      return res.status(500).json({ error: 'No fue posible recuperar el proceso guardado.' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const design = sanitizeDesign(req.body?.design);
      const profile = sanitizeProfile(req.body?.profile);

      await prisma.processState.upsert({
        where: { userId: session.userId },
        create: {
          userId: session.userId,
          designJson: JSON.stringify(design),
          profileJson: JSON.stringify(profile),
        },
        update: {
          designJson: JSON.stringify(design),
          profileJson: JSON.stringify(profile),
        },
      });

      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ error: 'No fue posible guardar el proceso.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Método no permitido.' });
}
