import { MessageSquare, Terminal, Folder, GitBranch, ClipboardCheck, type LucideIcon } from 'lucide-react';
import Tooltip from '../../../Tooltip';
import type { AppTab } from '../../../../types/app';
import type { Dispatch, SetStateAction } from 'react';

type MainContentTabSwitcherProps = {
  activeTab: AppTab;
  setActiveTab: Dispatch<SetStateAction<AppTab>>;
  shouldShowTasksTab: boolean;
};

type TabDefinition = {
  id: AppTab;
  label: string;
  icon: LucideIcon;
};

const BASE_TABS: TabDefinition[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'shell', label: 'Shell', icon: Terminal },
  { id: 'files', label: 'Files', icon: Folder },
  { id: 'git', label: 'Source Control', icon: GitBranch },
];

const TASKS_TAB: TabDefinition = {
  id: 'tasks',
  label: 'Tasks',
  icon: ClipboardCheck,
};

export default function MainContentTabSwitcher({
  activeTab,
  setActiveTab,
  shouldShowTasksTab,
}: MainContentTabSwitcherProps) {
  const tabs = shouldShowTasksTab ? [...BASE_TABS, TASKS_TAB] : BASE_TABS;

  return (
    <div className="inline-flex items-center bg-muted/60 rounded-lg p-[3px] gap-[2px]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;

        return (
          <Tooltip key={tab.id} content={tab.label} position="bottom">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-2.5 py-[5px] text-sm font-medium rounded-md transition-all duration-150 ${
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
