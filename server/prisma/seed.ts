import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning existing database entries...');
  // Clear existing profiles to ensure clean seed
  await prisma.patientProfile.deleteMany({});
  await prisma.doctorProfile.deleteMany({});
  await prisma.hospitalAdminProfile.deleteMany({});
  await prisma.ambulanceDriverProfile.deleteMany({});
  await prisma.emergencyRequest.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.wardBedAllocation.deleteMany({});
  await prisma.nurseCareItem.deleteMany({});
  await prisma.clinicalAlert.deleteMany({});
  await prisma.shiftHandoverReport.deleteMany({});
  await prisma.pharmacyMedicine.deleteMany({});
  await prisma.medicineBatch.deleteMany({});
  await prisma.pharmacistPrescription.deleteMany({});
  await prisma.supplierOrder.deleteMany({});
  await prisma.controlledSubstanceLog.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding database with Indian medical registries...');
  const password = await bcrypt.hash('password123', 10);

  // 1. Super Admin
  await prisma.user.create({
    data: {
      email: 'superadmin@pulsegrid.com',
      password,
      roleId: 'superAdmin',
      status: 'APPROVED',
      superAdminProfile: {
        create: {
          fullName: 'System Administrator',
          organizationEmail: 'admin@pulsegrid.com',
          mfaSetup: false,
        }
      }
    }
  });
  console.log('Created Super Admin');

  // 2. Hospital Admin (AIIMS New Delhi)
  await prisma.user.create({
    data: {
      email: 'hospitaladmin@pulsegrid.com',
      password,
      roleId: 'hospitalAdmin',
      status: 'APPROVED',
      hospitalAdminProfile: {
        create: {
          fullName: 'Dr. Gregory House',
          phone: '9999901010',
          hospitalName: 'All India Institute of Medical Sciences (AIIMS)',
          hospitalRegNumber: 'REG-987654321',
          hospitalType: 'Public',
          numberOfBeds: 500,
          icuCapacity: 50,
          address: 'Ansari Nagar, New Delhi, Delhi, India',
        }
      }
    }
  });
  console.log('Created Hospital Admin (AIIMS)');

  // 3. Doctor (Delhi Cardiac Specialist)
  await prisma.user.create({
    data: {
      email: 'doctor@pulsegrid.com',
      password,
      roleId: 'doctor',
      status: 'APPROVED',
      doctorProfile: {
        create: {
          fullName: 'Dr. Meredith Grey',
          gender: 'female',
          dob: new Date('1980-05-15'),
          phone: '9999902020',
          medicalLicenseNumber: 'MED-112233',
          specialization: 'General Surgery',
          yearsOfExperience: 15,
          qualifications: 'MD, FACS',
          medicalCouncilReg: 'MCR-445566',
          consultationFees: 150.0,
        }
      }
    }
  });
  console.log('Created Doctor');

  // 4. Patients seeded across Delhi, Mumbai, and Bangalore with realistic Indian diseases/symptoms
  const patientsData = [
    {
      email: 'delhi.patient1@pulsegrid.com',
      fullName: 'Aarav Sharma',
      phone: '9999903001',
      city: 'New Delhi',
      state: 'Delhi',
      address: 'Connaught Place, New Delhi',
      pinCode: '110001',
      existingConditions: 'Chronic Asthma, Bronchitis (Delhi Air Quality Vulnerability)',
      allergies: 'Severe Dust and Particulate Matter PM2.5'
    },
    {
      email: 'delhi.patient2@pulsegrid.com',
      fullName: 'Priya Patel',
      phone: '9999903002',
      city: 'New Delhi',
      state: 'Delhi',
      address: 'Saket, New Delhi',
      pinCode: '110017',
      existingConditions: 'Dengue Fever Cluster, High Fever',
      allergies: 'None'
    },
    {
      email: 'mumbai.patient1@pulsegrid.com',
      fullName: 'Rohan Mehta',
      phone: '9999903003',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Andheri West, Mumbai',
      pinCode: '400053',
      existingConditions: 'Acute Gastro-Enteritis (Monsoon Exposure)',
      allergies: 'Sulfa Drugs'
    },
    {
      email: 'mumbai.patient2@pulsegrid.com',
      fullName: 'Ananya Deshmukh',
      phone: '9999903004',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Dadar, Mumbai',
      pinCode: '400014',
      existingConditions: 'Hypertension, Coronary Heart Disease',
      allergies: 'Penicillin'
    },
    {
      email: 'bangalore.patient1@pulsegrid.com',
      fullName: 'Rahul Nair',
      phone: '9999903005',
      city: 'Bangalore',
      state: 'Karnataka',
      address: 'Indiranagar, Bangalore',
      pinCode: '560038',
      existingConditions: 'Aero-Allergen Allergy, Allergic Rhinitis (Pollen Cluster)',
      allergies: 'Parthenium Pollen, Dust Mites'
    }
  ];

  for (const p of patientsData) {
    await prisma.user.create({
      data: {
        email: p.email,
        password,
        roleId: 'patient',
        status: 'APPROVED',
        patientProfile: {
          create: {
            fullName: p.fullName,
            dob: new Date('1992-04-12'),
            gender: 'male',
            bloodGroup: 'B+',
            phone: p.phone,
            country: 'India',
            state: p.state,
            city: p.city,
            address: p.address,
            pinCode: p.pinCode,
            existingConditions: p.existingConditions,
            allergies: p.allergies,
            consentGiven: true
          }
        }
      }
    });
  }
  console.log('Seeded 5 Patients across Delhi, Maharashtra, and Karnataka.');

  // 5. Ambulance Driver
  await prisma.user.create({
    data: {
      email: 'ambulance@pulsegrid.com',
      password,
      roleId: 'ambulanceDriver',
      status: 'APPROVED',
      ambulanceDriverProfile: {
        create: {
          fullName: 'Sarah Connor',
          phone: '9999904040',
          dob: new Date('1985-08-20'),
          gender: 'female',
          ambulanceRegNumber: 'DL-1C-AB-1234',
          vehicleType: 'Advanced Life Support',
          licenseNumber: 'DL-998877',
          drivingExperience: 10,
        }
      }
    }
  });
  // 6. Family Member (Linked to Aarav Sharma & Priya Patel)
  const aarav = await prisma.user.findFirst({
    where: { email: 'delhi.patient1@pulsegrid.com' },
    include: { patientProfile: true }
  });
  
  const priya = await prisma.user.findFirst({
    where: { email: 'delhi.patient2@pulsegrid.com' },
    include: { patientProfile: true }
  });

  if (aarav?.patientProfile && priya?.patientProfile) {
    const linkedIds = `${aarav.patientProfile.id},${priya.patientProfile.id}`;
    
    await prisma.user.create({
      data: {
        email: 'family@pulsegrid.com',
        password,
        roleId: 'familyMember',
        status: 'APPROVED',
        familyMemberProfile: {
          create: {
            fullName: 'Rahul Sharma',
            relationship: 'Son/Father',
            phone: '9999905050',
            linkedPatientIds: linkedIds,
            emergencyAccess: true,
            viewReports: true,
            viewPrescriptions: true,
            receiveAlerts: true,
            appointmentAccess: true,
          }
        }
      }
    });
    console.log('Created Family Member linked to Aarav Sharma and Priya Patel');
  }

  // 7. Nurse carol@pulsegrid.com
  await prisma.user.create({
    data: {
      email: 'nurse@pulsegrid.com',
      password,
      roleId: 'nurse',
      status: 'APPROVED',
      nurseProfile: {
        create: {
          fullName: 'Carol Hathaway',
          phone: '9999906060',
          gender: 'female',
          dob: new Date('1988-11-20'),
          nursingLicenseNumber: 'NUR-778899',
          experience: 8,
          assignedHospital: 'All India Institute of Medical Sciences (AIIMS)',
          department: 'ICU'
        }
      }
    }
  });
  console.log('Created Nurse Carol Hathaway');

  // 8. Seed Ward Bed Allocations
  await prisma.wardBedAllocation.createMany({
    data: [
      { wardName: 'Intensive Care Unit (ICU)', bedNumber: 'ICU-Bed-01', patientId: 'delhi.patient1', patientName: 'Aarav Sharma', status: 'OCCUPIED', heartRate: 92, bloodPressure: '135/85', spo2: 94, temperature: 99.1 },
      { wardName: 'Intensive Care Unit (ICU)', bedNumber: 'ICU-Bed-02', patientId: 'delhi.patient2', patientName: 'Priya Patel', status: 'OCCUPIED', heartRate: 104, bloodPressure: '110/70', spo2: 97, temperature: 101.4 },
      { wardName: 'Intensive Care Unit (ICU)', bedNumber: 'ICU-Bed-03', status: 'VACANT', heartRate: 0, bloodPressure: '-', spo2: 0, temperature: 0.0 },
      { wardName: 'General Ward A', bedNumber: 'GW-Bed-101', patientId: 'mumbai.patient1', patientName: 'Rohan Mehta', status: 'OCCUPIED', heartRate: 80, bloodPressure: '120/80', spo2: 98, temperature: 98.6 },
      { wardName: 'General Ward A', bedNumber: 'GW-Bed-102', status: 'VACANT', heartRate: 0, bloodPressure: '-', spo2: 0, temperature: 0.0 },
      { wardName: 'General Ward A', bedNumber: 'GW-Bed-103', status: 'VACANT', heartRate: 0, bloodPressure: '-', spo2: 0, temperature: 0.0 }
    ]
  });
  console.log('Seeded Ward Bed Allocations');

  // 9. Seed Daily Care Checklist Timeline
  await prisma.nurseCareItem.createMany({
    data: [
      { patientName: 'Aarav Sharma', category: 'Medication', title: 'IV Ceftriaxone 1g', scheduledTime: '08:00', route: 'IV', status: 'COMPLETED' },
      { patientName: 'Aarav Sharma', category: 'Medication', title: 'Nebulization (Budecort)', scheduledTime: '14:00', route: 'Inhalation', status: 'COMPLETED' },
      { patientName: 'Aarav Sharma', category: 'Medication', title: 'IV Paracetamol 1g', scheduledTime: '22:00', route: 'IV', status: 'PENDING' },
      { patientName: 'Priya Patel', category: 'Medication', title: 'IV Fluids (NS 500ml)', scheduledTime: '12:00', route: 'IV', status: 'COMPLETED' },
      { patientName: 'Priya Patel', category: 'Medication', title: 'PCM 650mg Oral', scheduledTime: '18:00', route: 'Oral', status: 'COMPLETED' },
      { patientName: 'Priya Patel', category: 'Medication', title: 'IV Ceftriaxone 1g', scheduledTime: '23:00', route: 'IV', status: 'PENDING' },
      { patientName: 'Aarav Sharma', category: 'Task', title: 'Check SpO2 & Respiratory Rate', scheduledTime: '21:30', route: 'N/A', status: 'PENDING' },
      { patientName: 'Rohan Mehta', category: 'Task', title: 'Monitor Temperature Hourly', scheduledTime: '22:30', route: 'N/A', status: 'PENDING' }
    ]
  });
  console.log('Seeded Nurse Daily Care Checklist items');

  // 10. Seed Clinical Alerts
  await prisma.clinicalAlert.createMany({
    data: [
      { patientName: 'Aarav Sharma', doctorName: 'Dr. Meredith Grey', instruction: 'Start IV Paracetamol 1g if temperature exceeds 100°F. Keep SpO2 above 92%.', priority: 'HIGH', status: 'PENDING' },
      { patientName: 'Priya Patel', doctorName: 'Dr. Meredith Grey', instruction: 'URGENT: Infuse IV Fluids 100ml/hr. Repeat Complete Blood Count (CBC) at 6 AM.', priority: 'CRITICAL', status: 'PENDING' },
      { patientName: 'Rohan Mehta', doctorName: 'Dr. Meredith Grey', instruction: 'Monitor fluid balance charts. Report if urine output drops below 30ml/hr.', priority: 'MEDIUM', status: 'PENDING' }
    ]
  });
  console.log('Seeded Clinical Alerts & Doctor Instructions');

  // 11. Seed Pharmacist Account
  await prisma.user.create({
    data: {
      email: 'pharmacist@pulsegrid.com',
      password,
      roleId: 'pharmacist',
      status: 'APPROVED',
      pharmacistProfile: {
        create: {
          fullName: 'Albert Hofmann',
          phone: '9999907070',
          pharmacyLicenseNum: 'PHAR-112233',
          pharmacyName: 'PulseGrid AIIMS Pharmacy',
          experience: 12,
          linkedHospital: 'All India Institute of Medical Sciences (AIIMS)'
        }
      }
    }
  });
  console.log('Created Pharmacist Albert Hofmann');

  // 12. Seed Pharmacy Medicines
  const meds = [
    { name: 'Paracetamol 650mg', genericName: 'Paracetamol', stock: 500, minStock: 100, price: 12.5, isControlled: false, genericAlternatives: 'Calpol 650mg, Dolo 650mg' },
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', stock: 150, minStock: 50, price: 45.0, isControlled: false, genericAlternatives: 'Mox 500mg, Novamox 500mg' },
    { name: 'Morphine Sulfate 10mg/mL', genericName: 'Morphine', stock: 18, minStock: 15, price: 180.0, isControlled: true, genericAlternatives: 'Duramorph, Infumorph' },
    { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin', stock: 45, minStock: 80, price: 32.0, isControlled: false, genericAlternatives: 'Lipitor 10mg, Storvas 10mg' } // Low stock
  ];

  for (const m of meds) {
    const med = await prisma.pharmacyMedicine.create({
      data: m
    });

    // Seed 2 batches for each medicine
    await prisma.medicineBatch.createMany({
      data: [
        {
          medicineId: med.id,
          batchNumber: `B-${med.name.slice(0, 3).toUpperCase()}-101`,
          expiryDate: new Date('2026-12-31'),
          quantity: Math.floor(med.stock * 0.6)
        },
        {
          medicineId: med.id,
          batchNumber: `B-${med.name.slice(0, 3).toUpperCase()}-102`,
          expiryDate: new Date('2027-06-30'),
          quantity: Math.ceil(med.stock * 0.4)
        }
      ]
    });
  }
  console.log('Seeded Pharmacy Medicines and Batches');

  // 13. Seed Pharmacist Prescriptions
  await prisma.pharmacistPrescription.createMany({
    data: [
      {
        patientName: 'Aarav Sharma',
        doctorName: 'Dr. Meredith Grey',
        medicines: JSON.stringify([
          { name: 'Paracetamol 650mg', dosage: '1 tablet', frequency: 'TID', genericAlternative: 'Dolo 650mg', interactionWarnings: 'None', isControlled: false },
          { name: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'BID', genericAlternative: 'Mox 500mg', interactionWarnings: 'None', isControlled: false }
        ]),
        counselingNotes: 'Take after meals. Complete the full antibiotic course.',
        status: 'PENDING'
      },
      {
        patientName: 'Priya Patel',
        doctorName: 'Dr. Gregory House',
        medicines: JSON.stringify([
          { name: 'Morphine Sulfate 10mg/mL', dosage: '2mL', frequency: 'PRN', genericAlternative: 'Duramorph', interactionWarnings: 'Potential respiratory depression. Avoid alcohol or sedatives.', isControlled: true }
        ]),
        counselingNotes: 'Controlled substance. Monitor respirations closely.',
        status: 'PENDING'
      },
      {
        patientName: 'Rohan Mehta',
        doctorName: 'Dr. Meredith Grey',
        medicines: JSON.stringify([
          { name: 'Atorvastatin 10mg', dosage: '1 tablet', frequency: 'OD', genericAlternative: 'Lipitor 10mg', interactionWarnings: 'None', isControlled: false }
        ]),
        counselingNotes: 'Take at night. Report any muscle pain.',
        status: 'DISPENSED'
      }
    ]
  });
  console.log('Seeded Pharmacist Prescriptions');

  // 14. Seed Supplier Orders
  await prisma.supplierOrder.createMany({
    data: [
      { supplierName: 'AstraMed Distributors', medicineName: 'Atorvastatin 10mg', quantity: 200, status: 'ORDERED' },
      { supplierName: 'Cipla Wholesale Delhi', medicineName: 'Paracetamol 650mg', quantity: 1000, status: 'DELIVERED' }
    ]
  });
  console.log('Seeded Supplier Orders');

  // 15. Seed Controlled Substance Logs
  await prisma.controlledSubstanceLog.createMany({
    data: [
      { medicineName: 'Morphine Sulfate 10mg/mL', patientName: 'John Doe', quantity: 5, pharmacistName: 'Albert Hofmann', action: 'DISPENSED' },
      { medicineName: 'Morphine Sulfate 10mg/mL', patientName: 'System restock', quantity: 20, pharmacistName: 'Albert Hofmann', action: 'RESTOCKED' }
    ]
  });
  console.log('Seeded Controlled Substance Logs');

  console.log('Database seeding completed successfully. All passwords are "password123".');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
