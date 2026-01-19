# ⏰ Time Travel Guide - Testing Proposal Flow

Esta guía te muestra cómo probar el flujo completo de un proposal sin esperar tiempo real.

## 📋 Prerequisitos

- Anvil corriendo en `http://127.0.0.1:8545`
- Tener Foundry instalado (para usar `cast`)

## 🚀 Flujo de Prueba Rápido

### 1️⃣ **Crear un Proposal**

1. Ve a la web app
2. Deposita fondos en el DAO si no lo has hecho
3. Crea un proposal con:
   - **Recipient:** Cualquier dirección (ej: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`)
   - **Amount:** Cualquier cantidad (ej: 1 ETH)
   - **Description:** "Test proposal for time travel"
   - **Voting Period:** 7 días (default)

### 2️⃣ **Votar en el Proposal**

1. Vota FOR, AGAINST, o ABSTAIN (con diferentes wallets si quieres)
2. Verifica que los votos se registren correctamente

### 3️⃣ **⏰ Saltar al Deadline (7 días después)**

Ejecuta en una terminal:

```bash
# Avanzar 7 días + 1 minuto (604,860 segundos)
cast rpc evm_increaseTime 604860 --rpc-url http://127.0.0.1:8545

# Minar un nuevo bloque
cast rpc evm_mine --rpc-url http://127.0.0.1:8545
```

**¿Qué pasó?**
- El deadline ya pasó
- Refresca la página web
- El proposal ahora debe mostrar:
  - Estado "**Approved**" (badge azul) si `votesFor > votesAgainst`
  - Estado "**Rejected**" (badge rojo) si `votesAgainst >= votesFor`

### 4️⃣ **⏰ Saltar el Delay de Ejecución (1 hora después)**

```bash
# Avanzar 1 hora (3,600 segundos)
cast rpc evm_increaseTime 3600 --rpc-url http://127.0.0.1:8545

# Minar un nuevo bloque
cast rpc evm_mine --rpc-url http://127.0.0.1:8545
```

**¿Qué pasó?**
- Ya pasó el período de delay de seguridad
- Refresca la página web
- Si el proposal fue **Approved**, ahora debe aparecer el botón "**Execute Proposal**"
- Si fue **Rejected**, no aparece ningún botón

### 5️⃣ **Ejecutar el Proposal (solo si fue aprobado)**

1. Click en el botón "Execute Proposal"
2. Confirma la transacción
3. Verifica que:
   - El estado cambia a "**Executed**" (badge verde)
   - Los fondos se transfirieron al recipient
   - El balance del DAO disminuyó

---

## 🔧 Comandos Útiles

### Ver estado de un Proposal

```bash
cast call 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 "getProposal(uint256)(uint256,address,uint256,uint256,uint256,uint256,uint256,bool,address,string)" 1 --rpc-url http://127.0.0.1:8545
```

Reemplaza `1` con el ID del proposal que quieres consultar.

### Ver timestamp actual del blockchain

```bash
cast block latest --rpc-url http://127.0.0.1:8545
```

### Saltar tiempos específicos

```bash
# 1 hora = 3,600 segundos
cast rpc evm_increaseTime 3600 --rpc-url http://127.0.0.1:8545 && cast rpc evm_mine --rpc-url http://127.0.0.1:8545

# 1 día = 86,400 segundos
cast rpc evm_increaseTime 86400 --rpc-url http://127.0.0.1:8545 && cast rpc evm_mine --rpc-url http://127.0.0.1:8545

# 7 días = 604,800 segundos
cast rpc evm_increaseTime 604800 --rpc-url http://127.0.0.1:8545 && cast rpc evm_mine --rpc-url http://127.0.0.1:8545

# 30 días = 2,592,000 segundos
cast rpc evm_increaseTime 2592000 --rpc-url http://127.0.0.1:8545 && cast rpc evm_mine --rpc-url http://127.0.0.1:8545
```

---

## 🧪 Escenarios de Prueba

### ✅ Scenario 1: Proposal Aprobado y Ejecutado

1. Crea proposal con deadline de 1 día
2. Vota **FOR** con suficientes votos
3. Saltar 1 día + 1 minuto → Estado: "Approved"
4. Saltar 1 hora → Aparece botón "Execute"
5. Ejecutar → Estado: "Executed"

```bash
# Comandos completos
cast rpc evm_increaseTime 86460 --rpc-url http://127.0.0.1:8545 && cast rpc evm_mine --rpc-url http://127.0.0.1:8545
# Refresh página, luego:
cast rpc evm_increaseTime 3600 --rpc-url http://127.0.0.1:8545 && cast rpc evm_mine --rpc-url http://127.0.0.1:8545
# Ejecutar desde la UI
```

### ❌ Scenario 2: Proposal Rechazado

1. Crea proposal con deadline de 1 día
2. Vota **AGAINST** con más votos que FOR
3. Saltar 1 día + 1 minuto → Estado: "Rejected"
4. No aparece botón de ejecución
5. Los fondos permanecen en el DAO

```bash
cast rpc evm_increaseTime 86460 --rpc-url http://127.0.0.1:8545 && cast rpc evm_mine --rpc-url http://127.0.0.1:8545
# Proposal queda rechazado permanentemente
```

### 🔄 Scenario 3: Cambiar Votos

1. Crea proposal
2. Vota FOR
3. Cambia tu voto a AGAINST (mientras esté activo)
4. Verifica que el voto anterior se reste y el nuevo se sume

---

## ⚠️ Notas Importantes

1. **Anvil recuerda el tiempo**: El tiempo avanzado persiste mientras Anvil esté corriendo
2. **Reiniciar Anvil**: Si reinicias Anvil, el tiempo vuelve a 0
3. **MetaMask puede confundirse**: Si ves errores de nonce, resetea MetaMask:
   - Settings → Advanced → Clear activity tab data
4. **No puedes retroceder**: Solo puedes avanzar en el tiempo, no retroceder
5. **Cada `evm_mine` crea un bloque**: Úsalo después de cada `evm_increaseTime`

---

## 🎯 Quick Test (1 minuto)

Para probar todo el flujo en ~1 minuto:

```bash
# 1. Crea proposal con deadline de 1 minuto (en vez de días)
#    - En CreateProposal, pon "Voting Period: 0" y edita manualmente a 0.001 días

# 2. Vota

# 3. Saltar 2 minutos
cast rpc evm_increaseTime 120 --rpc-url http://127.0.0.1:8545 && cast rpc evm_mine --rpc-url http://127.0.0.1:8545

# 4. Saltar 1 hora más
cast rpc evm_increaseTime 3600 --rpc-url http://127.0.0.1:8545 && cast rpc evm_mine --rpc-url http://127.0.0.1:8545

# 5. Ejecutar desde UI
```

---

## 📚 Referencia de Tiempos

| Período | Segundos | Comando |
|---------|----------|---------|
| 1 minuto | 60 | `cast rpc evm_increaseTime 60 ...` |
| 5 minutos | 300 | `cast rpc evm_increaseTime 300 ...` |
| 1 hora | 3,600 | `cast rpc evm_increaseTime 3600 ...` |
| 1 día | 86,400 | `cast rpc evm_increaseTime 86400 ...` |
| 7 días | 604,800 | `cast rpc evm_increaseTime 604800 ...` |
| 30 días | 2,592,000 | `cast rpc evm_increaseTime 2592000 ...` |

---

¡Listo! Ahora puedes probar todo el flujo de proposals en segundos en lugar de días. 🚀
