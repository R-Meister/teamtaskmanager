import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Get user's projects
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    // Tasks assigned to me
    const assignedTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        projectId: { in: projectIds },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Stats
    const totalAssigned = assignedTasks.length;
    const todoCount = assignedTasks.filter((t) => t.status === 'TODO').length;
    const inProgressCount = assignedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const doneCount = assignedTasks.filter((t) => t.status === 'DONE').length;
    const overdueCount = assignedTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    ).length;

    // Recent tasks in my projects
    const recentTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Project stats
    const projectStats = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        _count: { select: { tasks: true, members: true } },
        tasks: {
          select: { status: true },
        },
      },
    });

    const projectsSummary = projectStats.map((p) => ({
      id: p.id,
      name: p.name,
      totalTasks: p._count.tasks,
      members: p._count.members,
      doneTasks: p.tasks.filter((t) => t.status === 'DONE').length,
    }));

    res.json({
      stats: {
        totalAssigned,
        todo: todoCount,
        inProgress: inProgressCount,
        done: doneCount,
        overdue: overdueCount,
      },
      assignedTasks,
      recentTasks,
      projectsSummary,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
