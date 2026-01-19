# Frontend - DAO Voting Platform

Frontend moderno para el sistema de votación DAO con soporte para votación gasless usando meta-transacciones.

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Web3**: ethers.js v6
- **State Management**: React Context API

## 📁 Estructura del Proyecto

```
web/
├── app/
│   ├── api/                    # API Routes
│   │   ├── relay/             # Relayer endpoint
│   │   ├── nonce/             # Obtener nonce
│   │   └── daemon/            # Daemon de ejecución
│   ├── layout.tsx             # Layout principal
│   ├── page.tsx               # Página principal
│   └── globals.css            # Estilos globales
│
├── components/                 # Componentes React
│   ├── ConnectWallet.tsx      # Conexión de wallet
│   ├── FundingPanel.tsx       # Panel de fondeo
│   ├── CreateProposal.tsx     # Crear propuestas
│   ├── ProposalList.tsx       # Lista de propuestas
│   ├── ProposalCard.tsx       # Card de propuesta
│   └── VoteButtons.tsx        # Botones de votación
│
├── contexts/
│   └── Web3Context.tsx        # Context de Web3
│
└── lib/
    ├── abis/
    │   └── index.ts           # ABIs auto-generados
    ├── contracts.ts           # Exports de ABIs
    ├── gasless.ts             # Lógica EIP-712
    └── errorHandler.ts        # Manejo de errores
```

## 🚀 Instalación

```bash
# Instalar dependencias (auto-sincroniza ABIs)
npm install

# Los ABIs se sincronizan automáticamente desde Foundry
# Para sincronizar manualmente:
npm run sync:abis
```

**Nota**: No necesitas copiar `env.example` si usas el script de deploy automatizado (`bash scripts/deploy-and-sync.sh` desde la raíz)

## ⚙️ Configuración

Editar `.env.local`:

```env
# Direcciones de contratos (obtenidas del deployment)
NEXT_PUBLIC_DAO_ADDRESS=0x...
NEXT_PUBLIC_FORWARDER_ADDRESS=0x...

# Configuración de red
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Relayer (server-side)
RELAYER_PRIVATE_KEY=0x...
RELAYER_ADDRESS=0x...
RPC_URL=http://127.0.0.1:8545
```

## 🏃 Comandos

```bash
# Desarrollo
npm run dev

# Sincronizar ABIs desde contratos
npm run sync:abis

# Build para producción
npm run build

# Ejecutar build
npm run start

# Linter
npm run lint
```

**ABIs Automatizados**: Los ABIs se generan automáticamente desde Foundry. Ver `ABI_WORKFLOW.md` en la raíz del proyecto.

## 🧩 Componentes Principales

### ConnectWallet

Botón de conexión de wallet con estado.

**Features:**
- Conexión con MetaMask
- Muestra dirección y balance
- Desconexión
- Manejo de cambios de cuenta/red

### FundingPanel

Panel para depositar ETH en el DAO.

**Features:**
- Input de cantidad
- Mostrar balance del DAO
- Transacciones con feedback
- Auto-refresh de balances

### CreateProposal

Formulario para crear nuevas propuestas.

**Features:**
- Validación de inputs
- Cálculo de deadline
- Verificación de balance (10%)
- Mensajes de error claros

### ProposalList & ProposalCard

Lista y visualización de propuestas.

**Features:**
- Carga de todas las propuestas
- Estado visual (Active, Approved, Rejected, Executed)
- Progreso de votación en tiempo real
- Botones de acción según estado

### VoteButtons

Botones para votar con opción gasless.

**Features:**
- Votación gasless (meta-transacciones)
- Votación regular (con gas)
- Toggle entre ambas opciones
- Feedback de estado

## 🔌 API Routes

### POST /api/relay

Relayer que ejecuta meta-transacciones.

**Request:**
```json
{
  "request": {
    "from": "0x...",
    "to": "0x...",
    "value": 0,
    "gas": 200000,
    "nonce": 0,
    "data": "0x..."
  },
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "blockNumber": 123
}
```

### GET /api/nonce?address=0x...

Obtiene el nonce actual de un usuario.

**Response:**
```json
{
  "nonce": "0"
}
```

### GET /api/daemon

Daemon que ejecuta propuestas aprobadas automáticamente.

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "totalProposals": 5,
  "executedProposals": [
    {
      "proposalId": 3,
      "txHash": "0x...",
      "blockNumber": 456
    }
  ],
  "errors": []
}
```

## 🎨 Estilos

### Clases Utilitarias Personalizadas

```css
.btn-primary    /* Botón azul primario */
.btn-secondary  /* Botón gris secundario */
.btn-success    /* Botón verde de éxito */
.btn-danger     /* Botón rojo de peligro */
.btn-warning    /* Botón amarillo de advertencia */

.card           /* Card con sombra y borde */
.input-field    /* Input estilizado */
.label          /* Label de formulario */
```

## 🔐 Seguridad

### Variables de Entorno

- ✅ Claves privadas solo en server-side
- ✅ Validación en API routes
- ✅ No exponer datos sensibles al cliente

### Validación de Firmas

```typescript
// lib/gasless.ts
const signature = await signer.signTypedData(domain, types, forwardRequest);
```

### Manejo de Errores

- Try/catch en todas las operaciones async
- Mensajes de error claros al usuario
- Logging para debugging

## 📱 Responsive Design

El diseño es totalmente responsive:

- Mobile: Single column
- Tablet: 2 columns grid
- Desktop: 2+ columns grid

## 🧪 Testing Local

**Opción Rápida (Recomendada):**

1. Iniciar Anvil:
```bash
anvil --block-time 5
```

2. Deploy automatizado (desde raíz):
```bash
bash scripts/deploy-and-sync.sh
```

3. Iniciar frontend:
```bash
cd web && npm run dev
```

**Opción Manual:**

1. Iniciar Anvil:
```bash
anvil --block-time 5
```

2. Desplegar contratos:
```bash
cd ../sc
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

3. Sincronizar ABIs y configurar `.env.local` manualmente

4. Iniciar frontend:
```bash
cd web && npm run dev
```

5. Abrir `http://localhost:3000`

6. Configurar MetaMask:
   - Red: Localhost 8545
   - Chain ID: 31337
   - Importar cuentas de Anvil

## 🚀 Deployment a Producción

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel Dashboard
```

### Variables de Entorno en Producción

⚠️ **IMPORTANTE**: 
- Usar claves privadas separadas para producción
- Configurar RPC URL de red real (no localhost)
- Actualizar Chain ID según la red

## 📚 Referencias

- [Next.js 15 Docs](https://nextjs.org/docs)
- [ethers.js v6](https://docs.ethers.org/v6/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712)

## 🐛 Troubleshooting

### MetaMask no se conecta
- Verificar que MetaMask esté instalado
- Verificar configuración de red
- Revisar consola del navegador

### Error: "Contract addresses not configured"
- Verificar `.env.local`
- Reiniciar servidor de desarrollo

### Transacciones fallan
- Verificar balance de gas
- Ver logs del servidor
- Revisar eventos en blockchain explorer local

## 💡 Tips de Desarrollo

1. Usar React DevTools para debugging
2. Habilitar modo verbose en consola
3. Revisar Network tab para APIs
4. Usar console.log estratégicamente
5. Testear con múltiples cuentas

---

**Happy Coding! 🚀**
