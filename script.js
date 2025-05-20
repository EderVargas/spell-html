let palabras = {};
let palabraActual = "";
const palabrasUsadasPorNivel = {};


fetch('assets/datos.json')
    .then(response => response.json())
    .then(data => { palabras = data; })
    .catch(error => {
        console.error("Error al cargar palabras.json:", error);
        alert("No se pudieron cargar las palabras.");
    });

// Función para obtener y mostrar una nueva palabra sin repetir
function nuevaPalabraSinRepetir() {
    actualizarVisibilidadPalabra();
    const nivel = document.getElementById('difficulty').value;
    const lista = palabras[nivel];
    if (!lista || lista.length === 0) {
        alert("No hay palabras cargadas para este nivel.");
        return;
    }

    // Inicializa la lista de palabras usadas si no existe
    if (!palabrasUsadasPorNivel[nivel]) {
        palabrasUsadasPorNivel[nivel] = [];
    }

    // Filtra palabras que aún no han sido usadas
    const restantes = lista.filter(p => !palabrasUsadasPorNivel[nivel].includes(p));
    if (restantes.length === 0) {
        alert("Ya se usaron todas las palabras para este nivel. Reinicia si deseas comenzar de nuevo.");
        return;
    }

    // Selecciona palabra aleatoria y la marca como usada
    palabraActual = restantes[Math.floor(Math.random() * restantes.length)];
    palabrasUsadasPorNivel[nivel].push(palabraActual);

    // Muestra la palabra en pantalla
    document.getElementById('wordDisplay').textContent = palabraActual;
    document.getElementById('resultText').textContent = '';
    desHabilitaBotonesSpell(false);
    speakWord(palabraActual);
}

function reiniciarPalabrasUsadas() {
    document.getElementById('resultText').textContent = '';
    const nivel = document.getElementById('difficulty').value;
    palabrasUsadasPorNivel[nivel] = [];
}

function iniciarEscucha() {
    if (!palabraActual) {
        alert("Primero genera una palabra para deletrear.");
        return;
    }
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Tu navegador no soporta reconocimiento de voz.');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Indicamos al usuario lo que tiene que decir
    document.getElementById('startSpelling').textContent = '🎤 Listening...';
    document.getElementById('resultText').textContent =
        "🔡 Spell and say the word (use 'capital', 'double', 'space')...";
    desHabilitaBotonesSpell(true);

    recognition.onresult = function (event) {
        const spoken = event.results[0][0].transcript.trim().toLowerCase();
        console.log("Recognized:", spoken);

        // Procesamos en un solo paso
        const { deletreada, finalPalabra } = interpretarSpellingConFinal(spoken);
        const original = palabraActual.toLowerCase().replace(/\s+/g, '');
        const spellingOk = deletreada === original;
        const palabraOk = finalPalabra === original;

        let resultadoHTML =
            `<strong>🧩 Spelled:</strong> ${deletreada}<br>` +
            `<strong>📣 Said:</strong> ${finalPalabra}<br>` +
            ((spellingOk && palabraOk)
                ? '✅ <strong>Correcto!</strong>'
                : '❌ <strong>Incorrecto.</strong>');

        document.getElementById('resultText').innerHTML = resultadoHTML;
        document.getElementById('startSpelling').textContent = '🎤 Start Spelling';
        document.getElementById('wordDisplay').classList.remove('hidden');
        desHabilitaBotonesSpell(false);
    };
    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
        alert("Ocurrió un error con el reconocimiento de voz. Intenta nuevamente.");
        document.getElementById('startSpelling').textContent = '🎤 Start Spelling';
        desHabilitaBotonesSpell(false);
    };
    recognition.start();
}

// Nueva versión: extrae deletreo y palabra final de un solo string
function interpretarSpellingConFinal(texto) {
    const tokens = texto.split(/\s+/);
    let resultado = "";
    let capital = false;
    let repetir = false;
    let i = 0;

    // Primero parseamos todo lo que sea deletreo
    for (; i < tokens.length; i++) {
        const w = tokens[i];
        if (w === "capital") {
            capital = true;
        }
        else if (w === "space") {
            resultado += " ";
        }
        else if (w === "double") {
            repetir = true;
        }
        else if (/^[a-z]$/i.test(w)) {
            const letra = capital ? w.toUpperCase() : w.toLowerCase();
            resultado += letra;
            if (repetir) {
                resultado += letra;
                repetir = false;
            }
            capital = false;
        }
        else {
            // Llegamos al final del deletreo
            break;
        }
    }

    // El resto de tokens es la palabra final dicha
    const finalPalabra = tokens.slice(i).join('').toLowerCase();

    // Fallback: si no hay deletreo pero toda la entrada es una palabra repetida (ej. "soda soda")
    if (resultado === "" && tokens.length >= 1) {
        const primer = tokens[0].toLowerCase();
        const resto = tokens.slice(1).join('').toLowerCase();
        if (primer === resto) {
            return {
                deletreada: primer,
                finalPalabra: primer
            };
        }
    }

    return {
        deletreada: resultado.toLowerCase(),
        finalPalabra
    };
}

function desHabilitaBotonesSpell(disabled) {
    document.getElementById('startSpelling').disabled = disabled;
    document.getElementById('speakAgain').disabled = disabled;
    document.getElementById('newWord').disabled = disabled;
    document.getElementById('restartWord').disabled = disabled;
}

function speakWord(text) {
    actualizarVisibilidadPalabra();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    speechSynthesis.speak(u);
}
|
    function actualizarVisibilidadPalabra() {
        const checkbox = document.getElementById('showWordCheckbox');
        const wordDisplay = document.getElementById('wordDisplay');
        wordDisplay.classList.toggle('hidden', !checkbox.checked);
    }

// Comando uglificar uglifyjs script.js -c -m -o script.min.js