import type { SessionProvider } from '../../../../types/app';
import { ActivityIndicator } from './ActivityIndicator';

type AssistantThinkingIndicatorProps = {
  selectedProvider: SessionProvider;
}

export default function AssistantThinkingIndicator({ selectedProvider }: AssistantThinkingIndicatorProps) {
  return (
    <div className="chat-message assistant">
      <div className="w-full pl-3 sm:pl-0">
        <ActivityIndicator provider={selectedProvider} />
      </div>
    </div>
  );
}
