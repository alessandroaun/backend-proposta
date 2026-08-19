const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();

app.use(cors()); 
app.use(express.json({ limit: '10mb' }));

app.post('/gerar-simulacao', async (req, res) => {
    const { 
        clienteNome, 
        creditoContratado, 
        prazo, 
        taxaAdm, 
        percentualLanceEmbutido,
        parcelaIntegral,
        valorLanceEmbutido,
        creditoLiberado,
        parcelaPosContemplacao,
        dataValidade,
        administradora,
        // Novas variáveis e flags condicionais solicitadas
        primeiroNomeCliente,
        lanceDoBolso,
        percentualLanceDoBolso,
        mostrarLanceDoBolso = false,
        mostrarTaxaAdministracao = false,
        mostrarLanceEmbutido = true,
        opcoesLance = ["Lance embutido", "Lance livre", "Lance limitado", "Lance fidelidade"]
    } = req.body;

    // Função de formatação monetária padrão brasileiro
    const formatarMoeda = (val) => (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Tratamento para extrair apenas o primeiro nome caso necessário
    const nomeExibicao = primeiroNomeCliente || (clienteNome ? clienteNome.split(' ')[0] : 'Cliente');

    // Imagens de fundo para os slides estáticos (1, 2, 3 e 5)
    const img1 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide1.png';
    const img2 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide2.png';
    const img3 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide3.png';
    const img5 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide5.png';

    // Renderização dinâmica das opções de lance com base no array recebido
    const renderOpcoesLance = () => {
        if (!opcoesLance || !Array.isArray(opcoesLance) || opcoesLance.length === 0) return '';
        return opcoesLance.map((opcao, index) => {
            const topPos = 535 + (index * 32);
            return `<div class="dinamico" style="top: ${topPos}px; left: 531px; font-size: 17px; color: #606060;">${opcao}</div>`;
        }).join('');
    };

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @font-face {
                    font-family: 'Friend';
                    src: url('https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/fonts/Friends-SemiBold.ttf') format('truetype');
                    font-weight: 600;
                    font-style: normal;
                    font-display: block;
                }

                * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                
                @page {
                    size: 1280px 720px;
                    margin: 0;
                }

                html, body {
                    margin: 0;
                    padding: 0;
                    width: 1280px;
                    height: 720px;
                    background-color: #000000;
                    font-family: 'Friend', Arial, Helvetica, sans-serif;
                }

                .slide {
                    width: 1280px;
                    height: 720px;
                    position: relative;
                    overflow: hidden;
                    page-break-after: always;
                    break-after: page;
                    page-break-inside: avoid;
                    break-inside: avoid;
                    background-color: #FFFFFF;
                }

                .slide img.bg-slide {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 1280px;
                    height: 720px;
                    object-fit: cover;
                }

                /* Camadas e Estrutura Fixa do Slide 4 baseadas nas coordenadas solicitadas */
                .bg-painel-esquerdo { position: absolute; left: 0; top: 0; width: 475px; height: 330px; background-color: #E2E2E2; z-index: 1; }
                .bg-painel-azul-escuro { position: absolute; left: 0; top: 330px; width: 475px; height: 317px; background-color: #023A63; z-index: 1; }
                .bg-painel-inf-esquerdo { position: absolute; left: 0; top: 647px; width: 475px; height: 73px; background-color: #0B3041; z-index: 1; }
                
                .bg-retangulo-azul-medio { position: absolute; left: 935px; top: 405px; width: 345px; height: 162px; background-color: #215F9A; z-index: 1; }
                
                .linha-horizontal-sup { position: absolute; left: 519px; top: 100px; width: 661px; height: 1px; background-color: #7F7F7F; z-index: 2; }
                .linha-vertical-central { position: absolute; left: 868px; top: 162px; width: 1px; height: 182px; background-color: #969696; z-index: 2; }

                .dinamico { position: absolute; font-family: 'Friend', Arial, Helvetica, sans-serif; z-index: 3; }

                /* Textos Painel Esquerdo */
                .txt-simulacao { top: 18px; left: 35px; font-size: 50px; color: #595959; font-weight: 600; line-height: 1.1; }
                .txt-personalizada { top: 72px; left: 36px; font-size: 30px; color: #595959; font-weight: 600; }
                .txt-cliente { top: 126px; left: 36px; font-size: 24px; color: #575757; font-weight: 600; }
                .txt-cred-contratado { top: 198px; left: 36px; font-size: 22px; color: #5B5B5B; }
                
                .val-cred-rs { top: 229px; left: 42px; font-size: 18px; color: #555555; font-weight: 600; }
                .val-cred-num { top: 229px; left: 72px; font-size: 50px; color: #555555; font-weight: 600; }

                /* Área Azul Esquerda - Parcela e Taxas */
                .txt-parc-integral { top: 378px; left: 107px; font-size: 17px; color: #FFFFFF; line-height: 1.2; font-weight: 600; }
                .val-parc-int-rs { top: 435px; left: 107px; font-size: 16px; color: #FFFFFF; font-weight: 600; }
                .val-parc-int-num { top: 435px; left: 135px; font-size: 44px; color: #FFFFFF; font-weight: 600; }
                .txt-sem-seguro { top: 484px; left: 212px; font-size: 13px; color: #FFFFFF; }

                .txt-taxa-adm { top: 548px; left: 107px; font-size: 16px; color: #FFFFFF; }
                .val-taxa-adm { top: 581px; left: 107px; font-size: 30px; color: #FFFFFF; font-weight: 600; }

                /* Rodapé Esquerdo */
                .txt-prazo-label { top: 677px; left: 67px; font-size: 15px; color: #FFFFFF; }
                .val-prazo-num { top: 668px; left: 121px; font-size: 31px; color: #FFFFFF; font-weight: 600; }

                /* Cabeçalho Painel Direito (Administradora em texto puro) */
                .txt-administradora { top: 48px; left: 519px; font-size: 32px; color: #555555; font-weight: 600; }

                /* Bloco Demonstrativo de Lance */
                .txt-demo-1 { top: 143px; left: 519px; font-size: 24px; color: #5E5E5E; }
                .txt-demo-2 { top: 174px; left: 519px; font-size: 24px; color: #0B2C4E; font-weight: 600; }

                .txt-lance-emb-label { top: 239px; left: 528px; font-size: 24px; color: #092D4E; font-weight: 600; }
                .val-lance-emb-rs { top: 269px; left: 528px; font-size: 16px; color: #555555; font-weight: 600; }
                .val-lance-emb-num { top: 269px; left: 558px; font-size: 40px; color: #555555; font-weight: 600; }
                .txt-lance-emb-desc { top: 316px; left: 559px; font-size: 15px; color: #606060; }

                /* Lance do Bolso Opcional */
                .txt-lance-bolso-label { top: 342px; left: 528px; font-size: 24px; color: #092D4E; font-weight: 600; }
                .val-lance-bolso-rs { top: 373px; left: 528px; font-size: 16px; color: #555555; font-weight: 600; }
                .val-lance-bolso-num { top: 373px; left: 558px; font-size: 40px; color: #555555; font-weight: 600; }
                .txt-lance-bolso-desc { top: 419px; left: 559px; font-size: 15px; color: #606060; }

                /* Parcela Pós Contemplação */
                .txt-pos-1 { top: 185px; left: 932px; font-size: 23px; color: #555555; }
                .txt-pos-2 { top: 216px; left: 932px; font-size: 27px; color: #0B2C4E; font-weight: 600; }
                .val-pos-rs { top: 261px; left: 932px; font-size: 16px; color: #555555; font-weight: 600; }
                .val-pos-num { top: 261px; left: 962px; font-size: 49px; color: #555555; font-weight: 600; }
                .txt-aprox { top: 316px; left: 956px; font-size: 13px; color: #606060; }

                /* Opções de Lance */
                .txt-opcoes-lance { top: 491px; left: 527px; font-size: 25px; color: #0B2C4E; font-weight: 600; }

                /* Crédito Liberado (Bloco Azul) */
                .txt-cred-lib { top: 441px; left: 977px; font-size: 21px; color: #FFFFFF; font-weight: 600; }
                .val-cred-lib-rs { top: 475px; left: 975px; font-size: 16px; color: #FFFFFF; font-weight: 600; }
                .val-cred-lib-num { top: 475px; left: 1005px; font-size: 49px; color: #FFFFFF; font-weight: 600; }

                /* Bloco Final Validade */
                .txt-estrategia { top: 616px; left: 982px; font-size: 18px; color: #606060; }
                .val-data-validade { top: 646px; left: 983px; font-size: 14px; color: #606060; font-weight: 600; }
            </style>
        </head>
        <body>
            <div class="slide"><img class="bg-slide" src="${img1}" /></div>
            <div class="slide"><img class="bg-slide" src="${img2}" /></div>
            <div class="slide"><img class="bg-slide" src="${img3}" /></div>
            
            <!-- SLIDE 4: TEMPLATE DINÂMICO PRINCIPAL -->
            <div class="slide">
                <div class="bg-painel-esquerdo"></div>
                <div class="bg-painel-azul-escuro"></div>
                <div class="bg-painel-inf-esquerdo"></div>
                <div class="bg-retangulo-azul-medio"></div>
                <div class="linha-horizontal-sup"></div>
                <div class="linha-vertical-central"></div>

                <!-- Painel Esquerdo -->
                <div class="dinamico txt-simulacao">Simulação</div>
                <div class="dinamico txt-personalizada">personalizada</div>
                <div class="dinamico txt-cliente">Cliente: ${nomeExibicao}</div>
                <div class="dinamico txt-cred-contratado">Crédito à contratar:</div>
                
                <div class="dinamico val-cred-rs">R$</div>
                <div class="dinamico val-cred-num">${formatarMoeda(creditoContratado)}</div>

                <!-- Seção Parcela Integral -->
                <div class="dinamico txt-parc-integral">Parcela integral<br>até a contemplação:</div>
                <div class="dinamico val-parc-int-rs">R$</div>
                <div class="dinamico val-parc-int-num">${formatarMoeda(parcelaIntegral)}</div>
                <div class="dinamico txt-sem-seguro">*sem seguro</div>

                <!-- Taxa de Administração (Condicional) -->
                ${mostrarTaxaAdministracao ? `
                    <div class="dinamico txt-taxa-adm">Taxa de Administração:</div>
                    <div class="dinamico val-taxa-adm">${taxaAdm}%</div>
                ` : ''}

                <!-- Rodapé Esquerdo -->
                <div class="dinamico txt-prazo-label">Prazo:</div>
                <div class="dinamico val-prazo-num">${prazo} meses</div>

                <!-- Painel Direito: Administradora em Texto Dinâmico -->
                <div class="dinamico txt-administradora">Administradora: ${administradora || 'Âncora'}</div>

                <!-- Demonstrativo de Lance -->
                <div class="dinamico txt-demo-1">Demonstrativo</div>
                <div class="dinamico txt-demo-2">de Lance</div>

                ${mostrarLanceEmbutido ? `
                    <div class="dinamico txt-lance-emb-label">Lance embutido:</div>
                    <div class="dinamico val-lance-emb-rs">R$</div>
                    <div class="dinamico val-lance-emb-num">${formatarMoeda(valorLanceEmbutido)}</div>
                    <div class="dinamico txt-lance-emb-desc">${percentualLanceEmbutido}% da própria carta</div>
                ` : ''}

                <!-- Lance do Bolso (Condicional) -->
                ${mostrarLanceDoBolso ? `
                    <div class="dinamico txt-lance-bolso-label">Lance do bolso:</div>
                    <div class="dinamico val-lance-bolso-rs">R$</div>
                    <div class="dinamico val-lance-bolso-num">${formatarMoeda(lanceDoBolso)}</div>
                    <div class="dinamico txt-lance-bolso-desc">${percentualLanceDoBolso || 50}% do crédito</div>
                ` : ''}

                <!-- Parcela Pós Contemplação -->
                <div class="dinamico txt-pos-1">Parcela</div>
                <div class="dinamico txt-pos-2">Pós contemplação:</div>
                <div class="dinamico val-pos-rs">R$</div>
                <div class="dinamico val-pos-num">${formatarMoeda(parcelaPosContemplacao)}</div>
                <div class="dinamico txt-aprox">Aproximadamente</div>

                <!-- Opções de Lance Dinâmicas -->
                <div class="dinamico txt-opcoes-lance">Opções de lance:</div>
                ${renderOpcoesLance()}

                <!-- Bloco Azul: Crédito Liberado -->
                <div class="dinamico txt-cred-lib">Crédito liberado</div>
                <div class="dinamico val-cred-lib-rs">R$</div>
                <div class="dinamico val-cred-lib-num">${formatarMoeda(creditoLiberado)}</div>

                <!-- Estratégia Válida Até -->
                <div class="dinamico txt-estrategia">Estratégia válida até:</div>
                <div class="dinamico val-data-validade">${dataValidade}</div>
            </div>

            <div class="slide"><img class="bg-slide" src="${img5}" /></div>
        </body>
        </html>
    `;

    let browser = null;
    try {
        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--headless=new'
            ]
        });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 2000));
        
        const pdfBuffer = await page.pdf({ 
            width: '1280px',
            height: '720px',
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