import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Suppress Firebase unhandled rejections — components handle errors gracefully.
// Network suspension (ERR_NETWORK_IO_SUSPENDED) also causes Firebase rejections
// when the browser tab sleeps; these are safe to ignore.
window.addEventListener('unhandledrejection', event => {
  const reason = event.reason;
  if (!reason) { event.preventDefault(); return; }
  const code = reason.code || '';
  const msg  = reason.message || '';
  const isFirebase = reason.name === 'FirebaseError' || code.includes('/') ||
    msg.includes('Firebase') || msg.includes('firestore') ||
    msg.includes('permissions') || msg.includes('document');
  if (isFirebase) event.preventDefault();
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
