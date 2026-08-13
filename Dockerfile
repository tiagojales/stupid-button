FROM node:26-alpine

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Criar usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar código
COPY . .

# Dar permissões
RUN chown -R appuser:appgroup /app

# Usar usuário não-root
USER appuser

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

CMD ["node", "index.js"]