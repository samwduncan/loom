import { GitBranch, Key } from 'lucide-react';
import type { SettingsMainTab } from '../types/types';

type SettingsMainTabsProps = {
  activeTab: SettingsMainTab;
  onChange: (tab: SettingsMainTab) => void;
};

type MainTabConfig = {
  id: SettingsMainTab;
  label: string;
  icon?: typeof GitBranch;
};

const TAB_CONFIG: MainTabConfig[] = [
  { id: 'agents', label: 'Agents' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'git', label: 'Git', icon: GitBranch },
  { id: 'api', label: 'API & Tokens', icon: Key },
  { id: 'tasks', label: 'Tasks' },
];

export default function SettingsMainTabs({ activeTab, onChange }: SettingsMainTabsProps) {
  return (
    <div className="border-b border-border">
       <div className="flex px-4 md:px-6" role="tablist" aria-label="Settings">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {Icon && <Icon className="w-4 h-4 inline mr-2" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
