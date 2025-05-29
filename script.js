let palabras = {};
let palabraActual = "";
const palabrasUsadasPorNivel = {};
let recognition = null;

let modo = 'oneStep';      // 'oneStep' | 'multiStep'
let pasoMulti = 0;         // 0 = inicial, 1 = spell, 2 = final

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
    recognition = new SpeechRecognition();
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
        const {palabraInicial, deletreada, finalPalabra } = interpretarSpellingConFinal(spoken);
        const original = palabraActual.toLowerCase().replace(/\s+/g, '');
        const spellingOk = deletreada === original;
        const palabraOk = finalPalabra === original && palabraInicial === original;

        let resultadoHTML =
            `<strong>🎧 Heard:</strong> ${spoken}<br>` +
            `<strong>🔤 Inicial:</strong> ${palabraInicial}<br>` +
            `<strong>🧩 Spelled:</strong> ${deletreada}<br>` +
            `<strong>📣 Final:</strong> ${finalPalabra}<br>` +
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
    recognition.onend = function () {
        // Si termina sin resultado
        if (document.getElementById('startSpelling').textContent === '🎤 Listening...') {
            document.getElementById('startSpelling').textContent = '🎤 Start Spelling';
            desHabilitaBotonesSpell(false);
        }
    };
    recognition.start();
}

/**
 * Parsea una sola entrada de voz con esta regla:
 * 1) Di la palabra inicial
 * 2) Spell (letras, 'capital', 'double', 'space')
 * 3) Vuelve a decir la palabra final
 *
 * Devuelve un objeto con:
 * - palabraInicial: lo primero que dijo el usuario
 * - deletreada: el resultado del spelling
 * - finalPalabra: lo que dijo al final
 */
function interpretarSpellingConFinal(texto) {
    const tokens = texto.trim().split(/\s+/);
    // 1) Tomamos la primera palabra como palabraInicial
    const palabraInicial = tokens[0].toLowerCase();

    let resultado = "";
    let capital = false;
    let repetir = false;
    let i = 1; // arrancamos parsing de spelling desde el segundo token

    // 2) Parseamos todo lo que sea parte del spelling
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
            // encontramos algo que no encaja en spelling → pasamos a final
            break;
        }
    }

    // 3) El resto de tokens lo unimos como finalPalabra
    const finalPalabra = tokens
        .slice(i)
        .join("")
        .toLowerCase();

    // Fallback: si no se pudo deletrear nada, pero inicial y final coinciden
    if (!resultado && finalPalabra === palabraInicial) {
        resultado = palabraInicial;
    }

    return {
        palabraInicial,
        deletreada: resultado.toLowerCase(),
        finalPalabra
    };
}

function desHabilitaBotonesSpell(disabled) {
    document.getElementById('startSpelling').disabled = disabled;
    document.getElementById('speakAgain').disabled = disabled;
    document.getElementById('newWord').disabled = disabled;
    document.getElementById('restartWord').disabled = disabled;
    if (disabled) {
        document.getElementById('stopListening').classList.remove('hidden');
    } else {
        document.getElementById('stopListening').classList.add('hidden');
    }
    // document.getElementById('stopListening').disabled = !disabled;
}

function speakWord(text) {
    actualizarVisibilidadPalabra();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    speechSynthesis.speak(u);
}

function actualizarVisibilidadPalabra() {
    const checkbox = document.getElementById('showWordCheckbox');
    const wordDisplay = document.getElementById('wordDisplay');
    wordDisplay.classList.toggle('hidden', !checkbox.checked);
}

document.getElementById('stopListening').addEventListener('click', () => {
    if (recognition) {
        recognition.abort();
        document.getElementById('startSpelling').textContent = '🎤 Start Spelling';
        desHabilitaBotonesSpell(false);
        document.getElementById('resultText').textContent = '⏹️ Escucha interrumpida.';
    }
});

function onChangeMode() {
  modo = document.getElementById('modeSelect').value;
  const one = document.getElementById('oneStepButtons');
  const stepBtn = document.getElementById('stepSpellingBtn');
  if (modo === 'oneStep') {
    one.classList.remove('hidden');
    stepBtn.classList.add('hidden');
  } else {
    one.classList.add('hidden');
    stepBtn.classList.remove('hidden');
    pasoMulti = 0;  // reinicia el flujo al cambiar
    stepSpellingBtn.textContent = '▶️ Say Initial';
    desHabilitaBotonesSpell(false);
    document.getElementById('resultText').textContent = '';
  }
}

function proximoPaso() {
  if (!palabraActual) {
    alert("Primero genera una palabra para deletrear.");
    return;
  }
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    alert('Tu navegador no soporta reconocimiento de voz.');
    return;
  }

  // Inicializamos recognition si no existe
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  // Deshabilita el botón mientras escucha
  document.getElementById('stepSpellingBtn').disabled = true;
  document.getElementById('resultText').textContent =
    pasoMulti === 0 
      ? '🗣️ Say the word first...' 
      : pasoMulti === 1
        ? "🔡 Spell it now..."
        : "📣 Say the word again...";

  recognition.onresult = event => {
    const spoken = event.results[0][0].transcript.trim().toLowerCase();
    if (pasoMulti === 0) {
      // 1) palabra inicial
      document.getElementById('resultText').innerHTML =
        `<strong>Initial:</strong> ${spoken}`;
      pasoMulti = 1;
      stepSpellingBtn.textContent = '🔤 Spell';
    }
    else if (pasoMulti === 1) {
      // 2) spelling
      const deletreada = interpretarSpellingConFinal(spoken).deletreada;
      document.getElementById('resultText').innerHTML +=
        `<br><strong>Spelled:</strong> ${deletreada}`;
      pasoMulti = 2;
      stepSpellingBtn.textContent = '📣 Final Word';
    }
    else {
      // 3) palabra final
      document.getElementById('resultText').innerHTML +=
        `<br><strong>Final:</strong> ${spoken}`;
      // Validación completa:
      const orig = palabraActual.toLowerCase().replace(/\s+/g,'');
      const initialOk = spoken.split(/\s+/)[0] === palabraActual;
      const spelledOk  = interpretarSpellingConFinal(
                          document.querySelector('#resultText').textContent
                        ).deletreada === orig;
      const finalOk    = spoken.replace(/\s+/g,'') === orig;
      const ok = initialOk && spelledOk && finalOk;
      document.getElementById('resultText').innerHTML +=
        `<br>${ok ? '✅ Correct!' : '❌ Incorrect.'}`;
      // reset
      pasoMulti = 0;
      stepSpellingBtn.textContent = '▶️ Say Initial';
      document.getElementById('wordDisplay').classList.remove('hidden');
    }

    document.getElementById('stepSpellingBtn').disabled = false;
    recognition = null;
  };

  recognition.onerror = () => {
    document.getElementById('resultText').textContent =
      '⚠️ Error recognizing. Try again.';
    document.getElementById('stepSpellingBtn').disabled = false;
    recognition = null;
  };

  recognition.start();
}

window.addEventListener('DOMContentLoaded', onChangeMode);


// Comando uglificar uglifyjs script.js -c -m -o script.min.js