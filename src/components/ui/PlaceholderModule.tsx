import React from 'react';

interface PlaceholderModuleProps {
  title: string;
  description: string;
  icon: string;
  features: string[];
}

const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({ title, description, icon, features }) => {
  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-health-blue to-calm-green flex items-center justify-center text-3xl shadow-lg shadow-health-blue/20 mb-6">
          {icon}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400 max-w-2xl text-lg">{description}</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-4xl">
        <h2 className="text-xl font-semibold text-white mb-6">Upcoming Features in this Module</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-gray-950 border border-gray-800 hover:border-health-blue/50 transition-colors">
              <div className="w-6 h-6 rounded-full bg-health-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-health-blue" />
              </div>
              <span className="text-gray-300 font-medium">{feature}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-4">
          <span className="text-2xl"></span>
          <div>
            <h3 className="text-blue-400 font-semibold mb-1">Under Construction</h3>
            <p className="text-blue-200/70 text-sm">This module is currently being developed. Stay tuned for the next update.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderModule;
