import { requireAuth } from './auth.js';
import prisma from '../lib/prisma.js';

export async function requireProjectAccess(req, res, next) {
  try {
    const projectId = parseInt(req.params.projectId || req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.id,
        },
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner = project.ownerId === req.user.id;
    const isMember = !!member;
    const isAdmin = isOwner || member?.role === 'ADMIN' || req.user.globalRole === 'ADMIN';

    if (!isOwner && !isMember && req.user.globalRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Not a project member' });
    }

    req.projectAccess = { isOwner, isMember, isAdmin, project };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireProjectAdmin(req, res, next) {
  if (!req.projectAccess?.isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Project admin access required' });
  }
  next();
}
