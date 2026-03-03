import type { SessionProvider } from '../../../../types/app';
import PreTokenIndicator from './PreTokenIndicator';

type AssistantThinkingIndicatorProps = {
  selectedProvider: SessionProvider;
  isVisible?: boolean;
}

export default function AssistantThinkingIndicator({ selectedProvider, isVisible = true }: AssistantThinkingIndicatorProps) {
  return (
    <div className="chat-message assistant">
      <div className="w-full pl-3 sm:pl-0">
        <PreTokenIndicator isVisible={isVisible} />
      </div>
    </div>
  );
}
