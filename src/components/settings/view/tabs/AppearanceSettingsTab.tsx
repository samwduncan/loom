import type { ReactNode } from 'react';
import type { CodeEditorSettingsState, ProjectSortOrder } from '../../types/types';

type AppearanceSettingsTabProps = {
  projectSortOrder: ProjectSortOrder;
  onProjectSortOrderChange: (value: ProjectSortOrder) => void;
  codeEditorSettings: CodeEditorSettingsState;
  onCodeEditorThemeChange: (value: 'dark' | 'light') => void;
  onCodeEditorWordWrapChange: (value: boolean) => void;
  onCodeEditorShowMinimapChange: (value: boolean) => void;
  onCodeEditorLineNumbersChange: (value: boolean) => void;
  onCodeEditorFontSizeChange: (value: string) => void;
};

type ToggleCardProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  onIcon?: ReactNode;
  offIcon?: ReactNode;
  ariaLabel: string;
};

function ToggleCard({
  label,
  description,
  checked,
  onChange,
  onIcon,
  offIcon,
  ariaLabel,
}: ToggleCardProps) {
  return (
    <div className="bg-surface-raised border border-border/10 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-foreground">{label}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        <button
          onClick={() => onChange(!checked)}
          className="relative inline-flex h-8 w-14 items-center rounded-full bg-surface-elevated transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-base"
          role="switch"
          aria-checked={checked}
          aria-label={ariaLabel}
        >
          <span className="sr-only">{ariaLabel}</span>
          <span
            className={`${checked ? 'translate-x-7' : 'translate-x-1'
              } h-6 w-6 transform rounded-full bg-foreground shadow-lg transition-transform duration-200 flex items-center justify-center`}
          >
            {checked ? onIcon : offIcon}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function AppearanceSettingsTab({
  projectSortOrder,
  onProjectSortOrderChange,
  codeEditorSettings,
  onCodeEditorThemeChange,
  onCodeEditorWordWrapChange,
  onCodeEditorShowMinimapChange,
  onCodeEditorLineNumbersChange,
  onCodeEditorFontSizeChange,
}: AppearanceSettingsTabProps) {
  const codeEditorThemeLabel = "Editor Theme";

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-4">
        <div className="bg-surface-raised border border-border/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground">
                {"Project Sorting"}
              </div>
              <div className="text-sm text-muted-foreground">
                {"How projects are ordered in the sidebar"}
              </div>
            </div>
            <select
              value={projectSortOrder}
              onChange={(event) => onProjectSortOrderChange(event.target.value as ProjectSortOrder)}
              className="text-sm bg-surface-elevated border border-border/10 text-foreground rounded-lg focus:ring-primary focus:border-primary p-2 w-32"
            >
              <option value="name">{"Alphabetical"}</option>
              <option value="date">{"Recent Activity"}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{"Code Editor"}</h3>

        <ToggleCard
          label={codeEditorThemeLabel}
          description={"Default theme for the code editor"}
          checked={codeEditorSettings.theme === 'dark'}
          onChange={(enabled) => onCodeEditorThemeChange(enabled ? 'dark' : 'light')}
          ariaLabel={codeEditorThemeLabel}
        />

        <ToggleCard
          label={"Word Wrap"}
          description={"Enable word wrapping by default in the editor"}
          checked={codeEditorSettings.wordWrap}
          onChange={onCodeEditorWordWrapChange}
          ariaLabel={"Word Wrap"}
        />

        <ToggleCard
          label={"Show Minimap"}
          description={"Display a minimap for easier navigation in diff view"}
          checked={codeEditorSettings.showMinimap}
          onChange={onCodeEditorShowMinimapChange}
          ariaLabel={"Show Minimap"}
        />

        <ToggleCard
          label={"Show Line Numbers"}
          description={"Display line numbers in the editor"}
          checked={codeEditorSettings.lineNumbers}
          onChange={onCodeEditorLineNumbersChange}
          ariaLabel={"Show Line Numbers"}
        />

        <div className="bg-surface-raised border border-border/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground">
                {"Font Size"}
              </div>
              <div className="text-sm text-muted-foreground">
                {"Editor font size in pixels"}
              </div>
            </div>
            <select
              value={codeEditorSettings.fontSize}
              onChange={(event) => onCodeEditorFontSizeChange(event.target.value)}
              className="text-sm bg-surface-elevated border border-border/10 text-foreground rounded-lg focus:ring-primary focus:border-primary p-2 w-24"
            >
              <option value="10">10px</option>
              <option value="11">11px</option>
              <option value="12">12px</option>
              <option value="13">13px</option>
              <option value="14">14px</option>
              <option value="15">15px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
