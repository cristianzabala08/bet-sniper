/**
 * Simulador de bot de señales para desarrollo local.
 *
 * Este entorno local no tiene un bot/scraper real conectado a mesas de
 * Baccarat en vivo, así que nada llega a /webhook/signals/receive por su
 * cuenta. Este script simula ese bot: abre una señal en la mesa
 * "Baccarat" y avanza el patrón de martingala paso a paso (pierde,
 * recalcula, vuelve a intentar) hasta ganar o agotar los 6 pasos —
 * igual que el flujo real — todo contra el mismo endpoint que usaría
 * un bot de producción.
 *
 * Uso:
 *   node simulate-bot.js
 *
 * Requiere que SIGNAL_WEBHOOK_SECRET esté configurado en .env (ya se hizo
 * para este entorno local) y que el backend esté corriendo en localhost:8000.
 *
 * Ctrl+C para detenerlo.
 */

const BASE_URL = process.env.BOT_SIM_BASE_URL || 'http://localhost:8000';
const SECRET = process.env.SIGNAL_WEBHOOK_SECRET || 'local_dev_test_secret_123';
const MESA = 'Baccarat';

const SIGNAL_OPEN_WAIT_MS = 6000;  // tiempo "jugando" antes del primer resultado
const STEP_WAIT_MS = 7000;         // pausa entre cada paso de martingala
const ROUND_GAP_MS = 8000;         // pausa entre una ronda cerrada y la siguiente
const MAX_MARTINGALA_STEPS = 6;
const WIN_CHANCE_PER_STEP = 0.45;  // probabilidad de ganar en cada paso individual

let ronda = Math.floor(Math.random() * 50) + 1;
let running = true;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomForecastVector() {
  // Distribución realista: Jugador/Banquero dominan, Empate es raro.
  const weighted = ['P', 'P', 'P', 'P', 'B', 'B', 'B', 'B', 'T'];
  return Array.from({ length: 6 }, () => weighted[Math.floor(Math.random() * weighted.length)]);
}

async function post(payload) {
  const res = await fetch(`${BASE_URL}/webhook/signals/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function openSignal(vectorForecast, rondaActual) {
  const body = {
    signal: {
      nombre_mesa: MESA,
      ronda_actual: rondaActual,
      vector_forecast: vectorForecast,
      vector_resultado: [],
      vector_win: [],
      numero_martingala: 0,
    },
  };
  const result = await post(body);
  if (result?.result) {
    console.log(`[bot-sim] Señal abierta — ${MESA} ronda ${rondaActual} — forecast ${vectorForecast.join('')}`);
  } else {
    console.log(`[bot-sim] Señal ignorada (ya había una abierta en ${MESA}) — ronda ${rondaActual}`);
  }
  return !!result?.result;
}

/** Envía el resultado de UN paso de martingala. No cierra la señal salvo que gane o llegue al paso 6. */
/** Genera puntajes 0-9 de Baccarat coherentes con quién ganó la mano (P/B/T). */
function scoresFor(resultadoChar) {
  const rand = () => Math.floor(Math.random() * 10);
  if (resultadoChar === 'T') {
    const tie = rand();
    return { player: tie, banker: tie };
  }
  let player = rand();
  let banker = rand();
  if (resultadoChar === 'P' && player <= banker) {
    [player, banker] = [Math.max(player, banker), Math.min(player, banker)];
  } else if (resultadoChar === 'B' && banker <= player) {
    [player, banker] = [Math.min(player, banker), Math.max(player, banker)];
  }
  return { player, banker };
}

async function sendStepResult(vectorForecast, rondaActual, vectorWinSoFar, stepIndex) {
  const resultadoChar = vectorForecast[stepIndex] || vectorForecast[0];
  const { player, banker } = scoresFor(resultadoChar);
  const body = {
    results: {
      nombre_mesa: MESA,
      ronda_actual: rondaActual,
      mesa_info: {
        puntaje_player: player,
        puntaje_banker: banker,
        martingala: {
          vector_win: vectorWinSoFar,
          martingala_active: !vectorWinSoFar.includes('W'),
          contador_martingala: stepIndex,
          vector_forecast: vectorForecast,
          vector_resultado: [resultadoChar],
        },
      },
    },
  };
  await post(body);
}

/** Simula una ronda completa: abre señal, avanza martingala paso a paso hasta ganar o llegar al paso 6. */
async function runRound() {
  const vector = randomForecastVector();
  const rondaActual = ronda;

  const opened = await openSignal(vector, rondaActual);
  if (!opened) {
    await sleep(ROUND_GAP_MS);
    return;
  }

  await sleep(SIGNAL_OPEN_WAIT_MS);

  const vectorWin = [];
  for (let step = 0; step < MAX_MARTINGALA_STEPS && running; step++) {
    const isLastStep = step === MAX_MARTINGALA_STEPS - 1;
    const won = Math.random() < WIN_CHANCE_PER_STEP || (isLastStep && Math.random() < 0.5);

    if (won) {
      vectorWin.push('W');
      await sendStepResult(vector, rondaActual, vectorWin, step);
      console.log(`[bot-sim] MG ${step + 1} DE 6 — ${MESA} ronda ${rondaActual} — GANÓ ✅ (señal cerrada)`);
      break;
    }

    vectorWin.push('L');
    await sendStepResult(vector, rondaActual, vectorWin, step);

    if (isLastStep) {
      console.log(`[bot-sim] MG ${step + 1} DE 6 — ${MESA} ronda ${rondaActual} — PERDIÓ ❌ (6 pasos agotados, señal cerrada)`);
      break;
    }

    console.log(`[bot-sim] MG ${step + 1} DE 6 — ${MESA} ronda ${rondaActual} — perdió este paso, recalculando y reintentando...`);
    await sleep(STEP_WAIT_MS);
  }

  ronda += 1;
  await sleep(ROUND_GAP_MS);
}

async function runLoop() {
  console.log(`[bot-sim] Simulador iniciado — mandando señales a ${BASE_URL} para la mesa "${MESA}", simulando el progreso de martingala paso a paso. Ctrl+C para detener.`);
  while (running) {
    await runRound();
  }
}

process.on('SIGINT', () => {
  console.log('\n[bot-sim] Detenido.');
  running = false;
  process.exit(0);
});

runLoop();
