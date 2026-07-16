import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Mapping roleId to the corresponding relation name in the User model
const ROLE_PROFILE_MAP: Record<string, string> = {
  patient: 'patientProfile',
  familyMember: 'familyMemberProfile',
  doctor: 'doctorProfile',
  nurse: 'nurseProfile',
  hospitalAdmin: 'hospitalAdminProfile',
  superAdmin: 'superAdminProfile',
  ambulanceDriver: 'ambulanceDriverProfile',
  pharmacist: 'pharmacistProfile',
  diagnosticStaff: 'diagnosticStaffProfile',
  ruralVolunteer: 'ruralVolunteerProfile',
  emergencyOperator: 'emergencyOperatorProfile',
  networkAdmin: 'networkAdminProfile',
};

// GET /api/profile - Fetch current user's unified profile
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const roleId = req.user?.roleId;

    if (!userId || !roleId) {
      return res.status(401).json({ error: 'User context missing' });
    }

    const profileRelation = ROLE_PROFILE_MAP[roleId];
    if (!profileRelation) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        [profileRelation]: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Flattening the response
    const profileData = (user as any)[profileRelation];
    const unifiedProfile = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profileData: profileData || {},
    };

    return res.json(unifiedProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile - Update current user's profile
router.put('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const roleId = req.user?.roleId;
    const { email, profileData } = req.body;

    if (!userId || !roleId) {
      return res.status(401).json({ error: 'User context missing' });
    }

    const profileRelation = ROLE_PROFILE_MAP[roleId];
    if (!profileRelation) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Atomic update using Prisma transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update base user details if provided (limited fields for now)
      const userUpdate: any = {};
      if (email) userUpdate.email = email;

      const user = await tx.user.update({
        where: { id: userId },
        data: userUpdate,
      });

      // Update role-specific profile data
      if (profileData) {
        // Find the profile ID first
        const existingUser = await tx.user.findUnique({
          where: { id: userId },
          include: { [profileRelation]: true }
        });
        
        const existingProfile = (existingUser as any)[profileRelation];
        
        if (existingProfile) {
          await (tx as any)[profileRelation].update({
            where: { id: existingProfile.id },
            data: profileData,
          });
        } else {
          // Create if it doesn't exist (edge case)
          await (tx as any)[profileRelation].create({
            data: {
              ...profileData,
              userId: user.id,
            },
          });
        }
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: { [profileRelation]: true },
      });
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found after update' });
    }

    const finalProfileData = (updatedUser as any)[profileRelation];
    const unifiedProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      roleId: updatedUser.roleId,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      profileData: finalProfileData || {},
    };

    return res.json(unifiedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
