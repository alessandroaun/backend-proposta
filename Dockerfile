FROM node:18-slim

# Instala o Chromium nativo do sistema e fontes (evita o erro do apt-key e downloads externos)
RUN apt-get update \
    && apt-get install -y chromium fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Pula o download do navegador pelo NPM e aponta direto para o Chromium instalado acima
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências do Node
RUN npm install

# Copia o resto do código
COPY . .

EXPOSE 10000

# Inicia a aplicação
CMD ["node", "server.js"]