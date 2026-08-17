# Botão Estúpido 🎯

Uma aplicação web simples e divertida que conta cliques individualmente para cada usuário.

![Version](https://img.shields.io/badge/version-1.0.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-26-green)
![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 📋 Funcionalidades

- ✅ Contador individual por usuário (via cookies)
- ✅ Botão para incrementar cliques
- ✅ Botão para zerar o contador
- ✅ Confetes animados ao clicar
- ✅ Versão da aplicação exibida na UI
- ✅ Cada usuário possui seu próprio contador independente
- ✅ Pronto para produção com Docker

## 🚀 Tecnologias

- **Node.js 26** — Runtime JavaScript
- **Express 4.18.2** — Framework web
- **Docker** — Containerização
- **Cookies** — Identificação dos usuários

## 📦 Como executar

### Localmente (sem Docker)

1. Clone o repositório:

```bash
git clone https://github.com/tiagojales/stupid-button.git
cd stupid-button
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor:

```bash
npm start
```

4. Acesse no navegador:

```text
http://localhost:3000
```

### Com Docker

#### Opção 1 — Usar a imagem do Docker Hub

```bash
docker run -p 3000:3000 tiagojales/stupid-button:latest
```

#### Opção 2 — Build local

```bash
# Build da imagem
docker build -t stupid-button .

# Rodar o container
docker run -p 3000:3000 stupid-button
```

#### Opção 3 — Docker Compose

Crie um arquivo `docker-compose.yml`:

```yaml
services:
  app:
    image: tiagojales/stupid-button:latest
    ports:
      - "3000:3000"
    restart: unless-stopped
```

Depois execute:

```bash
docker compose up -d
```

## 🐳 Dockerfile

O projeto inclui um Dockerfile otimizado para produção:

```dockerfile
FROM node:26-alpine

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => { r.statusCode === 200 ? process.exit(0) : process.exit(1) })"

CMD ["node", "index.js"]
```

## ☁️ Deploy na AWS

### Configuração recomendada

A aplicação utiliza a porta **3000** internamente.

#### Application Load Balancer (ALB)

- Listener: porta `80` (HTTP) ou `443` (HTTPS)
- Target Group: porta `3000`
- Health Check: `GET /`
- Execução: ECS ou EC2 com a imagem Docker

### Comando para EC2

```bash
docker run -d \
  --name stupid-app \
  --restart unless-stopped \
  -p 3000:3000 \
  tiagojales/stupid-button:latest
```

## 📊 Health Check

O Dockerfile inclui um health check que verifica se a aplicação está respondendo corretamente:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => { r.statusCode === 200 ? process.exit(0) : process.exit(1) })"
```

O container será considerado saudável quando a aplicação responder com HTTP `200` na rota `/`.

## 🏷️ Versões

| Versão | Descrição |
|---|---|
| `v1.0.0` | Lançamento inicial |
| `latest` | Última versão estável |

## 📂 Estrutura do Projeto

```text
stupid-button/
├── index.js          # Aplicação principal
├── package.json      # Dependências e scripts
├── Dockerfile        # Configuração Docker
├── .gitignore        # Arquivos ignorados pelo Git
└── README.md         # Documentação
```

## 🔧 Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta em que a aplicação será executada |
| `NODE_ENV` | `production` | Ambiente de execução |

## 📝 API Endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/` | Exibe a página principal |
| `GET` | `/api/contador` | Retorna o contador do usuário |
| `POST` | `/api/incrementar` | Incrementa o contador |
| `POST` | `/api/zerar` | Zera o contador |
| `GET` | `/api/version` | Retorna a versão da aplicação |

## 🛠️ Desenvolvimento

### Instalar dependências

```bash
npm install
```

### Executar com Node.js

```bash
npm start
```

### Executar com Nodemon

Instale o Nodemon opcionalmente:

```bash
npm install -g nodemon
```

Depois:

```bash
nodemon index.js
```

### Build da imagem Docker

```bash
docker build -t stupid-button:latest .
```

### Executar em produção

```bash
docker run -d \
  --name stupid-button \
  --restart unless-stopped \
  -p 3000:3000 \
  stupid-button:latest
```

## 📦 Publicação no Docker Hub

### Login

```bash
docker login
```

### Criar as tags

```bash
docker tag stupid-button:latest tiagojales/stupid-button:latest
docker tag stupid-button:v1.0.0 tiagojales/stupid-button:v1.0.0
```

### Publicar

```bash
docker push tiagojales/stupid-button:latest
docker push tiagojales/stupid-button:v1.0.0
```

## 🐛 Troubleshooting

### Erro: porta já está em uso

Veja quais containers estão em execução:

```bash
docker ps
```

Pare o container específico:

```bash
docker stop <container>
```

Remova-o, se necessário:

```bash
docker rm <container>
```

Ou execute a aplicação em outra porta do host:

```bash
docker run -p 3001:3000 stupid-button:latest
```

Nesse caso, a aplicação continuará usando a porta `3000` dentro do container e ficará disponível em:

```text
http://localhost:3001
```

### Erro: permissão negada no Docker

Adicione seu usuário ao grupo `docker`:

```bash
sudo usermod -aG docker $USER
```

Depois faça logout/login para que a alteração tenha efeito.

## 📄 Licença

Este projeto é open source e está disponível sob a licença **MIT**.

## 🤝 Contribuições

Contribuições são bem-vindas!

Sinta-se à vontade para:

- Abrir uma **Issue**
- Enviar um **Pull Request**
- Sugerir melhorias
- Reportar problemas

## 📧 Contato

**Autor:** Tiago Jales

**GitHub:** [@tiagojales](https://github.com/tiagojales)

**Projeto:** [stupid-button](https://github.com/tiagojales/stupid-button)
