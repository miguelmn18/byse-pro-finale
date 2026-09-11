import React from 'react'
import ReactDOM from 'react-dom/client'
import SupplementSystem from './app/SupplementSystem' // ou o caminho correto do seu componente principal
import { PublicCatalog } from './features/PublicCatalog' // o arquivo que criamos acima
import "./styles/global.css";
// Verifica se a rota atual começa com /catalogo/
const path = window.location.pathname;
const isPublicCatalogRoute = /^\/catalogo\/[^/]+$/.test(path);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isPublicCatalogRoute ? <PublicCatalog /> : <SupplementSystem />}
  </React.StrictMode>,
)