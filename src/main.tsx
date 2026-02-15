import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initializeDatabase } from './lib/db';

// Initialize the database
initializeDatabase().then((success) => {
  if (success) {
    console.log('✅ Database initialized successfully');
  } else {
    console.error('❌ Failed to initialize database');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
