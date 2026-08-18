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

    const img1 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide1.png';
    const img2 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide2.png';
    const img3 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide3.png';
    const img4 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide4.png';
    const img5 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide5.png';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * { box-sizing: border-box; }
            body, html { 
                margin: 0; 
                padding: 0; 
                width: 297mm;
                height: 210mm;
                font-family: Helvetica, Arial, sans-serif; 
                background-color: #fff;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
            }
            
            @page { 
                size: 297mm 210mm; 
                margin: 0; 
            }
            
            .slide { 
                width: 297mm; 
                height: 210mm; 
                position: relative; 
                overflow: hidden; 
                page-break-after: always;
                page-break-inside: avoid;
                background-size: 100% 100%;
                background-repeat: no-repeat;
                background-position: center;
            }
            
            .dado-dinamico {
                position: absolute;
                font-family: Helvetica, Arial, sans-serif;
                font-size: 18px;
                color: #002D5A;
            }

            .valor-destaque { font-weight: bold; font-size: 22px; }

            /* Ajustes finos de posicionamento baseados no modelo do slide 4 */
            .val-cliente { top: 12%; left: 10%; font-size: 22px; font-weight: bold; color: #002D5A; }
            .val-credito { top: 32%; left: 10%; }
            .val-parcela-integral { top: 45%; left: 10%; color: #00a884; }
            .val-prazo { top: 58%; left: 10%; }

            .val-lance-embutido { top: 32%; left: 52%; font-size: 16px; }
            .val-credito-liberado { top: 45%; left: 52%; }
            .val-parcela-pos { top: 58%; left: 52%; color: #00a884; }

            .val-validade { top: 85%; left: 72%; font-size: 14px; color: #444; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="slide" style="background-image: url('${img1}')"></div>
        <div class="slide" style="background-image: url('${img2}')"></div>
        <div class="slide" style="background-image: url('${img3}')"></div>
        
        <div class="slide" style="background-image: url('${img4}')">
            <div class="dado-dinamico val-cliente">Proposta Comercial: ${clienteNome || 'Cliente'}</div>
            
            <div class="dado-dinamico valor-destaque val-credito">R$ ${formatarMoeda(creditoContratado)}</div>
            <div class="dado-dinamico valor-destaque val-parcela-integral">R$ ${formatarMoeda(parcelaIntegral)}</div>
            <div class="dado-dinamico valor-destaque val-prazo">${prazo} meses</div>
            
            <div class="dado-dinamico val-lance-embutido">Aproximadamente<br><span style="font-size: 20px; font-weight: bold;">R$ ${formatarMoeda(valorLanceEmbutido)}</span></div>
            <div class="dado-dinamico valor-destaque val-credito-liberado">R$ ${formatarMoeda(creditoLiberado)}</div>
            <div class="dado-dinamico valor-destaque val-parcela-pos">R$ ${formatarMoeda(parcelaPosContemplacao)}</div>
            
            <div class="dado-dinamico val-validade">Validade: ${dataValidade}</div>
        </div>

        <div class="slide" style="background-image: url('${img5}')"></div>
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
        
        await page.setContent(htmlContent, { waitUntil: 'load', timeout: 60000 });
        
        const pdfBuffer = await page.pdf({ 
            width: '297mm',
            height: '210mm',
            printBackground: true,
            preferCSSPageSize: true
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