import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/family/dashboard
// Requires Role: familyMember
router.get('/dashboard', authenticate, async (req: any, res: any) => {
  try {
    const { userId, roleId } = req.user;

    if (roleId !== 'familyMember') {
      return res.status(403).json({ error: 'Access denied. Family Member role required.' });
    }

    // Fetch the Family Member Profile
    const familyProfile = await prisma.familyMemberProfile.findUnique({
      where: { userId }
    });

    if (!familyProfile) {
      return res.status(404).json({ error: 'Family Member profile not found.' });
    }

    // Parse the comma-separated linked patient IDs
    const linkedIds = familyProfile.linkedPatientIds ? familyProfile.linkedPatientIds.split(',').map(id => id.trim()) : [];

    if (linkedIds.length === 0) {
      return res.json({ connectedMembers: [], upcomingCare: [], pendingConsents: [] });
    }

    // Fetch the linked Patient Profiles
    const patients = await prisma.patientProfile.findMany({
      where: {
        id: { in: linkedIds }
      }
    });

    // Transform into frontend feed format
    const connectedMembers = patients.map(p => {
      // Dynamic vital simulation based on existing conditions
      let heartRate = 75;
      let bp = '120/80';
      let spo2 = 98;
      let status = 'Stable';
      let location = 'Home';
      let avatar = p.gender === 'female' ? '' : '';

      const cond = p.existingConditions?.toLowerCase() || '';
      if (cond.includes('asthma') || cond.includes('bronchitis')) {
        spo2 = 94; // Lower oxygen
      }
      if (cond.includes('dengue') || cond.includes('fever')) {
        heartRate = 95; // Elevated heart rate
        status = 'Under Observation';
        location = 'General Ward';
      }
      if (cond.includes('hypertension') || cond.includes('heart')) {
        bp = '145/90'; // High BP
        status = 'Admitted';
        location = 'Cardiology Wing';
      }

      return {
        id: p.id,
        name: p.fullName,
        relation: 'Linked Patient', // A generic label, could be made more specific
        status,
        location,
        vitals: { heartRate, bloodPressure: bp, spo2 },
        lastUpdate: 'Just now',
        avatar
      };
    });

    // Fetch upcoming appointments for these patients
    const appointments = await prisma.telemedicineAppointment.findMany({
      where: {
        patientId: { in: patients.map(p => p.userId) },
        status: { in: ['SCHEDULED', 'ACTIVE'] }
      },
      include: {
        doctor: {
          include: { doctorProfile: true }
        },
        patient: {
          include: { patientProfile: true }
        }
      },
      orderBy: { scheduledTime: 'asc' },
      take: 5
    });

    const upcomingCare = appointments.map((appt, idx) => ({
      id: appt.id,
      type: 'Appointment',
      title: `${appt.patient.patientProfile?.fullName?.split(' ')[0]} - Dr. ${appt.doctor.doctorProfile?.fullName?.split(' ')[0]}`,
      time: new Date(appt.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      status: appt.status
    }));

    // Construct unified payload
    return res.json({
      connectedMembers,
      upcomingCare,
      pendingConsents: [
        // Mock pending consent for demonstration of the terminal
        {
          id: 'CONS-991',
          patient: connectedMembers[0]?.name || 'Patient',
          procedure: 'Emergency Lab Test Panel',
          cost: '₹2,500',
          doctor: 'Dr. Gregory House',
          status: 'Requires Approval'
        }
      ]
    });

  } catch (error) {
    console.error('Family Dashboard API Error:', error);
    res.status(500).json({ error: 'Internal server error fetching family dashboard data.' });
  }
});

export default router;
