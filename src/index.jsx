import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/index.css';
import App from './App.jsx';
import "animate.css/animate.compat.css";
import reportWebVitals from './reportWebVitals';
import { glassEnabled, isIOS } from './utils/platform';
import { reloadForNewVersion } from './utils/lazyPage';

// Vite fires this when a code-split chunk (or its CSS) fails to load — usually
// because a new version was deployed. Reload once to pick it up.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});

// Hooks for platform-specific CSS (see assets/index.css)
if (isIOS) document.documentElement.classList.add('ios');
if (glassEnabled) document.documentElement.classList.add('glass');


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
