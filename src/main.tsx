import React from 'react';
import ReactDOM from 'react-dom/client';
import SupplementSystem from './app/SupplementSystem';
import { PublicCatalog } from './features/PublicCatalog';
import './styles/global.css';

// Mantém a vitrine pública independente do painel administrativo.
// A rota pública nunca carrega a interface de instalação do aplicativo.
const path = window.location.pathname;
const isPublicCatalogRoute = /^\/(?:publicCatalog|catalogo)\/[^/]+\/?$/i.test(path);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isPublicCatalogRoute ? <PublicCatalog /> : <SupplementSystem />}
  </React.StrictMode>,
);
