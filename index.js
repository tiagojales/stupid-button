const express = require('express');
const app = express();
const port = 3000;

// Versão da aplicação
const APP_VERSION = '1.0.1';

// ============================================
// SISTEMA DE LOGGING PROFISSIONAL
// ============================================

// Níveis de log
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// Nível atual (produção = INFO, desenvolvimento = DEBUG)
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

// Função para formatar timestamp
function getTimestamp() {
    return new Date().toISOString();
}

// Função principal de log
function log(level, message, meta = {}) {
    // Verifica se deve logar baseado no nível
    const levels = Object.values(LOG_LEVELS);
    const currentIndex = levels.indexOf(CURRENT_LOG_LEVEL);
    const messageIndex = levels.indexOf(level);
    
    if (messageIndex > currentIndex) return;

    const logEntry = {
        timestamp: getTimestamp(),
        level: level,
        service: 'stupid-button',
        version: APP_VERSION,
        message: message,
        ...meta
    };

    // Em produção, logs em JSON para facilitar parsing
    if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify(logEntry));
    } else {
        // Em desenvolvimento, formato legível
        const prefix = `[${logEntry.timestamp}] [${level}]`;
        console.log(`${prefix} ${message}`);
        if (Object.keys(meta).length > 0) {
            console.log(`  └─ ${JSON.stringify(meta)}`);
        }
    }
}

// Helpers para cada nível
const logger = {
    error: (message, meta) => log(LOG_LEVELS.ERROR, message, meta),
    warn: (message, meta) => log(LOG_LEVELS.WARN, message, meta),
    info: (message, meta) => log(LOG_LEVELS.INFO, message, meta),
    debug: (message, meta) => log(LOG_LEVELS.DEBUG, message, meta)
};

// ============================================
// MÉTRICAS E ESTATÍSTICAS
// ============================================

const metrics = {
    totalRequests: 0,
    totalClicks: 0,
    totalResets: 0,
    errors: 0,
    startTime: Date.now(),
    users: new Set()
};

// Armazenar contadores por sessão
const contadores = new Map();
let proximoId = 1;

// ============================================
// MIDDLEWARES
// ============================================

// Middleware de logging de requisições
app.use((req, res, next) => {
    const startTime = Date.now();
    metrics.totalRequests++;
    
    // Log da requisição
    logger.info(`Requisição recebida`, {
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    });

    // Interceptar resposta para log
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - startTime;
        logger.info(`Resposta enviada`, {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
        originalSend.call(this, data);
    };

    next();
});

// Middleware para servir arquivos estáticos
app.use(express.static('public'));
app.use(express.json());

// Middleware para identificar usuários
app.use((req, res, next) => {
    let userId = req.headers.cookie?.split('; ').find(row => row.startsWith('userId='))?.split('=')[1];
    
    if (!userId) {
        userId = proximoId++;
        contadores.set(userId, 0);
        res.setHeader('Set-Cookie', [`userId=${userId}; Path=/; HttpOnly`]);
        metrics.users.add(userId);
        
        logger.info(`Novo usuário criado`, {
            userId: userId,
            totalUsers: metrics.users.size
        });
    }
    
    req.userId = userId;
    req.userId = userId;
    next();
});

// ============================================
// ROTAS
// ============================================

// Rota para obter o contador do usuário atual
app.get('/api/contador', (req, res) => {
    const contador = contadores.get(req.userId) || 0;
    
    logger.debug(`Contador consultado`, {
        userId: req.userId,
        contador: contador
    });
    
    res.json({ contador });
});

// Rota para incrementar o contador do usuário atual
app.post('/api/incrementar', (req, res) => {
    const contadorAtual = contadores.get(req.userId) || 0;
    contadores.set(req.userId, contadorAtual + 1);
    metrics.totalClicks++;
    
    logger.info(`Clique registrado`, {
        userId: req.userId,
        novoValor: contadores.get(req.userId),
        totalCliques: metrics.totalClicks
    });
    
    res.json({ contador: contadores.get(req.userId) });
});

// Rota para zerar o contador do usuário atual
app.post('/api/zerar', (req, res) => {
    contadores.set(req.userId, 0);
    metrics.totalResets++;
    
    logger.info(`Contador zerado`, {
        userId: req.userId,
        totalResets: metrics.totalResets
    });
    
    res.json({ contador: 0 });
});

// Rota para obter a versão
app.get('/api/version', (req, res) => {
    logger.debug(`Versão consultada`, { version: APP_VERSION });
    res.json({ version: APP_VERSION });
});

// Rota para métricas (monitoramento)
app.get('/api/metrics', (req, res) => {
    const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
    
    logger.info(`Métricas consultadas`, {
        uptime: `${Math.floor(uptime / 60)} minutos`,
        totalRequests: metrics.totalRequests,
        totalClicks: metrics.totalClicks,
        totalResets: metrics.totalResets,
        activeUsers: metrics.users.size
    });
    
    res.json({
        uptime: `${Math.floor(uptime / 60)} minutos`,
        totalRequests: metrics.totalRequests,
        totalClicks: metrics.totalClicks,
        totalResets: metrics.totalResets,
        activeUsers: metrics.users.size,
        version: APP_VERSION
    });
});

// Rota para health check (para load balancer)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: getTimestamp(),
        version: APP_VERSION,
        uptime: Math.floor((Date.now() - metrics.startTime) / 1000)
    });
});

// Rota principal
app.get('/', (req, res) => {
    logger.info(`Página principal acessada`, {
        userId: req.userId
    });
    
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Botão Estúpido</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #ffffff 0%, #636363 100%);
                    margin: 0;
                }
                .container {
                    text-align: center;
                    background: white;
                    padding: 50px;
                    border-radius: 25px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 500px;
                    width: 90%;
                    position: relative;
                }
                h1 {
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 2.8em;
                }
                .subtitle {
                    color: #888;
                    margin-bottom: 30px;
                    font-size: 1em;
                }
                .contador {
                    font-size: 5em;
                    font-weight: bold;
                    color: #4a4a4a;
                    margin: 20px 0;
                }
                .texto-contador {
                    font-size: 1.2em;
                    color: #666;
                    margin-bottom: 10px;
                }
                .botao {
                    background: #db0000;
                    color: white;
                    border: none;
                    padding: 20px 50px;
                    font-size: 1.8em;
                    border-radius: 60px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(90, 39, 39, 0.4);
                    margin: 10px 0;
                    width: 100%;
                    font-weight: bold;
                }
                .botao:hover {
                    transform: scale(1.05);
                    background: #ff0000;
                    box-shadow: 0 6px 25px rgba(143, 63, 63, 0.6);
                }
                .botao:active {
                    transform: scale(0.95);
                }
                .botao-zerar {
                    background: #4a4a4a;
                    box-shadow: 0 4px 15px rgba(74, 74, 74, 0.3);
                    font-size: 1em;
                    padding: 12px 30px;
                    width: auto;
                    margin-top: 15px;
                }
                .botao-zerar:hover {
                    background: #333;
                    box-shadow: 0 6px 20px rgba(74, 74, 74, 0.5);
                }
                .footer {
                    margin-top: 25px;
                    color: #999;
                    font-size: 0.85em;
                }
                .version {
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    font-size: 0.7em;
                    color: #bbb;
                    background: #f5f5f5;
                    padding: 3px 10px;
                    border-radius: 12px;
                }
                @keyframes confete {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
                }
                .confete {
                    position: fixed;
                    font-size: 2em;
                    pointer-events: none;
                    animation: confete 1s ease-out forwards;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="version" id="versionDisplay">v1.0.0</div>
                
                <h1>Botão Estúpido</h1>
                <p class="subtitle">Seu contador pessoal!</p>
                
                <div class="texto-contador">Seus cliques:</div>
                <div class="contador" id="contadorDisplay">0</div>
                
                <button class="botao" id="botaoEstupido">
                    Clique aqui!
                </button>
                
                <button class="botao botao-zerar" id="botaoZerar">
                    Zerar contador
                </button>
                
                <div class="footer">
                    Cada clique é só seu!
                </div>
            </div>

            <script>
                const botao = document.getElementById('botaoEstupido');
                const botaoZerar = document.getElementById('botaoZerar');
                const contadorDisplay = document.getElementById('contadorDisplay');
                const versionDisplay = document.getElementById('versionDisplay');

                async function buscarVersao() {
                    try {
                        const response = await fetch('/api/version');
                        const data = await response.json();
                        versionDisplay.textContent = 'v' + data.version;
                    } catch (error) {
                        console.error('Erro ao buscar versão:', error);
                    }
                }

                async function atualizarContador() {
                    try {
                        const response = await fetch('/api/contador');
                        const data = await response.json();
                        contadorDisplay.textContent = data.contador;
                    } catch (error) {
                        console.error('Erro ao buscar contador:', error);
                    }
                }

                async function incrementarContador() {
                    try {
                        const response = await fetch('/api/incrementar', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        const data = await response.json();
                        contadorDisplay.textContent = data.contador;
                        criarConfetes();
                    } catch (error) {
                        console.error('Erro ao incrementar contador:', error);
                    }
                }

                async function zerarContador() {
                    if (confirm('Tem certeza que quer zerar seu contador?')) {
                        try {
                            const response = await fetch('/api/zerar', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                            const data = await response.json();
                            contadorDisplay.textContent = data.contador;
                        } catch (error) {
                            console.error('Erro ao zerar contador:', error);
                        }
                    }
                }

                function criarConfetes() {
                    const emojis = ['🎉', '✨', '⭐', '🌟', '💫', '🎊', '❤️', '😄'];
                    for (let i = 0; i < 8; i++) {
                        setTimeout(() => {
                            const confete = document.createElement('div');
                            confete.className = 'confete';
                            confete.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                            confete.style.left = Math.random() * 80 + 10 + '%';
                            confete.style.top = Math.random() * 40 + 30 + '%';
                            confete.style.fontSize = (Math.random() * 1.5 + 1) + 'em';
                            document.body.appendChild(confete);
                            
                            setTimeout(() => {
                                confete.remove();
                            }, 1000);
                        }, i * 100);
                    }
                }

                botao.addEventListener('click', incrementarContador);
                botaoZerar.addEventListener('click', zerarContador);

                buscarVersao();
                atualizarContador();
            </script>
        </body>
        </html>
    `);
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
    logger.error(`Erro não tratado`, {
        error: error.message,
        stack: error.stack
    });
    // Em produção, não sair do processo
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Promise rejeitada não tratada`, {
        reason: reason,
        promise: promise
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(port, () => {
    logger.info(`Servidor iniciado com sucesso`, {
        port: port,
        environment: process.env.NODE_ENV || 'development',
        version: APP_VERSION,
        logLevel: CURRENT_LOG_LEVEL
    });
    
    logger.info(`Endpoints disponíveis:`, {
        endpoints: [
            'GET  /',
            'GET  /health',
            'GET  /api/version',
            'GET  /api/contador',
            'POST /api/incrementar',
            'POST /api/zerar',
            'GET  /api/metrics'
        ]
    });
});