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
    document.getElementById('startSpelling').disabled = false;
    document.getElementById('speakAgain').disabled = false;
    speakWord(palabraActual);

}

function reiniciarPalabrasUsadas() {
    document.getElementById('resultText').textContent = '';
    const nivel = document.getElementById('difficulty').value;
    palabrasUsadasPorNivel[nivel] = [];
    // alert("Las palabras usadas para el nivel han sido reiniciadas.");
}

/**
 * @deprecated since 1.1, use nuevaPalabraSinRepetir instead
 * @returns nueva palabra version 1.0
 */
function nuevaPalabra() {
    debugger
    const nivel = document.getElementById('difficulty').value;
    const lista = palabras[nivel];
    if (!lista || lista.length === 0) {
        alert("No hay palabras cargadas para este nivel.");
        return;
    }
    palabraActual = lista[Math.floor(Math.random() * lista.length)];
    document.getElementById('wordDisplay').textContent = palabraActual;
    document.getElementById('resultText').textContent = '';
    document.getElementById('startSpelling').disabled = false;
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

    let paso = 1;

    function escucharSpelling() {
        document.getElementById('startSpelling').textContent = 'Listening...';
        document.getElementById('resultText').textContent = "Spelling (use 'capital' and 'space' if you need)...";
        recognition.start();
    }

    recognition.onresult = function (event) {
        const spoken = event.results[0][0].transcript.toLowerCase();
        console.log("Recognized:", spoken);

        if (paso === 1) {
            const deletreada = interpretarSpelling(spoken);
            console.log("Spelled:", deletreada);

            const original = palabraActual.toLowerCase().replace(/\s+/g, '');
            const spellingOk = deletreada === palabraActual;

            document.getElementById('resultText').innerHTML =
                `<strong>🎧 Heard:</strong> ${spoken}<br>` +
                `<strong>🧩 Spelled:</strong> ${deletreada}<br> ` +
                `<strong>${(spellingOk ? '✅ Correct!' : '❌ Incorrect.')}</strong>`;

            document.getElementById('startSpelling').textContent = '🎤 Start Spelling';

            paso = 1;
        }
    };

    escucharSpelling();
}

function interpretarSpelling(texto) {
    const palabras = texto.trim().split(/\s+/);
    let resultado = "";
    let capital = false;

    for (let palabra of palabras) {
        if (palabra === "capital") {
            capital = true;
        } else if (palabra === "space") {
            resultado += " ";
        } else if (/^[a-z]$/i.test(palabra)) {
            resultado += capital ? palabra.toUpperCase() : palabra.toLowerCase();
            capital = false;
        }
    }

    return resultado;
}

function speakWord(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // idioma inglés americano
    utterance.rate = 0.9; // velocidad un poco más lenta para mejor claridad
    speechSynthesis.speak(utterance);
}
