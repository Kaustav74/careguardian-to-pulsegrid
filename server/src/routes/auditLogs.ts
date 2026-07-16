import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get recent audit logs (Live from Prisma DB)
router.get('/', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
    });

    // Fetch user emails dynamically since schema does not define user relation on AuditLog
    const userIds = Array.from(new Set(logs.map(log => log.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true }
    });

    const userMap = new Map(users.map(u => [u.id, u.email]));

    // Map logs to match UI representation
    const mappedLogs = logs.map(log => ({
      id: log.id,
      user: userMap.get(log.userId) || 'system@pulsegrid.com',
      action: log.action,
      resource: log.resourceType + (log.resourceId ? `: ${log.resourceId.substring(0, 8).toUpperCase()}` : ''),
      time: new Date(log.timestamp).toLocaleTimeString()
    }));

    res.json(mappedLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create new audit log
router.post('/', authenticate, async (req, res) => {
  try {
    const { action, resourceType, resourceId, details } = req.body;
    const log = await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        roleId: req.user!.roleId,
        action,
        resourceType,
        resourceId,
        details: details ? JSON.stringify(details) : undefined
      }
    });
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
