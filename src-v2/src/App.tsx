import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TokenPreview } from '@/components/dev/TokenPreview';

function HomePage() {
  return (
    <div className="flex h-dvh items-center justify-center bg-surface-base">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold text-foreground font-sans">
          Loom V2
        </h1>
        <p className="text-sm text-muted font-sans">
          Design system foundation
        </p>
        <div className="space-y-2 text-sm">
          <p className="font-sans">Inter Variable (font-sans)</p>
          <p className="font-serif italic">Instrument Serif (font-serif)</p>
          <p className="font-mono">JetBrains Mono (font-mono)</p>
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dev/tokens" element={<TokenPreview />} />
      </Routes>
    </BrowserRouter>
  );
}
