import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/index.css';
import { App } from '@/App';

createRoot(document.getElementById('root')!).render( // ASSERT: root element is guaranteed to exist in index.html
  <StrictMode>
    <App />
  </StrictMode>,
);
