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
        tipoBem,
        administradora,
        temAdesao,
        adesaoPercentual,
        adesaoAteMes
    } = req.body;

    const formatarMoeda = (val) => (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const logosAdministradoras = {
        'Âncora': 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/logo_ancora.png',
        'Embracon': 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/logo_embracon.png',
        'Rodobens': 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/logo_rodobens.png',
        'Itaú': 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/logo_itau.png',
        'Renault': 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/logo_renault.png',
        'Nissan': 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/logo_nissan.png'
    };
    const logoAdministradora = logosAdministradoras[administradora] || logosAdministradoras['Âncora'];

    const img1 = tipoBem === 'Imóvel'
        ? 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/imd_slide1_imovel.png'
        : 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide1.png';

    const img2 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide2.png';
    const img3 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide3.png';
    const img5 = 'https://omgkvkooitmdqulasdmx.supabase.co/storage/v1/object/public/images/img_slide5.png';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
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
                    font-family: Arial, Helvetica, sans-serif;
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
                    background-color: #FEFEFE;
                }

                .slide img.bg-slide {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 1280px;
                    height: 720px;
                    object-fit: cover;
                }

                .bg-painel-esquerdo { position: absolute; left: 0; top: 0; width: 476px; height: 720px; background-color: #E8E8E8; z-index: 1; }
                .bg-painel-azul-escuro { position: absolute; left: 0; top: 330px; width: 476px; height: 315px; background-color: #013962; z-index: 2; }
                .bg-painel-inf-esquerdo { position: absolute; left: 0; top: 645px; width: 476px; height: 75px; background-color: #0A2F41; z-index: 2; }
                .bg-retangulo-azul-medio { position: absolute; left: 935px; top: 404px; width: 345px; height: 162px; background-color: #205F9A; z-index: 2; }
                
                .linha-horizontal-sup { position: absolute; left: 518px; top: 102px; width: 664px; height: 1px; background-color: #D1D5DB; z-index: 2; }
                .linha-vertical-central { position: absolute; left: 870px; top: 164px; width: 1px; height: 181px; background-color: #D1D5DB; z-index: 2; }

                .dinamico { position: absolute; font-family: Arial, Helvetica, sans-serif; z-index: 3; }

                .txt-simulacao { top: 61px; left: 78px; font-size: 38px; color: #6F6F6F; font-weight: normal; line-height: 1.1; }
                .txt-personalizada { top: 102px; left: 78px; font-size: 38px; color: #6F6F6F; font-weight: normal; }
                .txt-composicao { top: 151px; left: 78px; font-size: 16px; color: #6F6F6F; }
                .txt-cred-contratado { top: 205px; left: 78px; font-size: 16px; color: #6F6F6F; }
                
                .val-cred-rs { top: 242px; left: 78px; font-size: 16px; color: #6F6F6F; font-weight: bold; }
                .val-cred-num { top: 231px; left: 102px; font-size: 38px; color: #6F6F6F; font-weight: bold; }

                .txt-parc-integral { top: 351px; left: 67px; font-size: 15px; color: #FFFFFF; line-height: 1.3; }
                .val-parc-int-rs { top: 419px; left: 67px; font-size: 16px; color: #FFFFFF; font-weight: bold; }
                .val-parc-int-num { top: 408px; left: 91px; font-size: 38px; color: #FFFFFF; font-weight: bold; }
                .txt-sem-seguro { top: 458px; left: 67px; font-size: 13px; color: #FFFFFF; }

                .txt-taxa-adm { top: 526px; left: 67px; font-size: 15px; color: #FFFFFF; }
                .val-taxa-adm { top: 556px; left: 67px; font-size: 26px; color: #FFFFFF; font-weight: bold; }

                .txt-prazo-label { top: 682px; left: 67px; font-size: 16px; color: #FFFFFF; }
                .val-prazo-num { top: 682px; left: 123px; font-size: 18px; color: #FFFFFF; font-weight: bold; }

                .txt-administradora { top: 57px; left: 519px; font-size: 20px; color: #6F6F6F; }
                .img-logo-adm { top: 50px; left: 720px; height: 30px; object-fit: contain; }

                .txt-calc-lance-1 { top: 147px; left: 519px; font-size: 22px; color: #6F6F6F; line-height: 1.2; }
                .txt-calc-lance-2 { top: 177px; left: 519px; font-size: 22px; color: #013962; font-weight: bold; }

                .txt-lance-emb-label { top: 275px; left: 527px; font-size: 15px; color: #013962; font-weight: bold; }
                .val-lance-emb-rs { top: 307px; left: 527px; font-size: 16px; color: #6F6F6F; font-weight: bold; }
                .val-lance-emb-num { top: 295px; left: 546px; font-size: 34px; color: #6F6F6F; font-weight: bold; }
                .txt-lance-emb-desc { top: 346px; left: 527px; font-size: 14px; color: #6F6F6F; }

                .txt-pos-cont-1 { top: 153px; left: 934px; font-size: 20px; color: #6F6F6F; line-height: 1.2; }
                .txt-pos-cont-2 { top: 181px; left: 934px; font-size: 20px; color: #013962; font-weight: bold; }
                .val-pos-rs { top: 243px; left: 936px; font-size: 16px; color: #6F6F6F; font-weight: bold; }
                .val-pos-num { top: 231px; left: 956px; font-size: 38px; color: #6F6F6F; font-weight: bold; }
                .txt-aprox { top: 286px; left: 956px; font-size: 13px; color: #6F6F6F; }

                .txt-opcoes-lance { top: 504px; left: 527px; font-size: 18px; color: #013962; font-weight: bold; }
                .txt-opcoes-sub { top: 535px; left: 527px; font-size: 14px; color: #6F6F6F; }

                .txt-cred-liberado { top: 454px; left: 973px; font-size: 18px; color: #FFFFFF; }
                .val-cred-lib-rs { top: 496px; left: 973px; font-size: 16px; color: #FFFFFF; font-weight: bold; }
                .val-cred-lib-num { top: 485px; left: 997px; font-size: 38px; color: #FFFFFF; font-weight: bold; }

                .txt-estrategia { top: 614px; left: 972px; font-size: 14px; color: #6F6F6F; }
                .val-data-validade { top: 646px; left: 972px; font-size: 15px; color: #333333; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="slide"><img class="bg-slide" src="${img1}" /></div>
            <div class="slide"><img class="bg-slide" src="${img2}" /></div>
            <div class="slide"><img class="bg-slide" src="${img3}" /></div>
            <div class="slide">
                <div class="bg-painel-esquerdo"></div>
                <div class="bg-painel-azul-escuro"></div>
                <div class="bg-painel-inf-esquerdo"></div>
                <div class="bg-retangulo-azul-medio"></div>
                <div class="linha-horizontal-sup"></div>
                <div class="linha-vertical-central"></div>

                <div class="dinamico txt-simulacao">Simulação</div>
                <div class="dinamico txt-personalizada">personalizada</div>
                <div class="dinamico txt-composicao">Composição de crédito:</div>
                <div class="dinamico txt-cred-contratado">Crédito contratado:</div>
                
                <div class="dinamico val-cred-rs">R$</div>
                <div class="dinamico val-cred-num">${formatarMoeda(creditoContratado)}</div>

                <div class="dinamico txt-parc-integral">Parcela integral<br>até a contemplação:</div>
                <div class="dinamico val-parc-int-rs">R$</div>
                <div class="dinamico val-parc-int-num">${formatarMoeda(parcelaIntegral)} ${temAdesao ? '(c/ adesão)' : ''}</div>
                <div class="dinamico txt-sem-seguro">*sem seguro</div>

                <div class="dinamico txt-taxa-adm">Taxa de administração:</div>
                <div class="dinamico val-taxa-adm">${taxaAdm}%</div>

                <div class="dinamico txt-prazo-label">Prazo:</div>
                <div class="dinamico val-prazo-num">${prazo} meses</div>

                <div class="dinamico txt-administradora">Administradora:</div>
                <img class="dinamico img-logo-adm" src="${logoAdministradora}" alt="Logo Administradora" />

                <div class="dinamico txt-calc-lance-1">Calculo</div>
                <div class="dinamico txt-calc-lance-2">do lance:</div>

                <div class="dinamico txt-lance-emb-label">Lance embutido:</div>
                <div class="dinamico val-lance-emb-rs">R$</div>
                <div class="dinamico val-lance-emb-num">${formatarMoeda(valorLanceEmbutido)}</div>
                <div class="dinamico txt-lance-emb-desc">${percentualLanceEmbutido}% da própria carta</div>

                <div class="dinamico txt-pos-cont-1">Parcela</div>
                <div class="dinamico txt-pos-cont-2">Pós contemplação:</div>
                <div class="dinamico val-pos-rs">R$</div>
                <div class="dinamico val-pos-num">${formatarMoeda(parcelaPosContemplacao)}</div>
                <div class="dinamico txt-aprox">Aproximadamente</div>

                <div class="dinamico txt-opcoes-lance">Opções de lance:</div>
                <div class="dinamico txt-opcoes-sub">Lance embutido</div>

                <div class="dinamico txt-cred-liberado">Crédito liberado</div>
                <div class="dinamico val-cred-lib-rs">R$</div>
                <div class="dinamico val-cred-lib-num">${formatarMoeda(creditoLiberado)}</div>

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
        
        // Carrega o conteúdo de forma rápida aguardando apenas o DOM carregar
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Dá um respiro de 2 segundos para garantir que as imagens externas renderizaram no buffer
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