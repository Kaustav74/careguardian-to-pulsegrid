import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// GET /api/documents - Fetch user's documents
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const roleId = req.user?.roleId;

    if (!userId || !roleId) {
      return res.status(401).json({ error: 'User context missing' });
    }

    // For now, if the user is a patient, fetch their documents. 
    // If they are a doctor/admin, we might need a different query (e.g. by patientId query param).
    // Let's assume patients fetch their own documents.
    const documents = await prisma.medicalDocument.findMany({
      where: {
        patientId: userId,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/documents/upload - Upload a new document
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { fileType, notes } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ error: 'User context missing' });
    }

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!fileType) {
      return res.status(400).json({ error: 'File type is required' });
    }

    const fileUrl = `/uploads/${file.filename}`;

    const document = await prisma.medicalDocument.create({
      data: {
        patientId: userId, // Assuming patient is uploading their own document for now
        uploaderId: userId,
        fileName: file.originalname,
        fileType: fileType,
        fileUrl: fileUrl,
        notes: notes || null,
      },
    });

    return res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
