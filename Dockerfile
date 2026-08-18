FROM node:18-alpine

# Instala o Chromium e as bibliotecas gráficas do Linux necessárias para o Puppeteer rodar
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  freetype-dev \
  harfbuzz \
  ca-certificates \
  ttf-freefont

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Configurações obrigatórias: Diz ao Puppeteer para usar o Chrome do sistema 
# e pular o download automático (que é o que está causando o seu erro)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Instala as dependências (agora com o CORS já incluído)
RUN npm install

# Copia o resto do código (seu server.js, imagens, etc)
COPY . .

EXPOSE 10000

# Inicia a aplicação
CMD ["node", "server.js"]