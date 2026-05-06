import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireProjectAccess, requireProjectAdmin } from '../middleware/projectAccess.js';

const router = Router();

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// GET /api/projects - list my projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects - create project
router.post(
  '/',
  requireAuth,
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const project = await prisma.project.create({
        data: {
          name,
          description,
          ownerId: req.user.id,
          members: {
            create: {
              userId: req.user.id,
              role: 'ADMIN',
            },
          },
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, tasks: true } },
        },
      });
      res.status(201).json(project);
    } catch (err) {
      console.error('Create project error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/projects/:id - get project details
router.get(
  '/:id',
  requireAuth,
  [param('id').isInt().toInt()],
  handleValidationErrors,
  requireProjectAccess,
  async (req, res) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          tasks: {
            include: {
              assignee: { select: { id: true, name: true, email: true } },
              creator: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      res.json(project);
    } catch (err) {
      console.error('Get project error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/projects/:id - delete project (owner/admin only)
router.delete(
  '/:id',
  requireAuth,
  [param('id').isInt().toInt()],
  handleValidationErrors,
  requireProjectAccess,
  requireProjectAdmin,
  async (req, res) => {
    try {
      await prisma.project.delete({ where: { id: parseInt(req.params.id) } });
      res.json({ message: 'Project deleted' });
    } catch (err) {
      console.error('Delete project error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/projects/:id/members - add member
router.post(
  '/:id/members',
  requireAuth,
  [
    param('id').isInt().toInt(),
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isIn(['ADMIN', 'MEMBER']),
  ],
  handleValidationErrors,
  requireProjectAccess,
  requireProjectAdmin,
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { email, role = 'MEMBER' } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found with this email' });
      }

      const existing = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: user.id } },
      });
      if (existing) {
        return res.status(400).json({ error: 'User is already a member' });
      }

      const member = await prisma.projectMember.create({
        data: { projectId, userId: user.id, role },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      res.status(201).json(member);
    } catch (err) {
      console.error('Add member error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/projects/:id/members/:userId - remove member
router.delete(
  '/:id/members/:userId',
  requireAuth,
  [param('id').isInt().toInt(), param('userId').isInt().toInt()],
  handleValidationErrors,
  requireProjectAccess,
  requireProjectAdmin,
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project.ownerId === userId) {
        return res.status(400).json({ error: 'Cannot remove project owner' });
      }

      await prisma.projectMember.delete({
        where: { projectId_userId: { projectId, userId } },
      });
      res.json({ message: 'Member removed' });
    } catch (err) {
      console.error('Remove member error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
