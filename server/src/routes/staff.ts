import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Initial seed datasets
const INITIAL_DOCTORS = [
  { id: 'DOC-01', name: 'Dr. Meredith Grey', specialty: 'General Surgery', department: 'General Medicine', status: 'Available', phone: '+1 (555) 019-2831' },
  { id: 'DOC-02', name: 'Dr. Gregory House', specialty: 'Diagnostic Medicine', department: 'Neurology', status: 'On Consultation', phone: '+1 (555) 014-9843', assignedPatient: 'John Doe', roomAllocation: 'Room-102' },
  { id: 'DOC-03', name: 'Dr. Derek Shepherd', specialty: 'Neurosurgery', department: 'Neurology', status: 'In Surgery', phone: '+1 (555) 012-4411', assignedPatient: 'Sarah Jenkins', roomAllocation: 'OT-2' },
  { id: 'DOC-04', name: 'Dr. Cristina Yang', specialty: 'Cardiothoracic Surgery', department: 'Cardiology', status: 'Available', phone: '+1 (555) 018-9900' },
  { id: 'DOC-05', name: 'Dr. Alex Karev', specialty: 'Pediatrics', department: 'Pediatrics', status: 'On Leave', phone: '+1 (555) 015-8833' },
];

const INITIAL_SHIFTS = [
  { id: 'SH-01', staffName: 'Dr. Meredith Grey', role: 'Doctor', shiftType: 'Morning (08:00 - 16:00)', day: 'Monday' },
  { id: 'SH-02', staffName: 'Nurse Carol Hathaway', role: 'Nurse', shiftType: 'Morning (08:00 - 16:00)', day: 'Monday' },
  { id: 'SH-03', staffName: 'Dr. Gregory House', role: 'Doctor', shiftType: 'Evening (16:00 - 00:00)', day: 'Tuesday' },
  { id: 'SH-04', staffName: 'Nurse Abby Lockhart', role: 'Nurse', shiftType: 'Night (00:00 - 08:00)', day: 'Wednesday' },
  { id: 'SH-05', staffName: 'Dr. Cristina Yang', role: 'Doctor', shiftType: 'Morning (08:00 - 16:00)', day: 'Thursday' },
];

const INITIAL_LEAVES = [
  { id: 'LV-01', staffName: 'Dr. Alex Karev', role: 'Doctor', leaveType: 'Casual Leave', startDate: '2026-05-18', endDate: '2026-05-22', reason: 'Family gathering', status: 'APPROVED' },
  { id: 'LV-02', staffName: 'Nurse Abby Lockhart', role: 'Nurse', leaveType: 'Sick Leave', startDate: '2026-05-19', endDate: '2026-05-20', reason: 'Dental appointment', status: 'PENDING' },
  { id: 'LV-03', staffName: 'Dr. Derek Shepherd', role: 'Doctor', leaveType: 'Annual Leave', startDate: '2026-06-01', endDate: '2026-06-15', reason: 'Medical research symposium in Zurich', status: 'PENDING' },
];

// Helper to seed/initialize DB with mock staff data if tables are empty
async function ensureSeeded() {
  const docCount = await prisma.hospitalDoctor.count();
  if (docCount === 0) {
    for (const doc of INITIAL_DOCTORS) {
      await prisma.hospitalDoctor.create({ data: doc });
    }
  }

  const shiftCount = await prisma.shiftAssignment.count();
  if (shiftCount === 0) {
    for (const sh of INITIAL_SHIFTS) {
      await prisma.shiftAssignment.create({ data: sh });
    }
  }

  const leaveCount = await prisma.leaveRequest.count();
  if (leaveCount === 0) {
    for (const lv of INITIAL_LEAVES) {
      await prisma.leaveRequest.create({ data: lv });
    }
  }
}

// Helper to fetch full database state and broadcast it via socket
async function broadcastStateUpdate(req: any) {
  try {
    const io = req.app.get('io');
    if (io) {
      const doctors = await prisma.hospitalDoctor.findMany();
      const shifts = await prisma.shiftAssignment.findMany();
      const leaves = await prisma.leaveRequest.findMany();
      io.emit('staff-data-updated', { doctors, shifts, leaves });
    }
  } catch (error) {
    console.error('Error broadcasting state update:', error);
  }
}

// 1. Fetch entire persistent staff datasets (Doctors, Shifts, Leaves)
router.get('/', authenticate, async (req, res) => {
  try {
    await ensureSeeded();

    const doctors = await prisma.hospitalDoctor.findMany();
    const shifts = await prisma.shiftAssignment.findMany();
    const leaves = await prisma.leaveRequest.findMany();

    res.json({ doctors, shifts, leaves });
  } catch (error) {
    console.error('Error fetching staff data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Update Doctor Allocation
router.put('/doctor/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedPatient, roomAllocation } = req.body;

    const updatedDoctor = await prisma.hospitalDoctor.update({
      where: { id: id as string },
      data: {
        status,
        assignedPatient: status === 'Available' || status === 'On Leave' ? null : assignedPatient,
        roomAllocation: status === 'Available' || status === 'On Leave' ? null : roomAllocation,
      }
    });

    res.json(updatedDoctor);
    broadcastStateUpdate(req);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Create Shift Assignment
router.post('/shift', authenticate, async (req, res) => {
  try {
    const { staffName, role, shiftType, day } = req.body;

    const newShift = await prisma.shiftAssignment.create({
      data: {
        staffName,
        role,
        shiftType,
        day,
      }
    });

    res.status(201).json(newShift);
    broadcastStateUpdate(req);
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Delete Shift Assignment
router.delete('/shift/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.shiftAssignment.delete({
      where: { id: id as string }
    });

    res.json({ message: 'Shift deleted successfully' });
    broadcastStateUpdate(req);
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Submit Leave Request
router.post('/leave', authenticate, async (req, res) => {
  try {
    const { staffName, role, leaveType, startDate, endDate, reason } = req.body;

    const newLeave = await prisma.leaveRequest.create({
      data: {
        staffName,
        role,
        leaveType,
        startDate,
        endDate,
        reason,
        status: 'PENDING',
      }
    });

    res.status(201).json(newLeave);
    broadcastStateUpdate(req);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Process Leave Request (Approve / Decline)
router.put('/leave/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED or DECLINED

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: id as string },
      data: { status }
    });

    // If leave is approved, update corresponding doctor status if found in database
    if (status === 'APPROVED') {
      const matchDoctor = await prisma.hospitalDoctor.findFirst({
        where: { name: updatedLeave.staffName }
      });

      if (matchDoctor) {
        await prisma.hospitalDoctor.update({
          where: { id: matchDoctor.id },
          data: { status: 'On Leave' }
        });
      }
    }

    res.json(updatedLeave);
    broadcastStateUpdate(req);
  } catch (error) {
    console.error('Error processing leave:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
