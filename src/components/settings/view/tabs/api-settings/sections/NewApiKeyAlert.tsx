import { Check, Copy } from 'lucide-react';
import { Button } from '../../../../../ui/button';
import type { CreatedApiKey } from '../types';

type NewApiKeyAlertProps = {
  apiKey: CreatedApiKey;
  copiedKey: string | null;
  onCopy: (text: string, id: string) => void;
  onDismiss: () => void;
};

export default function NewApiKeyAlert({
  apiKey,
  copiedKey,
  onCopy,
  onDismiss,
}: NewApiKeyAlertProps) {
  return (
    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
      <h4 className="font-semibold text-yellow-500 mb-2">{"Save Your API Key"}</h4>
      <p className="text-sm text-muted-foreground mb-3">{"This is the only time you'll see this key. Store it securely."}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-background/50 rounded font-mono text-sm break-all">
          {apiKey.apiKey}
        </code>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(apiKey.apiKey, 'new')}
        >
          {copiedKey === 'new' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <Button size="sm" variant="ghost" className="mt-3" onClick={onDismiss}>
        {"I've saved it"}
      </Button>
    </div>
  );
}
