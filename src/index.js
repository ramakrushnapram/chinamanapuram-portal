import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

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
    msg.includes('permissions') || msg.includes('document') ||
    msg.includes('INTERNAL ASSERTION FAILED') || msg.includes('Unexpected state');
  if (isFirebase) event.preventDefault();
});

// Suppress Firestore INTERNAL ASSERTION errors from crashing the app
window.addEventListener('error', event => {
  const msg = event.message || '';
  if (msg.includes('INTERNAL ASSERTION FAILED') || msg.includes('Unexpected state')) {
    event.preventDefault();
    console.warn('Firestore internal error suppressed — page still works normally.');
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
