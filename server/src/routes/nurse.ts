import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/nurse/wards
// Fetch all ward bed allocations
router.get('/wards', authenticate, async (req: any, res: any) => {
  try {
    const allocations = await prisma.wardBedAllocation.findMany({
      orderBy: [
        { wardName: 'asc' },
        { bedNumber: 'asc' }
      ]
    });
    return res.json(allocations);
  } catch (error) {
    console.error('Error fetching ward allocations:', error);
    return res.status(500).json({ error: 'Failed to fetch ward allocations' });
  }
});

// POST /api/nurse/vitals
// Update vital signs for a specific bed allocation
router.post('/vitals', authenticate, async (req: any, res: any) => {
  try {
    const { bedId, heartRate, bloodPressure, spo2, temperature } = req.body;

    if (!bedId) {
      return res.status(400).json({ error: 'Bed ID is required' });
    }

    const updated = await prisma.wardBedAllocation.update({
      where: { id: bedId },
      data: {
        heartRate: parseInt(heartRate) || 0,
        bloodPressure: bloodPressure || '120/80',
        spo2: parseInt(spo2) || 0,
        temperature: parseFloat(temperature) || 98.6,
        lastUpdated: new Date()
      }
    });

    // Notify connected UI clients via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('ward-vitals-updated', updated);
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error updating vitals:', error);
    return res.status(500).json({ error: 'Failed to update vitals' });
  }
});

// POST /api/nurse/beds/move
// Shift a patient to another bed
router.post('/beds/move', authenticate, async (req: any, res: any) => {
  try {
    const { sourceBedId, targetBedId } = req.body;

    if (!sourceBedId || !targetBedId) {
      return res.status(400).json({ error: 'Source and target bed IDs are required' });
    }

    const sourceBed = await prisma.wardBedAllocation.findUnique({
      where: { id: sourceBedId }
    });

    const targetBed = await prisma.wardBedAllocation.findUnique({
      where: { id: targetBedId }
    });

    if (!sourceBed || !targetBed) {
      return res.status(404).json({ error: 'Bed allocation records not found' });
    }

    if (targetBed.status === 'OCCUPIED') {
      return res.status(400).json({ error: 'Target bed is already occupied' });
    }

    // Perform swap in database transaction
    await prisma.$transaction([
      prisma.wardBedAllocation.update({
        where: { id: targetBedId },
        data: {
          patientId: sourceBed.patientId,
          patientName: sourceBed.patientName,
          status: 'OCCUPIED',
          heartRate: sourceBed.heartRate,
          bloodPressure: sourceBed.bloodPressure,
          spo2: sourceBed.spo2,
          temperature: sourceBed.temperature
        }
      }),
      prisma.wardBedAllocation.update({
        where: { id: sourceBedId },
        data: {
          patientId: null,
          patientName: null,
          status: 'VACANT',
          heartRate: 0,
          bloodPressure: '-',
          spo2: 0,
          temperature: 0.0
        }
      })
    ]);

    const updatedBeds = await prisma.wardBedAllocation.findMany({
      orderBy: [
        { wardName: 'asc' },
        { bedNumber: 'asc' }
      ]
    });

    // Notify Socket.io clients
    const io = req.app.get('io');
    if (io) {
      io.emit('ward-layout-updated', updatedBeds);
    }

    return res.json({ message: 'Patient moved successfully', beds: updatedBeds });
  } catch (error) {
    console.error('Error shifting beds:', error);
    return res.status(500).json({ error: 'Failed to complete bed movement' });
  }
});

// GET /api/nurse/care-checklist
// Fetch daily care medication (IV/Injection) and tasks timeline
router.get('/care-checklist', authenticate, async (req: any, res: any) => {
  try {
    const checklist = await prisma.nurseCareItem.findMany({
      orderBy: { scheduledTime: 'asc' }
    });
    return res.json(checklist);
  } catch (error) {
    console.error('Error fetching care checklist:', error);
    return res.status(500).json({ error: 'Failed to fetch care checklist' });
  }
});

// POST /api/nurse/care-checklist/:id/complete
// Mark care item as completed (PCM given, IV administered)
router.post('/care-checklist/:id/complete', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const updated = await prisma.nurseCareItem.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('care-checklist-updated', updated);
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error completing care item:', error);
    return res.status(500).json({ error: 'Failed to complete care item' });
  }
});

// GET /api/nurse/clinical-alerts
// Fetch pending clinical doctor instructions and critical warnings
router.get('/clinical-alerts', authenticate, async (req: any, res: any) => {
  try {
    const alerts = await prisma.clinicalAlert.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(alerts);
  } catch (error) {
    console.error('Error fetching clinical alerts:', error);
    return res.status(500).json({ error: 'Failed to fetch clinical alerts' });
  }
});

// POST /api/nurse/clinical-alerts/:id/acknowledge
// Acknowledge a doctor's instruction
router.post('/clinical-alerts/:id/acknowledge', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const updated = await prisma.clinicalAlert.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED' }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('clinical-alerts-updated', updated);
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error acknowledging clinical alert:', error);
    return res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// POST /api/nurse/handovers
// Submit a compiled nursing shift handover report
router.post('/handovers', authenticate, async (req: any, res: any) => {
  try {
    const { outgoingNurseName, incomingNurseName, shiftType, handoverReport, criticalIncidents } = req.body;

    if (!outgoingNurseName || !incomingNurseName || !handoverReport) {
      return res.status(400).json({ error: 'Outgoing nurse, incoming nurse, and report text are required' });
    }

    const report = await prisma.shiftHandoverReport.create({
      data: {
        outgoingNurseName,
        incomingNurseName,
        shiftType: shiftType || 'Morning',
        handoverReport,
        criticalIncidents: criticalIncidents || 'None'
      }
    });

    return res.json(report);
  } catch (error) {
    console.error('Error creating handover report:', error);
    return res.status(500).json({ error: 'Failed to record shift handover' });
  }
});

// GET /api/nurse/handovers
// Fetch past shift handovers
router.get('/handovers', authenticate, async (req: any, res: any) => {
  try {
    const reports = await prisma.shiftHandoverReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    return res.json(reports);
  } catch (error) {
    console.error('Error fetching handovers:', error);
    return res.status(500).json({ error: 'Failed to fetch handovers' });
  }
});

export default router;
