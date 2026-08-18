const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors'); // <-- 1. Importação do CORS
const app = express();

// <-- 2. Libera o backend para receber requisições de qualquer origem (inclusive seu localhost)
app.use(cors()); 
app.use(express.json());

app.post('/gerar-simulacao', async (req, res) => {
    const { 
        clienteNome, 
        creditoContratado, 
        prazo, 
        taxaAdm, 
        percentualLanceEmbutido 
    } = req.body;

    // --- LÓGICA DE CÁLCULO FINANCEIRO ---
    const taxaDecimal = taxaAdm / 100;
    const totalComTaxa = creditoContratado * (1 + taxaDecimal);
    const parcelaIntegral = totalComTaxa / prazo;
    
    const valorLanceEmbutido = creditoContratado * (percentualLanceEmbutido / 100);
    const creditoLiberado = creditoContratado - valorLanceEmbutido;
    
    const saldoDevedorPosLance = totalComTaxa - valorLanceEmbutido;
    const parcelaPosContemplacao = saldoDevedorPosLance / prazo;

    const dataAtual = new Date();
    const dataValidade = new Date(dataAtual.setDate(dataAtual.getDate() + 7)).toLocaleDateString('pt-BR');

    const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // --- TEMPLATE HTML PARA O PDF ---
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&display=swap');
            
            body, html { 
                margin: 0; padding: 0; 
                font-family: 'DM Sans', sans-serif; 
                background-color: #fff;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
            }
            
            @page { size: A4 landscape; margin: 0; }
            
            .slide { 
                width: 297mm; 
                height: 210mm; 
                position: relative; 
                overflow: hidden; 
                page-break-after: always;
                background-size: 100% 100%;
                background-repeat: no-repeat;
                background-position: center;
            }
            
            .dado-dinamico {
                position: absolute;
                font-family: 'DM Sans', sans-serif;
                font-size: 24px;
                color: #002D5A;
            }

            .valor-destaque { font-weight: 700; font-size: 34px; }

            .val-credito { top: 38%; left: 12%; }
            .val-parcela-integral { top: 58%; left: 12%; color: #11caa0; }
            .val-prazo { top: 78%; left: 12%; }

            .val-lance-embutido { top: 38%; left: 55%; font-size: 20px;}
            .val-credito-liberado { top: 58%; left: 55%; }
            .val-parcela-pos { top: 78%; left: 55%; color: #11caa0; }

            .val-validade { top: 88%; left: 75%; font-size: 16px; color: #666; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="slide" style="background-image: url('img_slide1.jpg')"></div>
        <div class="slide" style="background-image: url('img_slide2.jpg')"></div>
        <div class="slide" style="background-image: url('img_slide3.jpg')"></div>
        
        <div class="slide" style="background-image: url('img_slide4.png')">
            <div class="dado-dinamico valor-destaque val-credito">${formatarMoeda(creditoContratado)}</div>
            <div class="dado-dinamico valor-destaque val-parcela-integral">${formatarMoeda(parcelaIntegral)}</div>
            <div class="dado-dinamico valor-destaque val-prazo">${prazo} meses</div>
            
            <div class="dado-dinamico val-lance-embutido">Aproximadamente<br><span style="font-size:30px; font-weight: bold;">R$ ${formatarMoeda(valorLanceEmbutido)}</span></div>
            <div class="dado-dinamico valor-destaque val-credito-liberado">${formatarMoeda(creditoLiberado)}</div>
            <div class="dado-dinamico valor-destaque val-parcela-pos">${formatarMoeda(parcelaPosContemplacao)}</div>
            
            <div class="dado-dinamico val-validade">${dataValidade}</div>
        </div>

        <div class="slide" style="background-image: url('img_slide5.jpg')"></div>
    </body>
    </html>
    `;

    try {
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            landscape: true, 
            printBackground: true 
        });
        
        await browser.close();

        res.contentType("application/pdf");
        res.send(pdfBuffer);
    } catch (e) {
        console.error(e);
        res.status(500).send("Erro ao gerar PDF: " + e.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));