const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();

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

    // --- TEMPLATE HTML OTIMIZADO PARA O PDF (Sem requisições externas travadas) ---
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body, html { 
                margin: 0; padding: 0; 
                font-family: Helvetica, Arial, sans-serif; 
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
                background-color: #f3f0df;
            }
            
            .dado-dinamico {
                position: absolute;
                font-family: Helvetica, Arial, sans-serif;
                font-size: 24px;
                color: #002D5A;
            }

            .valor-destaque { font-weight: bold; font-size: 34px; }

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
        <div class="slide"></div>
        <div class="slide"></div>
        <div class="slide"></div>
        
        <div class="slide">
            <div style="position: absolute; top: 15%; left: 12%; font-size: 28px; font-weight: bold; color: #002D5A;">Proposta Comercial: ${clienteNome || 'Cliente'}</div>
            
            <div class="dado-dinamico valor-destaque val-credito">R$ ${formatarMoeda(creditoContratado)}</div>
            <div class="dado-dinamico valor-destaque val-parcela-integral">R$ ${formatarMoeda(parcelaIntegral)}</div>
            <div class="dado-dinamico valor-destaque val-prazo">${prazo} meses</div>
            
            <div class="dado-dinamico val-lance-embutido">Aproximadamente<br><span style="font-size:30px; font-weight: bold;">R$ ${formatarMoeda(valorLanceEmbutido)}</span></div>
            <div class="dado-dinamico valor-destaque val-credito-liberado">R$ ${formatarMoeda(creditoLiberado)}</div>
            <div class="dado-dinamico valor-destaque val-parcela-pos">R$ ${formatarMoeda(parcelaPosContemplacao)}</div>
            
            <div class="dado-dinamico val-validade">Validade: ${dataValidade}</div>
        </div>

        <div class="slide"></div>
    </body>
    </html>
    `;

    let browser = null;
    try {
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--headless=new'
            ]
        });
        const page = await browser.newPage();
        
        // Timeout estendido para 60 segundos e modo de carregamento leve
        await page.setContent(htmlContent, { waitUntil: 'load', timeout: 60000 });
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            landscape: true, 
            printBackground: true 
        });
        
        await browser.close();

        res.contentType("application/pdf");
        res.send(pdfBuffer);
    } catch (e) {
        if (browser) await browser.close();
        console.error("Erro detalhado no Puppeteer:", e);
        res.status(500).send("Erro ao gerar PDF: " + e.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));