import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/pharmacist/prescriptions
// Fetch all prescriptions
router.get('/prescriptions', authenticate, async (req: any, res: any) => {
  try {
    const prescriptions = await prisma.pharmacistPrescription.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// POST /api/pharmacist/prescriptions/:id/validate
// Record counseling notes and mark as validated
router.post('/prescriptions/:id/validate', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { counselingNotes } = req.body;

    const updated = await prisma.pharmacistPrescription.update({
      where: { id },
      data: {
        counselingNotes,
        status: 'VALIDATED'
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('prescription-updated', updated);
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error validating prescription:', error);
    return res.status(500).json({ error: 'Failed to validate prescription' });
  }
});

// POST /api/pharmacist/prescriptions/:id/dispense
// Dispense prescription, decrement stocks, log controlled substances
router.post('/prescriptions/:id/dispense', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.pharmacistPrescription.findUnique({
      where: { id }
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescription.status === 'DISPENSED') {
      return res.status(400).json({ error: 'Prescription already dispensed' });
    }

    const medicines = JSON.parse(prescription.medicines);
    const pharmacistName = req.user?.displayName || 'Albert Hofmann';

    // We execute updates in a transaction
    await prisma.$transaction(async (tx) => {
      for (const medItem of medicines) {
        // Find matching medicine in database
        const dbMed = await tx.pharmacyMedicine.findFirst({
          where: {
            name: {
              contains: medItem.name
            }
          }
        });

        if (dbMed) {
          // Decrement stock (ensure it doesn't go below 0 for demo purposes, or handle appropriately)
          const newStock = Math.max(0, dbMed.stock - 1); // assuming 1 unit per item or parsing quantity
          await tx.pharmacyMedicine.update({
            where: { id: dbMed.id },
            data: { stock: newStock }
          });

          // Log controlled substances
          if (dbMed.isControlled) {
            await tx.controlledSubstanceLog.create({
              data: {
                medicineName: dbMed.name,
                patientName: prescription.patientName,
                quantity: 1,
                pharmacistName,
                action: 'DISPENSED'
              }
            });
          }
        }
      }

      // Update prescription status
      await tx.pharmacistPrescription.update({
        where: { id },
        data: { status: 'DISPENSED' }
      });
    });

    const updated = await prisma.pharmacistPrescription.findUnique({
      where: { id }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('prescription-updated', updated);
      io.emit('pharmacy-stock-updated');
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error dispensing prescription:', error);
    return res.status(500).json({ error: 'Failed to dispense prescription' });
  }
});

// GET /api/pharmacist/inventory
// Fetch all medicines and batches
router.get('/inventory', authenticate, async (req: any, res: any) => {
  try {
    const medicines = await prisma.pharmacyMedicine.findMany({
      orderBy: { name: 'asc' }
    });
    const batches = await prisma.medicineBatch.findMany({
      orderBy: { expiryDate: 'asc' }
    });
    return res.json({ medicines, batches });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/pharmacist/inventory/batch
// Add a new batch to inventory
router.post('/inventory/batch', authenticate, async (req: any, res: any) => {
  try {
    const { medicineId, batchNumber, expiryDate, quantity } = req.body;

    if (!medicineId || !batchNumber || !expiryDate || !quantity) {
      return res.status(400).json({ error: 'All batch details are required' });
    }

    const batch = await prisma.medicineBatch.create({
      data: {
        medicineId,
        batchNumber,
        expiryDate: new Date(expiryDate),
        quantity: parseInt(quantity)
      }
    });

    // Update parent medicine stock
    const dbMed = await prisma.pharmacyMedicine.findUnique({
      where: { id: medicineId }
    });

    if (dbMed) {
      await prisma.pharmacyMedicine.update({
        where: { id: medicineId },
        data: {
          stock: dbMed.stock + parseInt(quantity)
        }
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('pharmacy-stock-updated');
    }

    return res.json(batch);
  } catch (error) {
    console.error('Error adding batch:', error);
    return res.status(500).json({ error: 'Failed to add batch' });
  }
});

// GET /api/pharmacist/suppliers
// Fetch all supplier orders
router.get('/suppliers', authenticate, async (req: any, res: any) => {
  try {
    const orders = await prisma.supplierOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(orders);
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    return res.status(500).json({ error: 'Failed to fetch supplier orders' });
  }
});

// POST /api/pharmacist/suppliers/order
// Create a new order with a supplier
router.post('/suppliers/order', authenticate, async (req: any, res: any) => {
  try {
    const { supplierName, medicineName, quantity } = req.body;

    if (!supplierName || !medicineName || !quantity) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const order = await prisma.supplierOrder.create({
      data: {
        supplierName,
        medicineName,
        quantity: parseInt(quantity),
        status: 'ORDERED'
      }
    });

    return res.json(order);
  } catch (error) {
    console.error('Error placing supplier order:', error);
    return res.status(500).json({ error: 'Failed to place order' });
  }
});

// POST /api/pharmacist/suppliers/order/:id/receive
// Receive ordered inventory and update stock
router.post('/suppliers/order/:id/receive', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const order = await prisma.supplierOrder.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'DELIVERED') {
      return res.status(400).json({ error: 'Order already received' });
    }

    // Process delivery: find medicine, create batch, update status
    await prisma.$transaction(async (tx) => {
      let dbMed = await tx.pharmacyMedicine.findFirst({
        where: {
          name: {
            contains: order.medicineName
          }
        }
      });

      // If medicine doesn't exist, create a default one
      if (!dbMed) {
        dbMed = await tx.pharmacyMedicine.create({
          data: {
            name: order.medicineName,
            genericName: order.medicineName,
            stock: 0,
            minStock: 20,
            price: 50.0,
            isControlled: false,
            genericAlternatives: ''
          }
        });
      }

      // Add a batch for this receipt
      const batchNumber = `B-REC-${order.id.slice(-4).toUpperCase()}`;
      await tx.medicineBatch.create({
        data: {
          medicineId: dbMed.id,
          batchNumber,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          quantity: order.quantity
        }
      });

      // Update stock
      await tx.pharmacyMedicine.update({
        where: { id: dbMed.id },
        data: {
          stock: dbMed.stock + order.quantity
        }
      });

      // Update order status
      await tx.supplierOrder.update({
        where: { id },
        data: { status: 'DELIVERED' }
      });
    });

    const updatedOrder = await prisma.supplierOrder.findUnique({
      where: { id }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('pharmacy-stock-updated');
    }

    return res.json(updatedOrder);
  } catch (error) {
    console.error('Error receiving supplier order:', error);
    return res.status(500).json({ error: 'Failed to receive order' });
  }
});

// GET /api/pharmacist/controlled-logs
// Fetch controlled substances logging entries
router.get('/controlled-logs', authenticate, async (req: any, res: any) => {
  try {
    const logs = await prisma.controlledSubstanceLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(logs);
  } catch (error) {
    console.error('Error fetching controlled logs:', error);
    return res.status(500).json({ error: 'Failed to fetch controlled logs' });
  }
});

export default router;
