import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './lib/app-discovery'; // side-effect: registers all apps before first render
import { initObservability } from './lib/observability';
import { initWindowOpenTracker } from './lib/windowOpenTracker';
import App from './App';

initObservability();
initWindowOpenTracker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
