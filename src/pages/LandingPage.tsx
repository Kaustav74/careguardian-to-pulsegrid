// ============================================================
// PULSEGRID — LANDING PAGE
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { ROUTES } from '../constants/routes';

const roles = [
  { icon: '', label: 'Doctors' },
  { icon: '', label: 'Hospitals' },
  { icon: '', label: 'Ambulances' },
  { icon: '', label: 'Pharmacies' },
  { icon: '', label: 'Diagnostics' },
  { icon: '', label: 'Patients' },
  { icon: '', label: 'Families' },
  { icon: '', label: 'Rural Workers' },
];

const features = [
  {
    icon: '',
    title: 'Enterprise RBAC',
    desc: '13 distinct roles with granular permission control at every layer — routes, Firestore, and Cloud Functions.',
  },
  {
    icon: '',
    title: 'Real-Time Infrastructure',
    desc: 'Live notifications, emergency alerts, and ambulance tracking powered by Firestore real-time listeners.',
  },
  {
    icon: '',
    title: 'Multi-Hospital Network',
    desc: 'Manage a national network of hospitals, staff, and resources from a single unified platform.',
  },
  {
    icon: '',
    title: 'Security First',
    desc: 'Firebase App Check, Firestore security rules, server-side RBAC validation, and full audit logging.',
  },
  {
    icon: '',
    title: 'Analytics & Insights',
    desc: 'Role-specific dashboards with KPI widgets, trend analysis, and operational intelligence.',
  },
  {
    icon: '',
    title: 'Emergency Response',
    desc: 'One-tap emergency triggers, automated ambulance dispatch, and real-time responder coordination.',
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-health-blue to-calm-green flex items-center justify-center text-white font-bold text-sm">
            CG
          </div>
          <span className="font-bold text-lg">PulseGrid</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.LOGIN)}>Sign In</Button>
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.REGISTER)}>Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Badge variant="info" className="mb-6">Enterprise Healthcare Platform</Badge>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
          Healthcare
          <span className="block bg-gradient-to-r from-health-blue via-blue-400 to-calm-green bg-clip-text text-transparent">
            Reimagined
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          PulseGrid connects patients, hospitals, doctors, ambulances, pharmacies, and emergency responders
          in one secure, scalable ecosystem — ready for national deployment.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button variant="primary" size="lg" onClick={() => navigate(ROUTES.REGISTER)}>
            Start Free →
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate(ROUTES.LOGIN)}>
            Sign In
          </Button>
        </div>

        {/* Role pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {roles.map((r) => (
            <div key={r.label} className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-4 py-2 rounded-full text-sm">
              <span>{r.icon}</span>
              <span className="text-gray-300">{r.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-3">What We Offer</p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Built for Enterprise Scale</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 hover:border-health-blue/40 transition-all duration-300 group">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-health-blue transition-colors">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem Services */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-800">
        <div className="text-center mb-16">
          <Badge variant="warning" className="mb-3">Integrated Services</Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Complete Healthcare Continuum</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Seamlessly connected services for a unified patient experience.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-gray-600 transition-colors">
            <div className="w-14 h-14 bg-blue-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6"></div>
            <h3 className="text-2xl font-bold mb-3">Find Hospitals</h3>
            <p className="text-gray-400 mb-6">Locate top-rated hospitals near you, view live bed availability, and navigate directly in emergencies.</p>
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.LOGIN)}>Search Network</Button>
          </div>
          
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-gray-600 transition-colors">
            <div className="w-14 h-14 bg-green-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6"></div>
            <h3 className="text-2xl font-bold mb-3">Book Appointments</h3>
            <p className="text-gray-400 mb-6">Schedule in-person or virtual visits with specialists. Instant confirmation and smart reminders.</p>
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.LOGIN)}>Find Doctors</Button>
          </div>
          
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-gray-600 transition-colors">
            <div className="w-14 h-14 bg-purple-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6"></div>
            <h3 className="text-2xl font-bold mb-3">Telemedicine</h3>
            <p className="text-gray-400 mb-6">Consult with doctors via HD video. Securely share reports and receive digital prescriptions instantly.</p>
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.LOGIN)}>Start Consult</Button>
          </div>
        </div>
      </section>

      {/* AI Assistant & Campaigns */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-800 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Badge variant="info" className="mb-4">AI Powered</Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Meet Your AI Health Assistant</h2>
          <p className="text-gray-400 text-lg mb-6">
            Our predictive AI engine triages symptoms, matches you with the right specialists, and continuously monitors your health vitals to flag anomalies before they become critical.
          </p>
          <ul className="space-y-3 mb-8 text-gray-300">
            <li className="flex items-center gap-3"> <span className="text-white">Smart Symptom Checker</span></li>
            <li className="flex items-center gap-3"> <span className="text-white">Predictive Emergency Triage</span></li>
            <li className="flex items-center gap-3"> <span className="text-white">Automated Health Insights</span></li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-health-blue/10 blur-3xl rounded-full"></div>
          <div className="bg-gray-950 rounded-2xl p-4 border border-gray-800 shadow-2xl relative z-10">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-health-blue flex items-center justify-center"></div>
               <div>
                 <p className="font-bold">PulseGrid AI</p>
                 <p className="text-xs text-green-400">Online</p>
               </div>
             </div>
             <div className="space-y-4">
               <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-sm w-3/4 text-sm text-gray-300">
                 Hello! I noticed an anomaly in your recent blood pressure logs. Would you like me to schedule a telehealth check-in with Dr. Smith?
               </div>
               <div className="bg-health-blue p-3 rounded-2xl rounded-tr-sm w-1/2 ml-auto text-sm text-white">
                 Yes, please find the earliest slot tomorrow.
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Subscriptions */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-800 text-center">
        <Badge variant="success" className="mb-4">Care Plans</Badge>
        <h2 className="text-3xl md:text-5xl font-bold mb-12">Healthcare that scales with you</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 text-left">
            <h3 className="text-2xl font-bold mb-2">Basic</h3>
            <p className="text-3xl font-black mb-6">Free</p>
            <ul className="space-y-3 mb-8 text-sm text-gray-400">
              <li>• Profile Creation</li>
              <li>• Appointment Booking</li>
              <li>• Standard SOS</li>
            </ul>
            <Button variant="outline" fullWidth onClick={() => navigate(ROUTES.LOGIN)}>Select Plan</Button>
          </div>
          <div className="bg-gradient-to-b from-health-blue/20 to-gray-900 rounded-3xl p-8 border border-health-blue/50 text-left relative transform scale-105 shadow-2xl shadow-health-blue/10">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-health-blue text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</div>
            <h3 className="text-2xl font-bold mb-2">Premium</h3>
            <p className="text-3xl font-black mb-6">$29<span className="text-sm font-normal text-gray-400">/mo</span></p>
            <ul className="space-y-3 mb-8 text-sm text-gray-300">
              <li>• Priority Ambulance Dispatch</li>
              <li>• Unlimited Telemedicine</li>
              <li>• AI Health Monitoring</li>
              <li>• Dedicated Care Coordinator</li>
            </ul>
            <Button variant="primary" fullWidth onClick={() => navigate(ROUTES.LOGIN)}>Upgrade to Premium</Button>
          </div>
          <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 text-left">
            <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
            <p className="text-3xl font-black mb-6">Custom</p>
            <ul className="space-y-3 mb-8 text-sm text-gray-400">
              <li>• Multi-Hospital Network Management</li>
              <li>• Full White-labeling</li>
              <li>• Nationwide Analytics</li>
            </ul>
            <Button variant="outline" fullWidth onClick={() => navigate(ROUTES.LOGIN)}>Contact Sales</Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-br from-health-blue/20 to-calm-green/10 border border-health-blue/30 rounded-3xl p-10">
          <h2 className="text-3xl font-bold mb-4">Ready to transform healthcare?</h2>
          <p className="text-gray-400 mb-8">Join thousands of healthcare professionals on PulseGrid.</p>
          <Button variant="primary" size="lg" onClick={() => navigate(ROUTES.REGISTER)} fullWidth>
            Create Your Account →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-health-blue to-calm-green flex items-center justify-center text-white font-bold text-sm">
                CG
              </div>
              <span className="font-bold text-lg">PulseGrid</span>
            </div>
            <p className="text-sm text-gray-400">The first intelligent, unified operating system for national healthcare networks.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">For Hospitals</a></li>
              <li><a href="#" className="hover:text-white transition-colors">For Doctors</a></li>
              <li><a href="#" className="hover:text-white transition-colors">For Patients</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Emergency Network</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Health Campaigns</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
              <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center border-t border-gray-800 pt-8">
          <p className="text-gray-500 text-sm">© 2026 PulseGrid. Enterprise Healthcare Platform.</p>
        </div>
      </footer>

      {/* Floating Emergency SOS */}
      <button 
        onClick={() => navigate(ROUTES.PATIENT_EMERGENCY)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center text-3xl transition-transform hover:scale-110 active:scale-95 z-50 animate-pulse"
        title="Emergency SOS"
      >
        
      </button>
    </div>
  );
};

export default LandingPage;
