import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '../style.css';

// Connect our React app to the root div in index.html.
createRoot(document.getElementById('root')).render(<App />);
