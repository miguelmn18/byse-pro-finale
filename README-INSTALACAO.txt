BYSE PRO - PWA (aplicativo instalável)

ARQUIVOS
- src/app/SupplementSystem.tsx: painel com botão de instalação após autenticação.
- src/main.tsx: preserva as rotas públicas /catalogo/:id e /publicCatalog/:id.
- index.html: metadados mobile e ícone; não inclui manifesto global.
- public/manifest.webmanifest: identidade do aplicativo instalável.
- public/sw.js: service worker limitado a arquivos estáticos.
- public/icons/: ícones PNG 192x192 e 512x512.

COMO APLICAR
1. Copie src/app/SupplementSystem.tsx para o caminho correspondente do projeto.
2. Copie src/main.tsx para o caminho correspondente do projeto.
3. Substitua index.html na raiz.
4. Copie a pasta public/ para a raiz do projeto (mesclando com os arquivos públicos existentes; não apague outros assets).
5. Mantenha package.json e vite.config.ts atuais: esta implementação não adiciona dependências.
6. Faça o build e publique na Vercel.

REGRAS DE ACESSO
- O link rel=manifest só é anexado dinamicamente quando existe usuário autenticado.
- O service worker só é registrado no painel autenticado.
- As rotas /catalogo/:id e /publicCatalog/:id são servidas como catálogo público e não recebem botão de instalação nem manifesto no documento.
- O service worker não armazena /api, páginas de navegação, /catalogo ou /publicCatalog; portanto não guarda respostas autenticadas ou dados de clientes no cache.

IMPORTANTE
A PWA exige HTTPS. O botão do Android/Chrome usa o prompt nativo quando disponível. No iPhone, o botão mostra as instruções para Safari > Compartilhar > Adicionar à Tela de Início.
A interface e o acesso remoto continuam dependendo da conexão com a internet para consultar o backend Railway.

SEGURANÇA E LIMITAÇÃO DO MESMO DOMÍNIO
O botão e o manifesto são disponibilizados somente depois do login no painel. Como o catálogo e o painel compartilham atualmente o mesmo domínio, não existe isolamento absoluto contra alguém que conheça a URL técnica do manifesto e tente abri-la manualmente. Para isolamento máximo, publique o painel em um subdomínio exclusivo (por exemplo, app.seudominio.com) e mantenha o catálogo público em outro domínio/subdomínio.
