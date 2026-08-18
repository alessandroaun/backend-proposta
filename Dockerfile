FROM node:18-slim

# Instala as dependências de sistema necessárias para o Chrome rodar no Linux
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências do Node (agora o Puppeteer VAI baixar o Chrome dele)
RUN npm install

# Copia o resto do código
COPY . .

EXPOSE 10000

# Inicia a aplicação
CMD ["node", "server.js"]