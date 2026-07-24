# Checklist: trabajo funcional de Winx a portar a Bet Sniper

Generado 2026-07-20. Compara `bet-sniper-pwa` / `BACKENDBOTPROJECT` (esta copia)
contra el trabajo reciente en `winx-oracle-pwa` / `BACKENDBOTPROJECT` original /
`G-BRIDGE` / `winx-cinema-engine`. Solo lista lógica/backend — **no incluye nada
visual** (Bet Sniper ya tiene su propio diseño "Luxury Dark Gold", separado del
rediseño que se hizo en Winx).

Cada item dice si ya verifiqué que el bug/gap existe acá también, o si es
referencia que requiere adaptación.

---

## 1. Portable ya — bug confirmado presente en este repo

### 1.1 JWT no se refresca al vincular wallet
**Confirmado: el mismo bug existe acá.**

- `BACKENDBOTPROJECT/src/users/users.controller.ts` → `POST include-wallet`
  (línea ~116) guarda la wallet pero devuelve `{ message, user }` sin token
  nuevo.
- `bet-sniper-pwa/src/app/core/services/web3.service.ts` línea 71-74 → el
  `subscribe` de `updateWallet()` ignora la respuesta (`next: (res) => {}`).

Efecto: un usuario conecta la wallet, el backend la guarda bien, pero la
sesión (JWT en `localStorage`) sigue sin `wallet` hasta el próximo login —
cualquier feature gateada por `wallet` en el token (holds, permisos, lo que
sea) falla justo después de conectar, en la misma sesión.

**Fix aplicado en Winx** (repo `BACKENDBOTPROJECT` original, commit
`5c5b07e`, y `winx-oracle-pwa` commit `2c806cd`):
- El controller re-firma el JWT con la wallet incluida tras guardarla y lo
  devuelve en la respuesta (`{ data: { wallet, token } }`).
- El frontend (`web3.service.ts` y también `user-profile.component.ts`,
  donde esté el flujo de "actualizar wallet" manual) guarda ese token nuevo
  con `tokenService.saveToken(token)` en cuanto llega.

Ojo: acá el shape de respuesta ya es distinto (`{ message, user }`, no
`ResponseApis<{wallet}>`), así que no es copy-paste literal — hay que sumar
el campo `token` a esa respuesta existente y ajustar el `.subscribe` del
frontend a como sea que llegue.

---

## 2. Portable si aplica — depende de una decisión de negocio, no es un bug

### 2.1 Botón "Automático" — SSO hacia GPulse
Bet Sniper **no tiene esta integración** (no hay ni rastro de `gpulse` en
`active-signals.component.ts/.html` ni en el backend). Es específico del
partnership de Winx con GPulse (`g-pulse.aigenesis.io`).

Portar solo si Bet Sniper también va a integrar con GPulse (o un partner
equivalente) vía SSO. Si aplica, el patrón que funcionó en Winx:

- Backend: `GET /gpulse-sso` (guardia JWT), firma un JWT corto de un solo
  uso con un secret **compartido y separado** del JWT_SECRET propio
  (`GPULSE_SSO_SECRET`, nunca tocar el JwtModule de Auth), exige
  `user.wallet` presente (422 si no), `encodeURIComponent` + `.trim()` del
  token al armar la URL de redirect, CORS configurable por env var.
- Frontend: abrir la pestaña en blanco **de forma sincrónica dentro del
  gesto de click** (`window.open('', '_blank')`) antes de esperar la
  respuesta del backend — si se espera primero, el navegador bloquea el
  popup por no ser un gesto directo de usuario. Recién con la URL firmada
  se navega esa misma pestaña.

---

## 3. Referencia, no portable 1:1 — arquitectura distinta

Bet Sniper no tiene el embed de Cinema (G-BRIDGE), no hay `src/assets/cinema/`
en `bet-sniper-pwa`. Tiene su **propio** sistema de señales/holds
(`genesis-signals/`, `holds/` en el backend) — no comparte código con
`winx-cinema-engine`. Nada de esto es copy-paste, pero son bugs de una clase
que vale la pena revisar si `holds`/`genesis-signals` tiene algo similar:

- **Estado de "dueño de la operación" solo en memoria (zustand/Map) que se
  pierde en un reload.** En Winx, el store que decidía si una señal nueva
  podía abrir un ciclo vivía solo en memoria del cliente — un reload a mitad
  de una escalera de martingala dejaba el ciclo abierto en el backend
  (dinero debitado) huérfano para siempre, porque el cliente "olvidaba" que
  lo poseía. Se arregló reconciliando contra el backend al autenticar
  (`GET /cycles?status=open` → reclamar cualquier ciclo abierto). Si `holds`
  tiene un concepto similar de "operación en curso" gateado por estado de
  cliente, vale la pena confirmar que sobrevive a un reload.
- **No confiar en el monto/estado que declara el cliente al verificar un
  depósito on-chain.** `winx-cinema-engine` lee el receipt real de la
  transacción en la blockchain (viem) en vez de confiar en lo que manda el
  frontend, y exige que el sender on-chain matchee la wallet autenticada
  (si no, cualquiera podría reciclar el `txHash` público de otra persona
  para acreditarse el depósito ajeno).
- **Todo movimiento de saldo debe ir en una transacción con row-locking**
  (`SELECT ... FOR UPDATE`), nunca un update de balance suelto sin su fila
  de auditoría — si `holds`/`wallets` mueve dinero, confirmar que no hay una
  ventana de carrera entre leer el balance y escribirlo bajo escritura
  concurrente.
- **La respuesta de un endpoint debe tener el shape EXACTO que el frontend
  espera, no una aproximación razonable.** Dos bugs reales en Winx fueron
  "el backend está técnicamente bien, pero el campo que el frontend lee no
  existe/tiene otro nombre/otro nivel de anidado" (wallets como string en
  vez de objeto anidado; falta el campo `advanced` que el cliente usaba
  para decidir si una escalera de apuestas seguía viva o había terminado).
  Antes de cambiar un shape de respuesta, grepear dónde el frontend lee esos
  campos específicos, no asumir por el nombre del endpoint.

---

## Resumen rápido

| # | Item | Acción sugerida |
|---|---|---|
| 1.1 | JWT no se refresca al vincular wallet | **Portar ya** — bug confirmado presente acá |
| 2.1 | Botón "Automático" / SSO GPulse | Portar solo si hay partnership con GPulse |
| 3.x | Patrones de winx-cinema-engine (reconciliación tras reload, verificación on-chain real, row-locking, shape exacto de respuesta) | No copiar código — revisar si `holds`/`genesis-signals` tiene los mismos riesgos |
