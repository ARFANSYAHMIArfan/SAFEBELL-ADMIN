
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { firebaseError } from './services/firebaseConfig';
import FirebaseErrorScreen from './components/FirebaseErrorScreen';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

if (firebaseError) {
  root.render(
    <React.StrictMode>
      <FirebaseErrorScreen error={firebaseError} />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}