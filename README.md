# BYSE PRO — Sistema de Gestão Multiusuário

Versão reorganizada para uso real com frontend React/TypeScript, backend Node/Express, PostgreSQL, autenticação JWT e sessões de WhatsApp isoladas por loja.

## Requisitos
- Node.js 20 LTS ou superior
- npm 10 ou superior
- PostgreSQL 14+
- Para WhatsApp via QR: celular com WhatsApp e acesso à internet

## 1. Banco PostgreSQL
Crie um banco chamado `byse_pro` e informe a conexão em `server/.env`.

Exemplo:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/byse_pro
PORT=3333
JWT_SECRET=troque-por-uma-chave-aleatoria-com-pelo-menos-32-caracteres
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
DB_POOL_MAX=20
```

Nunca publique senha do banco, JWT_SECRET ou credenciais de WhatsApp no Git.

## 2. Instalar dependências do frontend
Na pasta raiz:

```bash
npm install
```

## 3. Instalar dependências do backend

```bash
cd server
npm install
cd ../..
```

## 4. Rodar backend
Em um terminal:

```bash
npm run server:dev
```

ou:

```bash
cd server
npm run dev
```

API: http://localhost:3333

Teste:

```bash
curl http://localhost:3333/api/health
```

## 5. Rodar frontend
Em outro terminal, na raiz:

```bash
npm run frontend
```

Abra http://localhost:5173

## 6. Primeiro acesso
Na tela de login use **Ainda não tenho conta**, crie a conta da loja e depois entre normalmente.

Cada conta possui um `user_id` próprio. Clientes, produtos, vendas, estoque, fiados, vendedores, configurações, DRE, tráfego, catálogo e WhatsApp são gravados associados à loja autenticada.

## 7. Catálogo público
Dentro de **Catálogo**, copie o link público da loja. Ele terá o formato:

`http://localhost:5173/catalogo/SEU_ID`

O catálogo mostra produtos da loja. O acesso VIP é protegido por senha armazenada como hash no backend; a senha não é comparada somente no navegador.

## 8. WhatsApp
A aba WhatsApp usa uma sessão Baileys independente por usuário. Cada loja possui uma pasta de autenticação derivada do seu ID e uma instância de socket própria.

Fluxo:
1. Entre na loja A.
2. Abra WhatsApp e escaneie o QR da loja A.
3. Entre na loja B em outro navegador/perfil.
4. A loja B terá outra sessão/QR e não reutilizará a sessão da loja A.
5. Os agendamentos também ficam associados ao `user_id`.

Para enviar mensagens automáticas, o cliente precisa ter telefone e opt-in de WhatsApp habilitado.

## 9. Pré-Treino
A aba possui:
- cadastro de clientes;
- telefone obrigatório;
- modalidade mensal ou avulsa;
- período e valor da mensalidade;
- valor por consumo avulso;
- cadastro de produtos;
- custo, preço e estoque do produto;
- registro de consumo por cliente ou cliente avulso;
- telefone no registro;
- baixa de estoque;
- relatório de consumos;
- clientes que mais consumiram;
- produtos mais consumidos;
- faturamento, custo e lucro.

## 10. Segurança e isolamento
O frontend não escolhe o `user_id`. O backend obtém o ID a partir do JWT assinado e todas as consultas filtram pelo usuário autenticado. IDs iguais em lojas diferentes são permitidos porque as entidades usam chaves compostas ou escopo explícito por `user_id`.

## Observação sobre migração
Ao iniciar, o backend cria as tabelas e adiciona as colunas novas com `ALTER TABLE ... IF NOT EXISTS`. Isso permite aproveitar uma base PostgreSQL existente sem apagar os dados.
