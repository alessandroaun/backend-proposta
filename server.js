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

    // --- TEMPLATE HTML (Idêntico ao seu PDF) ---
    const htmlContent = `
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
            .slide { 
                width: 297mm; height: 210mm; 
                position: relative; overflow: hidden; 
                page-break-after: always;
                background-size: cover;
            }
            /* Exemplo de posicionamento dos dados no Slide 4 */
            .box-simulacao {
                position: absolute; top: 200px; left: 100px;
                color: #fff; font-size: 24px;
            }
            .valor { font-weight: bold; color: #00ff00; }
        </style>
    </head>
    <body>
        <div class="slide" style="background-image: url('URL_DA_SUA_IMAGEM_1')"></div>
        
        <div class="slide" style="background-image: url('URL_DA_SUA_IMAGEM_4')">
            <div class="box-simulacao">
                <p>Crédito Contratado: R$ ${creditoContratado.toLocaleString('pt-BR')}</p>
                <p>Parcela Integral: <span class="valor">R$ ${parcelaIntegral.toFixed(2)}</span></p>
                <p>Lance Embutido (25%): R$ ${valorLanceEmbutido.toLocaleString('pt-BR')}</p>
                <p>Crédito Liberado: R$ ${creditoLiberado.toLocaleString('pt-BR')}</p>
                <p>Parcela Pós-Contemplação: <span class="valor">R$ ${parcelaPosContemplacao.toFixed(2)}</span></p>
            </div>
        </div>

        <div class="slide" style="background-image: url('URL_DA_SUA_IMAGEM_5')"></div>
    </body>
    </html>
    `;

    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, printBackground: true });
        
        await browser.close();

        res.contentType("application/pdf");
        res.send(pdfBuffer);
    } catch (e) {
        res.status(500).send("Erro ao gerar PDF: " + e.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));