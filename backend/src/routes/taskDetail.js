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

// GET /api/tasks/:id - get single task
router.get(
  '/:id',
  requireAuth,
  async (req, res) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, ownerId: true } },
        },
      });

      if (!task) return res.status(404).json({ error: 'Task not found' });

      // Check access
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
      });
      const isOwner = task.project.ownerId === req.user.id;
      if (!isOwner && !member && req.user.globalRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json(task);
    } catch (err) {
      console.error('Get task error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PATCH /api/tasks/:id - update task
router.patch(
  '/:id',
  requireAuth,
  [
    param('id').isInt().toInt(),
    body('title').optional().trim().notEmpty(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('assigneeId').optional().isInt().toInt(),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: { select: { id: true, ownerId: true } } },
      });

      if (!task) return res.status(404).json({ error: 'Task not found' });

      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
      });
      const isOwner = task.project.ownerId === req.user.id;
      const isAdmin = isOwner || member?.role === 'ADMIN' || req.user.globalRole === 'ADMIN';
      const isAssignee = task.assigneeId === req.user.id;

      if (!isOwner && !member && !isAssignee && req.user.globalRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { title, description, status, priority, dueDate, assigneeId } = req.body;
      const updated = await prisma.task.update({
        where: { id: taskId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(priority !== undefined && { priority }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
      });
      res.json(updated);
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/tasks/:id - delete task
router.delete(
  '/:id',
  requireAuth,
  [param('id').isInt().toInt()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: { select: { id: true, ownerId: true } } },
      });

      if (!task) return res.status(404).json({ error: 'Task not found' });

      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } },
      });
      const isOwner = task.project.ownerId === req.user.id;
      const isAdmin = isOwner || member?.role === 'ADMIN' || req.user.globalRole === 'ADMIN';
      const isCreator = task.creatorId === req.user.id;

      if (!isAdmin && !isCreator) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await prisma.task.delete({ where: { id: taskId } });
      res.json({ message: 'Task deleted' });
    } catch (err) {
      console.error('Delete task error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
