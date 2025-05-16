let palabras = {};
let palabraActual = "";

fetch('assets/datos.json')
    .then(response => response.json())
    .then(data => { palabras = data; })
    .catch(error => {
        console.error("Error al cargar palabras.json:", error);
        alert("No se pudieron cargar las palabras.");
    });

function nuevaPalabra() {
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
                `🧩 Spelled: ${deletreada}<br> ` +
                (spellingOk ? '✅ Correct!' : '❌ Incorrect.');

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
