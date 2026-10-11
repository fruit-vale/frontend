# FruitVale

**Plataforma de monitoramento inteligente para a fruticultura.**
Acompanhe cada lote em tempo real, antecipe problemas climáticos e planeje a colheita — tudo em um só painel.

---

## Por que o FruitVale

Quem produz fruta decide todos os dias com informação incompleta: planilhas, anotações e idas ao campo. O FruitVale conecta sensores instalados nos lotes a um painel simples, que mostra o que está acontecendo agora e avisa quando algo sai do ideal para a cultura.

- **Decisão com dados, não com palpite.** Temperatura, umidade e outras medições chegam direto do campo.
- **Alertas antes do prejuízo.** Cada cultura tem a sua faixa ideal; leituras fora dela geram alertas nos lotes afetados.
- **Da fazenda à colheita.** Do cadastro da área no mapa ao histórico de safras e à previsão de colheita.
- **Pensado para equipes.** Cada empresa enxerga apenas os próprios dados, com perfis de acesso para quem administra, produz e analisa.

## Principais recursos

### Painel inicial

Visão geral da operação logo ao entrar: totais de propriedades e empresas, gráfico do comportamento dos sensores (por dado, propriedade, lote e período), alertas não lidos e próxima colheita. O painel funciona desde o primeiro acesso, mesmo sem dados, e guia o cadastro até a primeira leitura.

### Monitoramento por sensores

- Cadastro de sensores por lote, com os dados que cada um envia (temperatura, umidade do ar e do solo, pH, luminosidade, precipitação e outros).
- Credenciais de acesso geradas automaticamente, com passo a passo para configurar a placa (ESP32/Arduino).
- Filtros por status, empresa, propriedade, lote, dado medido, acesso e leituras.
- Gráficos com tabela de dados para consulta detalhada.

### Lotes e cultivos no mapa

- Demarcação de cada lote diretamente no mapa, com imagens de satélite da NASA e, opcionalmente, do Google em alta resolução.
- Histórico completo de safras: plantio, previsão, colheita, duração e produtividade por hectare.
- Situação do lote: em preparo, em cultivo ou colhido.

### Culturas e alertas

- Biblioteca de culturas com faixas ideais de temperatura e umidade e ciclo médio.
- Culturas da plataforma, disponíveis para todos, e culturas próprias de cada empresa.
- Alertas climáticos por lote, centralizados em Leituras e Alertas.

### Planejamento e mercado

- Previsão de colheita por lote.
- Acompanhamento de preços e dados de exportação das frutas.

### Gestão de acesso

| Perfil | O que faz |
| --- | --- |
| **Administrador** | Gerencia empresas, usuários, propriedades e configurações; vê todas as empresas. |
| **Produtor** | Cadastra culturas, lotes e sensores e acompanha os dados da própria empresa. |
| **Analista** | Acompanha dashboards, alertas, previsão e dados de mercado. |

Cada empresa trabalha isolada das demais.

### Experiência de uso

Interface em português, com tema claro e escuro, layout adaptado a celular e tablet, e navegação por teclado e leitores de tela. Listas com busca e paginação, estados vazios que orientam o próximo passo e confirmação antes de ações destrutivas.

---

## Como começar a usar

1. **Empresa e usuários.** O administrador cadastra a empresa e cria o usuário produtor.
2. **Propriedade e cultura.** Cadastre a propriedade, com a localização no mapa, e a cultura plantada.
3. **Lote.** Marque a área do lote no mapa e escolha a cultura.
4. **Sensor.** Cadastre o sensor, escolha o lote e os dados que ele envia; o sistema gera o usuário e a senha do dispositivo.
5. **Primeira leitura.** Grave a biblioteca FruitVale na placa, configure a rede e as credenciais, e acompanhe os dados chegando ao painel.

A tela inicial do administrador traz esse passo a passo com o progresso de cada etapa.

---

## Para a equipe técnica

Este repositório contém o **frontend** (aplicação web). Ele consome a API REST do FruitVale e um broker MQTT para as credenciais dos sensores.

### Tecnologias

React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui · React Router · Leaflet · Axios · Firebase Hosting

### Requisitos

- Node.js 20 ou superior
- Acesso à API do FruitVale

### Instalação

```bash
git clone <url-do-repositorio>
cd frontend
cp .env.example .env     # ajuste as variáveis abaixo
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

### Variáveis de ambiente

| Variável | Descrição | Padrão |
| --- | --- | --- |
| `VITE_API_URL` | URL base da API | `https://api.fruitvale.com.br` |
| `VITE_MQTT_HOST` | Host do broker MQTT exibido nas credenciais dos sensores | `mqtt.fruitvale.com.br` |
| `VITE_GOOGLE_MAPS_KEY` | Chave da Map Tiles API do Google (satélite em alta resolução). Vazia: usa só as imagens da NASA. Restrinja a chave à Map Tiles API e ao domínio do site. | — |

### Scripts

| Comando | Função |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Verificação de tipos e build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | Análise estática do código |

### Publicação

O projeto está configurado para o **Firebase Hosting** (`firebase.json`), servindo `dist/` com redirecionamento de todas as rotas para `index.html`.

```bash
npm run build
firebase deploy --only hosting
```

### Estrutura (`src/`)

| Pasta | Papel |
| --- | --- |
| `api/` | Cliente axios (token, tratamento de 401/erros) e `ENDPOINTS` centralizados |
| `services/` | Uma função por chamada à API, mais IBGE e NASA |
| `types/` | Tipos e rótulos de cada entidade da API |
| `contexts/` | `Auth`, `Theme` (claro/escuro) e `Confirm` (diálogo de confirmação) |
| `hooks/` | `useAuth`, `useRequest` (busca com cancelamento e cache), `useAction`, `useForm`… |
| `config/` | `env`, `ROUTES` + `ROUTE_ROLES` (fonte única de permissões) e menu |
| `components/` | `ui/` (shadcn), `shared/` (blocos reutilizáveis), `layout/`, `map/`, `charts/` |
| `pages/` | Uma pasta por tela, carregadas sob demanda com `lazy` |

### Segurança e acesso

- O token de sessão fica no navegador e é descartado ao sair; respostas 401 encerram a sessão automaticamente.
- As rotas são protegidas por perfil a partir de uma única tabela (`ROUTE_ROLES`), usada também para montar o menu.
- O isolamento dos dados entre empresas é garantido pela API; o frontend reforça o recorte por empresa nas telas do produtor.

---

## Suporte e contato

Para contratação, demonstração ou suporte, fale com a equipe FruitVale.

<!-- Preencha: e-mail comercial, site e canal de suporte -->

## Licença

Software proprietário. Todos os direitos reservados. O uso, a cópia e a distribuição dependem de autorização do titular.
