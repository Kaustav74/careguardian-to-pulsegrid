import { Router } from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/auth';
import { authenticate } from '../middleware/auth';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Multer setup for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Unified Registration Endpoint
router.post('/register', upload.any(), async (req, res) => {
  try {
    const { email, password, roleId, ...roleData } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!email || !password || !roleId) {
      return res.status(400).json({ error: 'Email, password, and roleId are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Auto-approve Patient role, others PENDING
    const status = roleId === 'patient' ? 'APPROVED' : 'PENDING';

    // File path mapper helper
    const getFilePath = (fieldName: string) => {
      const file = files?.find(f => f.fieldname === fieldName);
      return file ? `/uploads/${file.filename}` : undefined;
    };

    // Use Prisma Transaction to create User and Profile safely
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          roleId,
          status,
        }
      });

      // Role-specific profile creation
      switch (roleId) {
        case 'patient':
          await tx.patientProfile.create({
            data: {
              userId: newUser.id,
              fullName: roleData.fullName,
              dob: new Date(roleData.dob),
              gender: roleData.gender,
              bloodGroup: roleData.bloodGroup,
              phone: roleData.phone,
              profilePhoto: getFilePath('profilePhoto'),
              existingConditions: roleData.existingConditions,
              allergies: roleData.allergies,
              currentMedications: roleData.currentMedications,
              emergencyContactName: roleData.emergencyContactName,
              emergencyContactPhone: roleData.emergencyContactPhone,
              insuranceProvider: roleData.insuranceProvider,
              insuranceId: roleData.insuranceId,
              country: roleData.country,
              state: roleData.state,
              city: roleData.city,
              address: roleData.address,
              pinCode: roleData.pinCode,
              familyMembersLinked: roleData.familyMembersLinked === 'true',
              consentGiven: roleData.consentGiven === 'true',
            }
          });
          break;
        case 'doctor':
          await tx.doctorProfile.create({
            data: {
              userId: newUser.id,
              fullName: roleData.fullName,
              gender: roleData.gender,
              dob: new Date(roleData.dob),
              phone: roleData.phone,
              profilePhoto: getFilePath('profilePhoto'),
              medicalLicenseNumber: roleData.medicalLicenseNumber,
              specialization: roleData.specialization,
              yearsOfExperience: parseInt(roleData.yearsOfExperience, 10),
              qualifications: roleData.qualifications,
              medicalCouncilReg: roleData.medicalCouncilReg,
              hospitalAffiliation: roleData.hospitalAffiliation,
              consultationFees: parseFloat(roleData.consultationFees || '0'),
              availableDays: roleData.availableDays,
              availableTimeSlots: roleData.availableTimeSlots,
              telemedicine: roleData.telemedicine === 'true',
              licenseUpload: getFilePath('licenseUpload'),
              degreeCertificate: getFilePath('degreeCertificate'),
              govtIdProof: getFilePath('govtIdProof'),
            }
          });
          break;
        // ... (Other roles follow same pattern, abstracted for brevity but fully implementable)
        default:
          // Just creating base user for unimplemented specific forms currently
          break;
      }
      
      return newUser;
    });

    res.status(201).json({ message: 'Registration successful', status: user.status });

  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const isValidPassword = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isValidPassword) {
      const targetUserId = user ? user.id : 'anonymous';
      const targetRoleId = user ? user.roleId : 'guest';
      
      // Log failed login audit trail in system database
      await prisma.auditLog.create({
        data: {
          userId: targetUserId,
          roleId: targetRoleId,
          action: 'USER_LOGIN_FAILED',
          resourceType: 'UserSession',
          resourceId: targetUserId,
          details: JSON.stringify({ email, ip: req.ip || '127.0.0.1', reason: !user ? 'User not found' : 'Invalid credentials' })
        }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({ error: 'Account pending admin approval', status: 'PENDING' });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({ error: 'Account registration rejected', status: 'REJECTED' });
    }

    // Log successful login audit trail in system database
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        roleId: user.roleId,
        action: 'USER_LOGIN',
        resourceType: 'UserSession',
        resourceId: user.id,
        details: JSON.stringify({ ip: req.ip || '127.0.0.1', userAgent: req.headers['user-agent'] || 'Unknown' })
      }
    });

    const token = generateToken({ userId: user.id, roleId: user.roleId });
    
    res.json({ token, user: { id: user.id, email: user.email, roleId: user.roleId, status: user.status } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Current User Profile Endpoint
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: true,
        doctorProfile: true,
        hospitalAdminProfile: true,
        // ... include others as needed
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
