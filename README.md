# FruitVale — frontend v2

React 19 + TypeScript + Vite + Tailwind 4 + shadcn/ui (base-nova).

## Rodando

```bash
cp .env.example .env   # ajuste VITE_API_URL
npm install
npm run dev
```

`npm run build` · `npm run lint`

## Estrutura (`src/`)

| Pasta | Papel |
| --- | --- |
| `api/` | Cliente axios (token, tratamento de 401/erros), `ENDPOINTS` centralizados |
| `services/` | Uma função por chamada à API (`lotesService.listar()`…), IBGE e NASA |
| `types/` | Tipos e rótulos de cada entidade da API |
| `contexts/` | Context API: `Auth`, `Theme` (claro/escuro), `Confirm` (diálogo de confirmação) |
| `hooks/` | `useAuth`, `useRequest` (busca com cancelamento), `useAction` (gravações), `useForm`… |
| `config/` | `env`, `ROUTES` + `ROUTE_ROLES` (fonte única de permissões) e menu |
| `components/ui` | shadcn · `shared/` blocos reutilizáveis · `layout/` · `map/` · `charts/` |
| `pages/` | Uma pasta por tela (carregadas sob demanda com `lazy`) |
