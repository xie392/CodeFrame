import React, { useState } from 'react';
import {
  Scissors,
  Eye,
  FileText,
  Monitor,
  Timer,
  Moon,
  Settings,
} from 'lucide-react';

type TabType = 'screenshot' | 'code' | 'local';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="card w-[100px] h-[80px] flex flex-col items-center justify-center gap-2 cursor-pointer"
  >
    <span className="text-primary">{icon}</span>
    <span className="text-xs text-text-secondary font-medium font-body">
      {label}
    </span>
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('screenshot');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'screenshot', label: 'Screenshot' },
    { id: 'code', label: 'Code' },
    { id: 'local', label: 'Local' },
  ];

  return (
    <div className="w-[360px] h-[500px] bg-bg-primary text-text-primary font-body flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-heading font-bold text-sm">CF</span>
          </div>
          <span className="text-lg font-heading font-semibold">CodeFrame</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all duration-200 cursor-pointer">
            <Moon size={16} />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-all duration-200 cursor-pointer">
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="flex items-center gap-1 px-4 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn px-4 py-2 text-sm ${
              activeTab === tab.id
                ? 'btn-primary'
                : 'btn-secondary text-text-tertiary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <main className="flex-1 p-4 flex flex-col gap-3">
        {/* First Row - 3 buttons */}
        <div className="flex gap-3">
          <ActionButton
            icon={<Scissors size={20} />}
            label="Region"
            onClick={() => console.log('region capture')}
          />
          <ActionButton
            icon={<Eye size={20} />}
            label="Visible"
            onClick={() => console.log('visible capture')}
          />
          <ActionButton
            icon={<FileText size={20} />}
            label="Full Page"
            onClick={() => console.log('fullpage capture')}
          />
        </div>

        {/* Second Row - 2 buttons */}
        <div className="flex gap-3">
          <ActionButton
            icon={<Monitor size={20} />}
            label="Desktop"
            onClick={() => console.log('desktop capture')}
          />
          <ActionButton
            icon={<Timer size={20} />}
            label="Delayed"
            onClick={() => console.log('delayed capture')}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-4 p-4 card">
          <p className="text-xs text-text-muted font-body">
            Quick tip: Use keyboard shortcuts for faster access
          </p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded bg-bg-secondary text-text-secondary font-heading">
              ⌘ ⇧ S
            </span>
            <span className="text-xs text-text-tertiary">Capture</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center h-10 border-t border-border-light">
        <span className="text-xs text-text-muted font-body">
          Made with ❤️ for developers
        </span>
      </footer>
    </div>
  );
};

export default App;
