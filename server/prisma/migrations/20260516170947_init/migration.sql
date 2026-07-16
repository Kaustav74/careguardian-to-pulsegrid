-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "phone" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "existingConditions" TEXT,
    "allergies" TEXT,
    "currentMedications" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "insuranceProvider" TEXT,
    "insuranceId" TEXT,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "familyMembersLinked" BOOLEAN NOT NULL DEFAULT false,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FamilyMemberProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "linkedPatientId" TEXT,
    "emergencyAccess" BOOLEAN NOT NULL DEFAULT false,
    "viewReports" BOOLEAN NOT NULL DEFAULT false,
    "viewPrescriptions" BOOLEAN NOT NULL DEFAULT false,
    "receiveAlerts" BOOLEAN NOT NULL DEFAULT false,
    "appointmentAccess" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FamilyMemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "gender" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "phone" TEXT NOT NULL,
    "medicalLicenseNumber" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "yearsOfExperience" INTEGER NOT NULL,
    "qualifications" TEXT NOT NULL,
    "medicalCouncilReg" TEXT NOT NULL,
    "hospitalAffiliation" TEXT,
    "consultationFees" REAL,
    "availableDays" TEXT,
    "availableTimeSlots" TEXT,
    "telemedicine" BOOLEAN NOT NULL DEFAULT false,
    "licenseUpload" TEXT,
    "degreeCertificate" TEXT,
    "govtIdProof" TEXT,
    CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NurseProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "nursingLicenseNumber" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "assignedHospital" TEXT,
    "department" TEXT,
    "licenseCertificate" TEXT,
    "govtIdProof" TEXT,
    CONSTRAINT "NurseProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HospitalAdminProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "hospitalRegNumber" TEXT NOT NULL,
    "hospitalType" TEXT NOT NULL,
    "numberOfBeds" INTEGER NOT NULL,
    "icuCapacity" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "hospitalLicense" TEXT,
    "accreditationDocs" TEXT,
    "gstTaxDocs" TEXT,
    "requestedPermissions" TEXT,
    "staffCapacity" INTEGER,
    CONSTRAINT "HospitalAdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SuperAdminProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "organizationEmail" TEXT NOT NULL,
    "masterAccessKey" TEXT,
    "mfaSetup" BOOLEAN NOT NULL DEFAULT false,
    "securityQuestions" TEXT,
    CONSTRAINT "SuperAdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AmbulanceDriverProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "ambulanceRegNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "drivingExperience" INTEGER NOT NULL,
    "drivingLicenseUpload" TEXT,
    "emergencyCert" TEXT,
    "govtIdProof" TEXT,
    "gpsPermission" BOOLEAN NOT NULL DEFAULT false,
    "deviceRegistration" TEXT,
    CONSTRAINT "AmbulanceDriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PharmacistProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pharmacyLicenseNum" TEXT NOT NULL,
    "pharmacyName" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "linkedHospital" TEXT,
    "pharmacyLicense" TEXT,
    "idProof" TEXT,
    CONSTRAINT "PharmacistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiagnosticStaffProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "labCertification" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "diagnosticCenterName" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "certDocuments" TEXT,
    "govtIdProof" TEXT,
    CONSTRAINT "DiagnosticStaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RuralVolunteerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "villageArea" TEXT NOT NULL,
    "healthcareExperience" INTEGER NOT NULL,
    "languagesSpoken" TEXT,
    "availability" TEXT,
    "ngoAssociation" TEXT,
    "identityProof" TEXT,
    "recommendationLetter" TEXT,
    CONSTRAINT "RuralVolunteerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmergencyOperatorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "emergencyCenter" TEXT NOT NULL,
    "shiftTiming" TEXT NOT NULL,
    "regionAllocation" TEXT NOT NULL,
    "emergencyCert" TEXT,
    "idVerification" TEXT,
    CONSTRAINT "EmergencyOperatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NetworkAdminProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "healthcareNetworkName" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "hospitalAccessScope" TEXT,
    "analyticsAccess" BOOLEAN NOT NULL DEFAULT false,
    "operationalAccess" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "NetworkAdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMemberProfile_userId_key" ON "FamilyMemberProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "DoctorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NurseProfile_userId_key" ON "NurseProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalAdminProfile_userId_key" ON "HospitalAdminProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminProfile_userId_key" ON "SuperAdminProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AmbulanceDriverProfile_userId_key" ON "AmbulanceDriverProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PharmacistProfile_userId_key" ON "PharmacistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticStaffProfile_userId_key" ON "DiagnosticStaffProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RuralVolunteerProfile_userId_key" ON "RuralVolunteerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyOperatorProfile_userId_key" ON "EmergencyOperatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkAdminProfile_userId_key" ON "NetworkAdminProfile"("userId");
