/**
 * SettingsModal -- Full-screen dialog with 5-tab navigation for all settings.
 *
 * Opens when modalState.type === 'settings'. Uses existing Dialog component
 * with wider max-width. Each tab shows a loading skeleton placeholder
 * (actual tab content will be added in Plans 02 and 03).
 *
 * Constitution: Named export (2.2), selector-only store access (4.2),
 * cn() for classes (3.6), no default export.
 */

import { useUIStore } from '@/stores/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentsTab } from './AgentsTab';
import { ApiKeysTab } from './ApiKeysTab';
import { AppearanceTab } from './AppearanceTab';
import { GitTab } from './GitTab';
import { McpTab } from './McpTab';
import type { SettingsTabId } from '@/types/settings';

const SETTINGS_TABS: { id: SettingsTabId; label: string }[] = [
  { id: 'agents', label: 'Agents' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'git', label: 'Git' },
  { id: 'mcp', label: 'MCP' },
];

export function SettingsModal() {
  const modalState = useUIStore((state) => state.modalState);
  const closeModal = useUIStore((state) => state.closeModal);

  const isOpen = modalState?.type === 'settings';
  const initialTab = (modalState?.type === 'settings' && modalState.initialTab) || 'agents';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent
        className="sm:max-w-3xl max-h-[85vh] flex flex-col"
        aria-describedby={undefined}
        data-testid="settings-modal"
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={initialTab} key={initialTab} className="flex-1 min-h-0">
          <TabsList className="w-full justify-start" data-testid="settings-tabs-list">
            {SETTINGS_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} data-testid={`settings-tab-${tab.id}`}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="overflow-y-auto min-h-[400px] mt-4">
            <TabsContent value="agents">
              <AgentsTab />
            </TabsContent>
            <TabsContent value="api-keys">
              <ApiKeysTab />
            </TabsContent>
            <TabsContent value="appearance">
              <AppearanceTab />
            </TabsContent>
            <TabsContent value="git">
              <GitTab />
            </TabsContent>
            <TabsContent value="mcp">
              <McpTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
