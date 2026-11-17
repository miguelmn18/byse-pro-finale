
import React from 'react';
import ReactDOM from 'react-dom/client';

import SupplementSystem from './app/SupplementSystem';
import { PublicCatalog } from './features/PublicCatalog';

import PWAInstallButton from './components/PWAInstallButton';

import './styles/global.css';
import './components/PWAInstallButton.css';

// Registra o Service Worker no início da aplicação, antes do login.
// O manifesto também é declarado estaticamente no index.html.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.info(
          '[BYSE PWA] Service Worker registrado:',
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          '[BYSE PWA] Falha ao registrar Service Worker:',
          error
        );
      });
  });
}

// Mantém a vitrine pública independente do painel administrativo.
const path = window.location.pathname;

const isPublicCatalogRoute =
  /^\/(?:publicCatalog|catalogo)\/[^/]+\/?$/i.test(path);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isPublicCatalogRoute ? (
      <PublicCatalog />
    ) : (
      <>
        <SupplementSystem />
        <PWAInstallButton />
      </>
    )}
  </React.StrictMode>,
);
