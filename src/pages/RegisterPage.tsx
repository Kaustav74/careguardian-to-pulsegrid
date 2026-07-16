// ============================================================
// PULSEGRID — REGISTER PAGE (ROLE-SPECIFIC WIZARD)
// ============================================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { ROUTES } from '../constants/routes';
import { registerWithRole } from '../services/authService';
import { ROLES } from '../permissions/roles';

// List of public registration roles
const publicRoles = [
  { id: 'patient', icon: '', label: 'Patient', desc: 'Manage your health records' },
  { id: 'familyMember', icon: '', label: 'Family Member', desc: 'Connect to a patient' },
  { id: 'doctor', icon: '', label: 'Doctor', desc: 'Provide medical care' },
  { id: 'nurse', icon: '', label: 'Nurse', desc: 'Patient care & monitoring' },
  { id: 'hospitalAdmin', icon: '', label: 'Hospital Admin', desc: 'Manage facility operations' },
  { id: 'ambulanceDriver', icon: '', label: 'Ambulance', desc: 'Emergency transport' },
  { id: 'pharmacist', icon: '', label: 'Pharmacist', desc: 'Dispense medications' },
  { id: 'diagnosticStaff', icon: '', label: 'Diagnostics', desc: 'Lab & imaging' },
  { id: 'ruralVolunteer', icon: '', label: 'Rural Volunteer', desc: 'Last-mile healthcare' },
  { id: 'emergencyOperator', icon: '', label: 'Emergency Operator', desc: 'Dispatch & response' },
  { id: 'networkAdmin', icon: '', label: 'Network Admin', desc: 'Manage multiple hospitals' },
  // superAdmin is excluded from public registration
];

const RegisterPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      formData.append('roleId', selectedRole!); // Inject the selected role

      const { status } = await registerWithRole(formData);
      
      if (status === 'APPROVED') {
        navigate(ROUTES.LOGIN); // Auto-approved, go login
      } else {
        setSuccess(true); // Pending approval state
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center animate-slide-in-up">
          <div className="text-6xl mb-6"></div>
          <h1 className="text-2xl font-bold text-white mb-3">Registration Successful</h1>
          <p className="text-gray-400 mb-6">
            Your application is pending administrator review. You will be notified once your account and documents are verified.
          </p>
          <Button variant="primary" onClick={() => navigate(ROUTES.LOGIN)} fullWidth>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  // --- Step 1: Role Selection ---
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex flex-col items-center">
        <div className="text-center mb-8 max-w-2xl mt-12 animate-slide-in-up">
          <h1 className="text-3xl font-bold text-white">How are you joining PulseGrid?</h1>
          <p className="text-gray-400 mt-2">Select your role to view the required registration form.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl w-full animate-slide-in-up">
          {publicRoles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 cursor-pointer hover:border-health-blue transition-all group"
            >
              <div className="text-3xl mb-3">{role.icon}</div>
              <h3 className="text-lg font-semibold text-white group-hover:text-health-blue transition-colors">{role.label}</h3>
              <p className="text-sm text-gray-400">{role.desc}</p>
            </div>
          ))}
        </div>
        
        <p className="text-center text-sm text-gray-500 mt-10">
          Already have an account? <Link to={ROUTES.LOGIN} className="text-health-blue hover:text-blue-400 font-medium">Sign in here</Link>
        </p>
      </div>
    );
  }

  // --- Step 2: Role-Specific Form ---
  const roleDef = ROLES[selectedRole as keyof typeof ROLES];

  return (
    <div className="min-h-screen bg-gray-950 p-6 flex flex-col items-center pb-20">
      <div className="w-full max-w-3xl animate-slide-in-up">
        <button onClick={() => setSelectedRole(null)} className="text-sm text-gray-400 hover:text-white mb-6">
          ← Back to Role Selection
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">{roleDef?.label} Registration</h1>
          <p className="text-gray-400 mt-1">Please fill in all required fields and upload requested documents.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
          {error && <Alert variant="error" message={error} className="mb-6" dismissible />}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- Universal Core Fields --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h3 className="text-white font-semibold border-b border-gray-800 pb-2 mb-4">Account Information</h3>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email Address *</label>
                <input name="email" type="email" required className="input" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Password *</label>
                <input name="password" type="password" required className="input" placeholder="••••••••" minLength={8} />
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-white font-semibold border-b border-gray-800 pb-2 mb-4 mt-4">Personal Details</h3>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Full Name *</label>
                <input name="fullName" type="text" required className="input" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number *</label>
                <input name="phone" type="tel" required className="input" placeholder="+1 234 567 8900" />
              </div>
            </div>

            {/* --- Conditional Role Fields --- */}
            
            {/* PATIENT */}
            {selectedRole === 'patient' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Date of Birth *</label>
                  <input name="dob" type="date" required className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Gender *</label>
                  <select name="gender" required className="input"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Blood Group</label>
                  <input name="bloodGroup" type="text" className="input" placeholder="O+" />
                </div>
                
                <div className="md:col-span-2 mt-4"><h3 className="text-white font-semibold border-b border-gray-800 pb-2 mb-2">Medical History</h3></div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Existing Conditions</label>
                  <textarea name="existingConditions" className="input min-h-[80px]" placeholder="Diabetes, Hypertension..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Allergies</label>
                  <input name="allergies" type="text" className="input" placeholder="Peanuts, Penicillin..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Current Medications</label>
                  <input name="currentMedications" type="text" className="input" placeholder="List medications" />
                </div>

                <div className="md:col-span-2 mt-4"><h3 className="text-white font-semibold border-b border-gray-800 pb-2 mb-2">Address</h3></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Country *</label><input name="country" required type="text" className="input" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">State *</label><input name="state" required type="text" className="input" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">City *</label><input name="city" required type="text" className="input" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">PIN Code *</label><input name="pinCode" required type="text" className="input" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Full Address *</label><input name="address" required type="text" className="input" /></div>

                <div className="md:col-span-2 mt-4">
                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer">
                    <input name="consentGiven" type="checkbox" value="true" required className="w-5 h-5 accent-health-blue" />
                    <span className="text-sm text-gray-300">I agree to the Terms & Conditions and consent to medical data processing. *</span>
                  </label>
                </div>
              </div>
            )}

            {/* DOCTOR */}
            {selectedRole === 'doctor' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Date of Birth *</label><input name="dob" type="date" required className="input" /></div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Gender *</label>
                  <select name="gender" required className="input"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
                </div>

                <div className="md:col-span-2 mt-4"><h3 className="text-white font-semibold border-b border-gray-800 pb-2 mb-2">Professional Credentials</h3></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Medical License Number *</label><input name="medicalLicenseNumber" required type="text" className="input" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Medical Council Registration *</label><input name="medicalCouncilReg" required type="text" className="input" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Specialization *</label><input name="specialization" required type="text" className="input" placeholder="e.g. Cardiology" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Years of Experience *</label><input name="yearsOfExperience" required type="number" className="input" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Qualifications *</label><input name="qualifications" required type="text" className="input" placeholder="MBBS, MD..." /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Hospital Affiliation</label><input name="hospitalAffiliation" type="text" className="input" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Consultation Fee ($)</label><input name="consultationFees" type="number" className="input" /></div>

                <div className="md:col-span-2 mt-4"><h3 className="text-white font-semibold border-b border-gray-800 pb-2 mb-2">Verification Documents (Required)</h3></div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">License Certificate (PDF/Image) *</label>
                  <input name="licenseUpload" type="file" required className="input p-2 bg-gray-800" accept=".pdf,image/*" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Degree Certificate (PDF/Image) *</label>
                  <input name="degreeCertificate" type="file" required className="input p-2 bg-gray-800" accept=".pdf,image/*" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Government ID Proof *</label>
                  <input name="govtIdProof" type="file" required className="input p-2 bg-gray-800" accept=".pdf,image/*" />
                </div>
              </div>
            )}

            {/* HOSPITAL ADMIN */}
            {selectedRole === 'hospitalAdmin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 mt-4"><h3 className="text-white font-semibold border-b border-gray-800 pb-2 mb-2">Hospital Information</h3></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Hospital Name *</label><input name="hospitalName" required type="text" className="input" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Hospital Registration Number *</label><input name="hospitalRegNumber" required type="text" className="input" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Hospital Type *</label><input name="hospitalType" required type="text" className="input" placeholder="Public, Private, Clinic" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">Number of Beds *</label><input name="numberOfBeds" required type="number" className="input" /></div>
                <div><label className="block text-xs font-medium text-gray-400 mb-1">ICU Capacity *</label><input name="icuCapacity" required type="number" className="input" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1">Complete Address *</label><textarea name="address" required className="input min-h-[80px]" /></div>

                <div className="md:col-span-2 mt-4"><h3 className="text-white font-semibold border-b border-gray-800 pb-2 mb-2">Accreditation Uploads</h3></div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Hospital License *</label>
                  <input name="hospitalLicense" type="file" required className="input p-2 bg-gray-800" accept=".pdf,image/*" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">GST / Tax Documents *</label>
                  <input name="gstTaxDocs" type="file" required className="input p-2 bg-gray-800" accept=".pdf,image/*" />
                </div>
              </div>
            )}

            {/* Note: In a full production app, you would add similar blocks for all 12 roles. 
                They map directly to the Prisma schema generated earlier. */}
            {!['patient', 'doctor', 'hospitalAdmin'].includes(selectedRole) && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mt-4">
                <p className="text-yellow-400 text-sm">
                  <b>Note:</b> You have selected {roleDef?.label}. The basic fields above are recorded.
                  Specific accreditation fields for this role will be required during onboarding.
                </p>
              </div>
            )}

            <div className="pt-6 border-t border-gray-800 mt-8">
              <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
                Submit Registration
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
