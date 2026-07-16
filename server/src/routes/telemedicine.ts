import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// GET /api/telemedicine/doctors - Fetch all approved doctors
router.get('/doctors', authenticate, async (req: Request, res: Response) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        roleId: 'doctor',
        status: 'APPROVED'
      },
      include: {
        doctorProfile: true
      }
    });
    return res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/telemedicine - Fetch appointments for the current user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const roleId = req.user?.roleId;

    if (!userId || !roleId) {
      return res.status(401).json({ error: 'User context missing' });
    }

    let appointments = [];

    if (roleId === 'doctor') {
      appointments = await prisma.telemedicineAppointment.findMany({
        where: { doctorId: userId },
        include: {
          patient: {
            include: { patientProfile: true }
          }
        },
        orderBy: { scheduledTime: 'asc' }
      });
    } else if (roleId === 'patient') {
      appointments = await prisma.telemedicineAppointment.findMany({
        where: { patientId: userId },
        include: {
          doctor: {
            include: { doctorProfile: true }
          }
        },
        orderBy: { scheduledTime: 'asc' }
      });
    } else {
      // Admin or other roles might fetch all or specific ones
      appointments = await prisma.telemedicineAppointment.findMany({
        include: {
          patient: { include: { patientProfile: true } },
          doctor: { include: { doctorProfile: true } }
        },
        orderBy: { scheduledTime: 'asc' }
      });
    }

    return res.json(appointments);
  } catch (error) {
    console.error('Error fetching telemedicine appointments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/telemedicine/:id - Fetch a single appointment
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.telemedicineAppointment.findUnique({
      where: { id: id as string },
      include: {
        patient: { include: { patientProfile: true } },
        doctor: { include: { doctorProfile: true } }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    return res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/telemedicine/schedule - Schedule a new appointment
router.post('/schedule', authenticate, async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, scheduledTime, notes } = req.body;

    if (!patientId || !doctorId || !scheduledTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const appointment = await prisma.telemedicineAppointment.create({
      data: {
        patientId,
        doctorId,
        scheduledTime: new Date(scheduledTime),
        notes,
        meetingLink: `/telemedicine/` // We will append the ID after creation
      }
    });

    // Update meeting link to use its own ID
    const updatedAppointment = await prisma.telemedicineAppointment.update({
      where: { id: appointment.id },
      data: { meetingLink: `/telemedicine/${appointment.id}` }
    });

    return res.status(201).json(updatedAppointment);
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/telemedicine/:id/status - Update appointment status
router.put('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const appointment = await prisma.telemedicineAppointment.update({
      where: { id: id as string },
      data: { status }
    });

    return res.json(appointment);
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
