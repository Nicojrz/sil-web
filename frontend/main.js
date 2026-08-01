const MANUAL_CONTEXTO = "Reglas de Operación Fertilizantes 2026. Artículo 4: Requisitos esenciales: CURP, Identificación (INE). Artículo 7: Casos de predios a nombre de familiares fallecidos (Sucesión): El productor debe presentar obligatoriamente el Acta de Defunción del titular original y la Constancia de Posesión Comunitaria avalada por el Comisariado Ejidal.";

// Datos del caso práctico procesado por Gemma 4
const CASO_SIMULADO = {
    audioTraducido: "Traigo los papeles de la milpa de mi papá que ya murió, quiero ver si me toca el abono gratis de maíz.",
    protocoloGemma: [
        "Sucesión de tierra detectada (Productor cultiva predio de padre fallecido).",
        "Solicitar al productor el Acta de Defunción de su padre.",
        "Solicitar la Constancia de Posesión avalada por su Comisariado Ejidal."
    ]
};

const DEMO_TURNS = [
    {
        image: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="100%" height="100%" rx="24" fill="#eef7ea"/><circle cx="160" cy="88" r="54" fill="#2a6f4b"/><path d="M112 132c14-26 42-40 96-40 22 0 36 3 48 8v24H112z" fill="#91c788"/><text x="160" y="156" text-anchor="middle" font-size="22" font-family="Segoe UI" fill="#122a14">Milpa y cosecha</text></svg>`),
        indigenous: 'Nawatlahtolli: “Tlahtolli tlen tlacuiloque, tlapalehuiliztli tlen tlacatl”.',
        español: 'El productor expresa que necesita apoyo para su trámite.'
    },
    {
        image: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="100%" height="100%" rx="24" fill="#f4f9f4"/><rect x="78" y="58" width="164" height="84" rx="18" fill="#ffffff" stroke="#2a6f4b" stroke-width="4"/><rect x="96" y="76" width="124" height="18" rx="8" fill="#91c788"/><rect x="96" y="102" width="92" height="14" rx="7" fill="#2a6f4b"/><text x="160" y="152" text-anchor="middle" font-size="22" font-family="Segoe UI" fill="#122a14">Documentos del trámite</text></svg>`),
        indigenous: 'Maayat’aan: “K’aax wa yaan u ka’anal ti’ le k’áax”.',
        español: 'Solicita verificar los documentos y el acta de defunción.'
    },
    {
        image: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="100%" height="100%" rx="24" fill="#fffaf1"/><circle cx="158" cy="86" r="48" fill="#2a6f4b"/><path d="M120 126h76v18h-76z" fill="#91c788"/><path d="M116 88h76" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M138 68l20 20 38-38" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="160" y="154" text-anchor="middle" font-size="22" font-family="Segoe UI" fill="#122a14">Paso siguiente</text></svg>`),
        indigenous: 'Bats’i k’op: “Yik’otik ta ya ti’ k’opojel”.',
        español: 'Se confirma el siguiente paso del trámite con el funcionario.'
    }
];

// Estado dinámico del software institucional
let appState = {
    selectedLang: '',
    currentScreen: 'inicio', // inicio, ventanilla, procesando, copiloto
    chatStage: 'idle', // idle, listening, translated, steps, instructions
    controlMode: 'mic', // mic, speaker
    sessionId: null,
    currentReply: null,
    isLoading: false,
    errorMessage: '',
    demoTurns: [],
    demoIndex: 0
};

async function createSession() {
    const response = await fetch('http://127.0.0.1:8000/api/session', {
        method: 'POST'
    });
    const data = await response.json();
    appState.sessionId = data.session_id;
}

async function sendMessageToBackend(message) {
    if (!appState.sessionId) {
        await createSession();
    }

    appState.isLoading = true;
    appState.errorMessage = '';
    renderApp();

    try {
        const response = await fetch('http://127.0.0.1:8000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: appState.sessionId,
                message,
                speaker: 'productor'
            })
        });

        if (!response.ok) {
            throw new Error('No fue posible contactar al backend.');
        }

        const data = await response.json();
        appState.currentReply = data;
        appState.chatStage = 'translated';
        appState.controlMode = 'speaker';
    } catch (error) {
        appState.errorMessage = error.message || 'Ocurrió un error inesperado.';
        appState.currentReply = null;
    } finally {
        appState.isLoading = false;
        renderApp();
    }
}

// Renderizador dinámico de vistas minimalistas
function renderApp() {
    const root = document.getElementById('app-root');
    root.innerHTML = '';

    if (appState.currentScreen === 'inicio') {
        root.innerHTML = `
            <div class="app-screen">
                <div class="gob-header">
                    <div class="header-brand">
                        <img src="../sil-logo.png" alt="SIL" class="app-logo">
                        <div>
                            <h1>Fertilizantes para el Bienestar</h1>
                            <p>Módulo Autónomo de Inclusión Lingüística — Copiloto de Ventanilla</p>
                        </div>
                    </div>
                </div>
                
                <h2 class="screen-title">Seleccione la autodenominación lingüística del productor:</h2>
                
                <div class="lang-grid">
                    <div class="lang-card" onclick="selectLanguage('Náhuatl')">
                        <div class="lang-main-info">
                            <div>
                                <div class="lang-autodenominacion">Nawatlahtolli</div>
                                <div class="lang-subtitulo">Náhuatl</div>
                            </div>
                            <img class="lang-img" src="https://media.gettyimages.com/id/1423666780/es/vector/icono-de-l%C3%ADnea-delgada-de-cornstalks-sobre-fondo-blanco-trazo-editable.jpg?s=612x612&w=gi&k=20&c=O2MAnwu3BjI7koJlpic4_efFtb0NiRpAgYnWtraxFCs=" alt="Náhuatl - Maíz">
                        </div>
                        <div style="display:flex; justify-content:flex-end;">
                            <button class="audio-btn" onclick="playAudioPrompt(event, 'Náhuatl')">▶</button>
                        </div>
                    </div>

                    <div class="lang-card" onclick="selectLanguage('Maya')">
                        <div class="lang-main-info">
                            <div>
                                <div class="lang-autodenominacion">Maayat'aan</div>
                                <div class="lang-subtitulo">Maya</div>
                            </div>
                            <img class="lang-img" src="https://i.pinimg.com/736x/3c/66/a4/3c66a4407376015ab8577917547e580a.jpg" alt="Maya - Frijol/Milpa">
                        </div>
                        <div style="display:flex; justify-content:flex-end;">
                            <button class="audio-btn" onclick="playAudioPrompt(event, 'Maya')">▶</button>
                        </div>
                    </div>

                    <div class="lang-card" onclick="selectLanguage('Tsotsil')">
                        <div class="lang-main-info">
                            <div>
                                <div class="lang-autodenominacion">Bats'i k'op</div>
                                <div class="lang-subtitulo">Tsotsil</div>
                            </div>
                            <img class="lang-img" src="https://www.educima.com/img/thumbnails/0/montana-10450.jpg" alt="Tsotsil - Montaña">
                        </div>
                        <div style="display:flex; justify-content:flex-end;">
                            <button class="audio-btn" onclick="playAudioPrompt(event, 'Tsotsil')">▶</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } 
    
    else if (appState.currentScreen === 'ventanilla') {
        const conversationFeed = appState.demoTurns.length
            ? appState.demoTurns.map((entry) => `
                <div class="demo-bubble">
                    <img class="demo-image" src="${entry.image}" alt="Escena del trámite">
                    <div class="demo-content">
                        <div class="demo-label">Lengua indígena</div>
                        <div class="demo-text">${entry.indigenous}</div>
                        <div class="demo-label">Español</div>
                        <div class="demo-text translated">${entry.español}</div>
                    </div>
                </div>
            `).join('')
            : `
                <div class="chat-bubble bot">
                    Presiona el botón para iniciar la simulación de la conversación y ver los mensajes en el chat.
                </div>
            `;

        root.innerHTML = `
            <div class="app-screen">
                <div class="gob-header">
                    <div class="header-brand">
                        <img src="logo-sil.svg" alt="SIL logo" class="app-logo">
                        <div>
                            <h1>Canal Activo: ${appState.selectedLang}</h1>
                            <p>Simulación para exposición: cada clic registra un nuevo turno bilingüe</p>
                        </div>
                    </div>
                </div>
                
                <div class="chat-shell">
                    <div class="chat-header">
                        <div>
                            <h3>Conversación asistida</h3>
                            <p>Se muestran los textos en lengua indígena y en español para cada turno.</p>
                        </div>
                    </div>

                    <div class="chat-messages">
                        ${conversationFeed}
                        ${appState.isLoading ? '<div class="chat-bubble bot">Registrando turno...</div>' : ''}
                        ${appState.errorMessage ? `<div class="chat-bubble bot">${appState.errorMessage}</div>` : ''}
                    </div>

                    <div class="chat-bottom-row">
                        <div class="chat-action-group">
                            <div class="suggestion-text">
                                ${appState.demoIndex >= DEMO_TURNS.length ? 'Demostración finalizada' : `Turno ${appState.demoIndex + 1} de ${DEMO_TURNS.length}`}
                            </div>
                            <button id="mic-btn" class="control-button mic-button" onclick="animateAndStartListening()" title="Registrar siguiente turno">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"/></svg>
                            </button>
                            <button class="btn-secondary" onclick="resetDemoConversation()">Reiniciar</button>
                        </div>
                    </div>
                </div>

                <div class="back-row">
                    <button class="btn-secondary" onclick="changeScreen('inicio')">← Volver al selector de lenguas</button>
                </div>
            </div>
        `;
    } 
    
    else if (appState.currentScreen === 'procesando') {
        root.innerHTML = `
            <div class="app-screen">
                <div class="gob-header">
                    <div class="header-brand">
                        <img src="logo-sil.svg" alt="SIL logo" class="app-logo">
                        <div>
                            <h1>Análisis de Reglas de Operación</h1>
                            <p>Procesamiento Periférico y Local Exclusivo</p>
                        </div>
                    </div>
                </div>
                <div class="loader-text">
                    <p style="margin-bottom:15px; font-weight:600;">Traduciendo audio en canal de origen...</p>
                    <p style="color:var(--gob-dorado);">Gemma 4 contrastando criterios del manual legal sin tecnicismos...</p>
                </div>
            </div>
        `;
        setTimeout(() => {
            changeScreen('copiloto');
        }, 2000);
    } 
    
    else if (appState.currentScreen === 'copiloto') {
        root.innerHTML = `
            <div class="app-screen">
                <div class="gob-header">
                    <div class="header-brand">
                        <img src="logo-sil.svg" alt="SIL logo" class="app-logo">
                        <div>
                            <h1>Copiloto de Trámite — Gemma 4</h1>
                            <p>Guía Normativa Simplificada de Ventanilla</p>
                        </div>
                    </div>
                </div>
                
                <div class="ventanilla-layout">
                    <div class="data-panel">
                        <h3 style="font-size: 1.1rem; font-weight: 700;">Entrada del Traductor de Voz:</h3>
                        <div class="transcript-box">
                            "${CASO_SIMULADO.audioTraducido}"
                        </div>
                        
                        <div class="gemma-box">
                            <h4>Protocolo de Operación Sugerido</h4>
                            <ul>
                                ${CASO_SIMULADO.protocoloGemma.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:16px; padding-top:32px;">
                        <button id="tts-btn" class="tts-circle" onclick="playResponseTTS()" title="Emitir instrucciones en ${appState.selectedLang}">🔊</button>
                        <button class="btn-secondary" onclick="changeScreen('ventanilla')">Finalizar y abrir nueva consulta</button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Controladores de interacciones locales
function selectLanguage(lang) {
    appState.selectedLang = lang;
    resetDemoConversation();
    changeScreen('ventanilla');
}

function changeScreen(screenName) {
    appState.currentScreen = screenName;
    renderApp();
}

function playAudioPrompt(event, lang) {
    event.stopPropagation();
    alert(`[Audio Local]: Emitiendo saludo sonoro de rastreo en la lengua autodenominada (${lang}).`);
}

function animateControl(buttonId) {
    const btn = document.getElementById(buttonId);
    if (btn) {
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 220);
    }
}

function addDemoTurn() {
    if (appState.demoIndex >= DEMO_TURNS.length) {
        appState.errorMessage = 'La simulación ya terminó. Presiona Reiniciar para volver a empezar.';
        renderApp();
        return;
    }

    appState.isLoading = true;
    appState.errorMessage = '';
    renderApp();

    setTimeout(() => {
        const turn = DEMO_TURNS[appState.demoIndex];
        appState.demoTurns.push(turn);
        appState.demoIndex += 1;
        appState.chatStage = 'translated';
        appState.controlMode = 'speaker';
        appState.isLoading = false;
        renderApp();
    }, 600);
}

function startListening() {
    appState.chatStage = 'listening';
    appState.controlMode = 'mic';
    renderApp();

    const btn = document.getElementById('mic-btn');
    if (btn) {
        btn.classList.add('listening');
    }

    setTimeout(() => {
        addDemoTurn();
        if (btn) {
            btn.classList.remove('listening');
        }
    }, 500);
}

function animateAndStartListening() {
    animateControl('mic-btn');
    startListening();
}

function playStepSuggestions() {
    if (appState.currentReply) {
        appState.chatStage = 'steps';
        appState.controlMode = 'speaker';
        renderApp();

        setTimeout(() => {
            appState.chatStage = 'idle';
            appState.controlMode = 'mic';
            renderApp();
        }, 1600);
    }
}

function animateAndPlaySuggestions() {
    animateControl('tts-btn');
    playStepSuggestions();
}

function playResponseTTS() {
    if (appState.currentReply) {
        appState.chatStage = 'instructions';
        appState.controlMode = 'speaker';
        renderApp();

        setTimeout(() => {
            appState.chatStage = 'idle';
            appState.controlMode = 'mic';
            renderApp();
        }, 1600);
    }
}

function resetDemoConversation() {
    appState.demoTurns = [];
    appState.demoIndex = 0;
    appState.chatStage = 'idle';
    appState.controlMode = 'mic';
    appState.errorMessage = '';
    renderApp();
}

document.addEventListener('DOMContentLoaded', () => {
    renderApp();
});