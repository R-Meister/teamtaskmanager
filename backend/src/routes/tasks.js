import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireProjectAccess, requireProjectAdmin } from '../middleware/projectAccess.js';

const router = Router({ mergeParams: true });

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// GET /api/projects/:projectId/tasks - list tasks
router.get(
  '/',
  requireAuth,
  requireProjectAccess,
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { status, assignee, overdue } = req.query;

      const where = { projectId };
      if (status) where.status = status;
      if (assignee) where.assigneeId = parseInt(assignee);
      if (overdue === 'true') {
        where.dueDate = { lt: new Date() };
        where.status = { not: 'DONE' };
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(tasks);
    } catch (err) {
      console.error('List tasks error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/projects/:projectId/tasks - create task
router.post(
  '/',
  requireAuth,
  requireProjectAccess,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('assigneeId').optional().isInt().toInt(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { title, description, status, priority, dueDate, assigneeId } = req.body;

      const task = await prisma.task.create({
        data: {
          title,
          description,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId,
          assigneeId: assigneeId || null,
          creatorId: req.user.id,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
      });
      res.status(201).json(task);
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
