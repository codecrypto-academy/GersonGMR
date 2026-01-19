# DAO Voting Platform con Meta-Transacciones Gasless

Sistema completo de DAO (Organización Autónoma Descentralizada) que permite a los usuarios votar propuestas **sin pagar gas**, utilizando meta-transacciones (EIP-2771).

## 📋 Características

- ✅ **Votación Gasless**: Los usuarios pueden votar sin pagar gas usando meta-transacciones EIP-2771
- ✅ **Sistema de Propuestas**: Crear propuestas para transferir fondos del DAO
- ✅ **Sistema de Votación**: Votar a favor, en contra, o abstenerse
- ✅ **Ejecución Automática**: Las propuestas aprobadas se ejecutan automáticamente después del deadline
- ✅ **Frontend Moderno**: Interfaz web construida con Next.js 15, TypeScript y Tailwind CSS
- ✅ **Relayer Integrado**: API routes que pagan el gas por los usuarios

## 🏗️ Arquitectura del Proyecto

```
DAO/
├── sc/                          # Smart Contracts (Foundry)
│   ├── src/
│   │   ├── MinimalForwarder.sol  # Contrato relayer EIP-2771
│   │   └── DAOVoting.sol         # Contrato principal del DAO
│   ├── test/
│   │   ├── MinimalForwarder.t.sol
│   │   └── DAOVoting.t.sol
│   ├── script/
│   │   └── Deploy.s.sol          # Script de deployment
│   └── foundry.toml
│
└── web/                         # Frontend (Next.js 15)
    ├── app/
    │   ├── api/
    │   │   ├── relay/           # Relayer endpoint
    │   │   ├── nonce/           # Obtener nonce de usuario
    │   │   └── daemon/          # Daemon de ejecución automática
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    │   ├── ConnectWallet.tsx
    │   ├── FundingPanel.tsx
    │   ├── CreateProposal.tsx
    │   ├── ProposalList.tsx
    │   ├── ProposalCard.tsx
    │   └── VoteButtons.tsx
    ├── contexts/
    │   └── Web3Context.tsx
    ├── lib/
    │   ├── contracts.ts         # ABIs y tipos
    │   └── gasless.ts           # Lógica de firmas EIP-712
    └── package.json
```

## 🔄 Flujo de Meta-Transacciones

```
1. Usuario firma mensaje off-chain (EIP-712)
        ↓
2. Firma se envía al Relayer (API /api/relay)
        ↓
3. Relayer valida y ejecuta en MinimalForwarder
        ↓
4. MinimalForwarder verifica firma y ejecuta en DAOVoting
        ↓
5. Voto se registra sin que el usuario pague gas
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- Foundry ([instalación](https://book.getfoundry.sh/getting-started/installation))
- MetaMask o wallet compatible

### 1. Instalar Dependencias de Smart Contracts

```bash
cd sc

# Instalar dependencias de Foundry
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

### 2. Compilar y Testear Contratos

```bash
# Compilar contratos
forge build

# Ejecutar tests
forge test

# Ver coverage
forge coverage
```

### 3. Iniciar Nodo Local (Anvil)

```bash
# En una terminal separada
anvil
```

Anvil generará varias cuentas con claves privadas. **Guarda estas claves** para usarlas más adelante.

### 4. Desplegar Contratos

```bash
# Crear archivo .env en la carpeta sc/
cd sc
echo "PRIVATE_KEY=0x..." > .env

# Desplegar en red local
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

**Guarda las direcciones de los contratos** que se muestran en la consola.

### 5. Configurar Frontend

```bash
cd ../web

# Instalar dependencias
npm install

# Crear archivo .env.local
cp env.example .env.local
```

Editar `.env.local` con las direcciones de los contratos:

```env
NEXT_PUBLIC_DAO_ADDRESS=0x...              # Dirección del DAOVoting
NEXT_PUBLIC_FORWARDER_ADDRESS=0x...        # Dirección del MinimalForwarder
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Configuración del Relayer (usar una de las cuentas de Anvil)
RELAYER_PRIVATE_KEY=0x...                  # Clave privada del relayer
RELAYER_ADDRESS=0x...                      # Dirección pública del relayer
RPC_URL=http://127.0.0.1:8545
```

### 6. Iniciar Frontend

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📖 Guía de Uso

### 1. Conectar Wallet

1. Abre `http://localhost:3000`
2. Haz clic en "Connect Wallet"
3. Selecciona MetaMask y conecta tu cuenta
4. **Importante**: Configura MetaMask para usar la red local:
   - Red: `Localhost 8545`
   - Chain ID: `31337`
   - RPC URL: `http://127.0.0.1:8545`

### 2. Fondear el DAO

1. Ingresa la cantidad de ETH a depositar
2. Haz clic en "Deposit ETH"
3. Confirma la transacción en MetaMask
4. **Nota**: Necesitas al menos 10% del balance total del DAO para crear propuestas

### 3. Crear una Propuesta

1. Completa el formulario:
   - **Recipient Address**: Dirección que recibirá los fondos
   - **Amount**: Cantidad de ETH a transferir
   - **Voting Period**: Días de duración de la votación
2. Haz clic en "Create Proposal"
3. Confirma la transacción

### 4. Votar en una Propuesta

**Opción A: Votación Gasless (Recomendado)**

1. Asegúrate que "Use gasless voting" esté marcado
2. Haz clic en "Vote FOR", "Vote AGAINST" o "Abstain"
3. Firma el mensaje en MetaMask (sin pagar gas)
4. El relayer ejecutará tu voto automáticamente

**Opción B: Votación Regular**

1. Desmarca "Use gasless voting"
2. Vota y paga gas normalmente

### 5. Ejecutar Propuestas

Las propuestas aprobadas pueden ejecutarse de dos formas:

**Manual:**
- Haz clic en "Execute Proposal" cuando esté disponible

**Automática:**
- El daemon puede ejecutar propuestas llamando a: `http://localhost:3000/api/daemon`
- Puedes configurar un cron job para llamarlo periódicamente

## 🧪 Escenarios de Prueba

### Escenario Completo

```bash
# 1. Usuario A deposita 10 ETH
# 2. Usuario B deposita 5 ETH
# 3. Usuario A crea propuesta (tiene >10% del balance)
# 4. Usuario B intenta crear propuesta (falla, <10%)
# 5. Usuario A vota A FAVOR (gasless)
# 6. Usuario B vota EN CONTRA (gasless)
# 7. Usuario C deposita 20 ETH
# 8. Usuario C vota A FAVOR (gasless)
# 9. Esperar deadline + 1 hora
# 10. Ejecutar propuesta (manual o automática)
```

### Casos Edge a Validar

- ❌ Votar en propuesta inexistente
- ❌ Votar después del deadline
- ❌ Ejecutar propuesta no aprobada
- ❌ Ejecutar propuesta ya ejecutada
- ✅ Cambiar voto antes del deadline
- ❌ Crear propuesta sin balance suficiente

## 🔧 Comandos Útiles

### Smart Contracts

```bash
cd sc

# Compilar
forge build

# Tests
forge test
forge test -vvv                    # Verbose
forge test --match-test testVote  # Test específico

# Coverage
forge coverage

# Gas report
forge test --gas-report

# Formatear código
forge fmt
```

### Frontend

```bash
cd web

# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm run start

# Lint
npm run lint
```

## 📊 Tests de Smart Contracts

### DAOVoting Tests

- ✅ Depositar fondos al DAO
- ✅ Crear propuestas (exitoso y fallido)
- ✅ Votar a favor, en contra, abstención
- ✅ Cambiar voto
- ✅ Ejecutar propuestas aprobadas
- ✅ Validar período de ejecución
- ✅ Prevenir doble ejecución

### MinimalForwarder Tests

- ✅ Verificar firmas válidas
- ✅ Rechazar firmas inválidas
- ✅ Ejecutar meta-transacciones
- ✅ Incrementar nonces
- ✅ Prevenir replay attacks

Ejecutar todos los tests:

```bash
cd sc
forge test
```

## 🔐 Seguridad

### Contratos

- ✅ EIP-2771 para meta-transacciones seguras
- ✅ Nonces para prevenir replay attacks
- ✅ Validación de firmas con ECDSA
- ✅ Período de delay antes de ejecución
- ✅ Validaciones de balance y permisos

### Frontend

- ✅ Variables de entorno para claves privadas
- ✅ Validación de firmas antes de relay
- ✅ Logging de todas las transacciones
- ✅ Manejo de errores robusto

## 🚨 Troubleshooting

### Error: "User rejected transaction"
- El usuario canceló en MetaMask. Vuelve a intentar.

### Error: "Insufficient balance to create proposal"
- Necesitas al menos 10% del balance total del DAO.

### Error: "Contract addresses not configured"
- Verifica que `.env.local` tenga las direcciones correctas.

### Error: "Voting period has ended"
- El deadline de la propuesta ya pasó.

### Transacciones Gasless no funcionan
1. Verifica que el relayer tenga fondos suficientes
2. Revisa los logs del servidor (`npm run dev`)
3. Verifica las direcciones en `.env.local`

## 📚 Recursos

- [EIP-2771 Standard](https://eips.ethereum.org/EIPS/eip-2771)
- [Foundry Book](https://book.getfoundry.sh/)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 📝 Licencia

MIT

## 👥 Contribuciones

Este es un proyecto educativo. Siéntete libre de mejorarlo y adaptarlo a tus necesidades.

---

**¡Construido con ❤️ usando Solidity, Foundry, Next.js 15 y EIP-2771!**
