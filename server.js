const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

app.post('/gerar-simulacao', async (req, res) => {
    const { 
        clienteNome, 
        creditoContratado, 
        prazo, 
        taxaAdm, 
        percentualLanceEmbutido 
    } = req.body;

    // --- LÓGICA DE CÁLCULO FINANCEIRO (SLIDE 4) ---
    const taxaDecimal = taxaAdm / 100;
    const totalComTaxa = creditoContratado * (1 + taxaDecimal);
    const parcelaIntegral = totalComTaxa / prazo;
    
    const valorLanceEmbutido = creditoContratado * (percentualLanceEmbutido / 100);
    const creditoLiberado = creditoContratado - valorLanceEmbutido;
    
    const saldoDevedorPosLance = totalComTaxa - valorLanceEmbutido;
    const parcelaPosContemplacao = saldoDevedorPosLance / prazo;

    // Gera uma data de validade (ex: 7 dias a partir de hoje)
    const dataAtual = new Date();
    const dataValidade = new Date(dataAtual.setDate(dataAtual.getDate() + 7)).toLocaleDateString('pt-BR');

    // Função auxiliar para formatar os números no padrão brasileiro (ex: 120.000,00)
    const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // --- TEMPLATE HTML PARA O PDF ---
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            /* Importa uma fonte limpa e profissional semelhante a do PDF */
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap');
            
            body, html { 
                margin: 0; padding: 0; 
                font-family: 'DM Sans', sans-serif; 
                background-color: #fff;
                /* Garante que o Chrome imprima as cores e fundos corretamente */
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
            }
            
            /* Configuração da Página A4 Paisagem (Landscape) sem margens brancas */
            @page { size: A4 landscape; margin: 0; }
            
            /* Estrutura base de cada slide */
            .slide { 
                width: 297mm; 
                height: 210mm; 
                position: relative; 
                overflow: hidden; 
                page-break-after: always; /* Força a quebra de página no PDF */
                background-size: 100% 100%;
                background-repeat: no-repeat;
                background-position: center;
            }
            
            /* --- CSS ESPECÍFICO DO SLIDE 4 (CÁLCULOS) --- */
            
            /* Classe base para todos os textos dinâmicos */
            .dado-dinamico {
                position: absolute;
                font-family: 'DM Sans', sans-serif;
                font-size: 24px;
                color: #002D5A; /* Cor baseada no seu design (Azul escuro) */
            }

            .valor-destaque {
                font-weight: 700;
                font-size: 34px;
            }

            /* ATENÇÃO: Ajuste os valores de 'top' e 'left' para alinhar 
               exatamente com os campos em branco da sua imagem img_slide4.png */
            
            /* Primeira Coluna */
            .val-credito { top: 38%; left: 12%; }
            .val-parcela-integral { top: 58%; left: 12%; color: #11caa0; /* Verde destaque */ }
            .val-prazo { top: 78%; left: 12%; }

            /* Segunda Coluna */
            .val-lance-embutido { top: 38%; left: 55%; font-size: 20px;}
            .val-credito-liberado { top: 58%; left: 55%; }
            .val-parcela-pos { top: 78%; left: 55%; color: #11caa0; }

            /* Textos menores / Rodapé */
            .val-validade { top: 88%; left: 75%; font-size: 16px; color: #666; font-weight: bold; }
            
        </style>
    </head>
    <body>
        <!-- Slide 1 -->
        <div class="slide" style="background-image: url('img_slide1.jpg')"></div>
        
        <!-- Slide 2 -->
        <div class="slide" style="background-image: url('img_slide2.jpg')"></div>
        
        <!-- Slide 3 -->
        <div class="slide" style="background-image: url('img_slide3.jpg')"></div>
        
        <!-- Slide 4: Simulação com os dados dinâmicos sobrepostos -->
        <div class="slide" style="background-image: url('img_slide4.png')">
            <div class="dado-dinamico valor-destaque val-credito">${formatarMoeda(creditoContratado)}</div>
            <div class="dado-dinamico valor-destaque val-parcela-integral">${formatarMoeda(parcelaIntegral)}</div>
            <div class="dado-dinamico valor-destaque val-prazo">${prazo} meses</div>
            
            <div class="dado-dinamico val-lance-embutido">Aproximadamente<br><span style="font-size:30px; font-weight: bold;">R$ ${formatarMoeda(valorLanceEmbutido)}</span></div>
            <div class="dado-dinamico valor-destaque val-credito-liberado">${formatarMoeda(creditoLiberado)}</div>
            <div class="dado-dinamico valor-destaque val-parcela-pos">${formatarMoeda(parcelaPosContemplacao)}</div>
            
            <div class="dado-dinamico val-validade">${dataValidade}</div>
        </div>

        <!-- Slide 5 -->
        <div class="slide" style="background-image: url('img_slide5.jpg')"></div>
    </body>
    </html>
    `;

    try {
        const browser = await puppeteer.launch({
            // Argumentos necessários para rodar no Render/Servidores Linux
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Carrega o HTML. 'networkidle0' espera as fontes e imagens carregarem antes de tirar o PDF
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Gera o arquivo PDF
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            landscape: true, 
            printBackground: true // Essencial para imprimir as imagens de fundo
        });
        
        await browser.close();

        // Envia o PDF de volta para o React Native
        res.contentType("application/pdf");
        res.send(pdfBuffer);
    } catch (e) {
        console.error(e);
        res.status(500).send("Erro ao gerar PDF: " + e.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));