// ============================================================
// PULSEGRID — UI: TABS COMPONENT
// ============================================================
import React, { useState } from 'react';
import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    onChange?.(id);
  };

  return (
    <div>
      <div className="flex space-x-1 border-b border-gray-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={clsx(
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
                isActive
                  ? 'border-health-blue text-health-blue'
                  : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="pt-4">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default Tabs;
