import type { AgentCategory } from '../../../../types/types';
import type { AgentCategoryTabsSectionProps } from '../types';

const AGENT_CATEGORIES: AgentCategory[] = ['account', 'permissions', 'mcp'];

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  account: 'Account',
  permissions: 'Permissions',
  mcp: 'MCP Servers',
};

export default function AgentCategoryTabsSection({
  selectedCategory,
  onSelectCategory,
}: AgentCategoryTabsSectionProps) {
  return (
    <div className="border-b border-border/10 flex-shrink-0">
      <div role="tablist" className="flex px-2 md:px-4 overflow-x-auto">
        {AGENT_CATEGORIES.map((category) => (
          <button
            key={category}
            role="tab"
            aria-selected={selectedCategory === category}
            onClick={() => onSelectCategory(category)}
            className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              selectedCategory === category
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>
    </div>
  );
}
