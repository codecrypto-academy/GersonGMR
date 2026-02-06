# Escrow DApp - Intercambio Seguro de Tokens ERC20

Una aplicación descentralizada (DApp) completa para realizar intercambios seguros de tokens ERC20 utilizando un contrato inteligente de escrow.

## Características

- **Smart Contract Escrow**: Contrato en Solidity que gestiona operaciones de intercambio de tokens
- **Frontend Web**: Aplicación Next.js 14 moderna con interfaz intuitiva
- **Integración Web3**: Conexión con MetaMask usando ethers.js v6
- **Deployment Automatizado**: Script bash que despliega todo automáticamente

## Arquitectura del Proyecto

```
escrow/
├── sc/                          # Smart Contracts (Foundry)
│   ├── src/
│   │   ├── Escrow.sol          # Contrato principal de escrow
│   │   └── TestToken.sol       # Token ERC20 para testing
│   ├── script/
│   │   └── Deploy.s.sol        # Script de deployment con Foundry
│   ├── test/
│   │   └── Escrow.t.sol        # Tests completos del contrato
│   ├── foundry.toml            # Configuración de Foundry
│   └── remappings.txt          # Remappings de imports
│
├── web/                         # Frontend (Next.js 14)
│   ├── app/
│   │   ├── layout.tsx          # Layout principal
│   │   ├── page.tsx            # Página principal
│   │   └── globals.css         # Estilos globales
│   ├── components/
│   │   ├── ConnectButton.tsx   # Conectar wallet
│   │   ├── AddToken.tsx        # Agregar tokens permitidos
│   │   ├── CreateOperation.tsx # Crear operación de swap
│   │   ├── OperationsList.tsx  # Lista de operaciones
│   │   └── BalanceDebug.tsx    # Debug de balances
│   ├── lib/
│   │   ├── ethereum.tsx        # Context provider de Ethereum
│   │   └── contracts.ts        # ABIs y direcciones de contratos
│   ├── package.json
│   └── tsconfig.json
│
├── deploy.sh                    # Script de deployment automático
├── deployment-info.txt          # Info generada tras deployment
└── README.md                    # Este archivo
```

## Requisitos

- **Node.js** >= 18.x
- **Foundry** (forge, cast, anvil)
- **Git**
- **MetaMask** u otra wallet compatible con EIP-1193

### Instalar Foundry

```bash
# Linux/macOS
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Windows (WSL2 recomendado)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Guía de Deployment Rápido

### Paso 1: Iniciar Blockchain Local

Abre una terminal y ejecuta Anvil:

```bash
anvil
```

Esto iniciará una blockchain local en `http://localhost:8545` con Chain ID `31337`.

### Paso 2: Ejecutar Script de Deployment

En otra terminal, ejecuta el script de deployment:

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x deploy.sh

# Ejecutar deployment
./deploy.sh
```

El script automáticamente:
1. Instala dependencias de Foundry (OpenZeppelin, forge-std)
2. Compila los contratos
3. Despliega el contrato Escrow
4. Despliega Token A (TKA) y Token B (TKB)
5. Agrega ambos tokens al Escrow
6. Mintea 1000 tokens de cada tipo a las 3 cuentas de test
7. Actualiza `web/lib/contracts.ts` con las nuevas direcciones
8. Genera `deployment-info.txt`

### Paso 3: Iniciar Frontend

```bash
cd web
npm install
npm run dev
```

Abre http://localhost:3000 en tu navegador.

### Paso 4: Configurar MetaMask

1. **Agregar red local:**
   - Network Name: `Anvil Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Importar cuentas de test** (private keys de Anvil):

   | Cuenta | Dirección | Private Key |
   |--------|-----------|-------------|
   | #0 (Owner) | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
   | #1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
   | #2 | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a |

## Flujo de Uso

### Como Owner (Cuenta #0)

1. Conectar wallet
2. Los tokens ya están agregados por el script de deploy
3. Puedes agregar más tokens si lo deseas

### Como Usuario 1 (Cuenta #0, #1 o #2)

1. Conectar wallet
2. En "Crear Operación de Swap":
   - Seleccionar Token A (lo que ofreces)
   - Seleccionar Token B (lo que quieres)
   - Ingresar cantidades
3. Click en "Crear Operación"
4. Aprobar las 2 transacciones en MetaMask:
   - Approve del token
   - Creación de la operación
5. La operación aparecerá en la lista como "Activa"

### Como Usuario 2 (otra cuenta)

1. Cambiar de cuenta en MetaMask
2. Ver las operaciones activas
3. Click en "Completar Operación" en la que te interese
4. Aprobar las 2 transacciones:
   - Approve del token que darás
   - Completar la operación
5. Los tokens se intercambian automáticamente

### Cancelar Operación

Solo el creador puede cancelar una operación activa:
1. Click en "Cancelar Operación"
2. Los tokens depositados se devuelven al creador

## Testing

### Ejecutar tests de contratos

```bash
cd sc
forge test -vvv
```

### Tests disponibles

- `test_AddToken` - Agregar tokens permitidos
- `test_CreateOperation` - Crear operaciones de swap
- `test_CompleteOperation` - Completar operaciones
- `test_CancelOperation` - Cancelar operaciones
- `test_Fuzz_*` - Tests de fuzzing
- Tests de edge cases y reverts

## Comandos Útiles

### Foundry

```bash
# Compilar contratos
cd sc && forge build

# Ejecutar tests
forge test -vvv

# Ver gas report
forge test --gas-report

# Formatear código
forge fmt
```

### Frontend

```bash
# Desarrollo
cd web && npm run dev

# Build producción
npm run build

# Linting
npm run lint
```

### Cast (interactuar con contratos)

```bash
# Ver balance de tokens
cast call <TOKEN_ADDRESS> "balanceOf(address)(uint256)" <WALLET> --rpc-url http://localhost:8545

# Ver tokens permitidos
cast call <ESCROW_ADDRESS> "getAllowedTokens()(address[])" --rpc-url http://localhost:8545

# Ver operaciones
cast call <ESCROW_ADDRESS> "getAllOperations()" --rpc-url http://localhost:8545
```

## Tecnologías Utilizadas

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Smart Contracts | Solidity | 0.8.13 |
| Framework SC | Foundry | Latest |
| Librerías SC | OpenZeppelin | 4.x |
| Frontend | Next.js | 14.2 |
| Tipado | TypeScript | 5.x |
| Web3 | ethers.js | 6.x |
| Estilos | Tailwind CSS | 4.x |
| Runtime | Node.js | 18+ |

## Funcionalidades del Contrato

### Funciones de Owner

- `addToken(address)` - Agregar token permitido
- `removeToken(address)` - Remover token permitido

### Funciones Públicas

- `createOperation(tokenA, tokenB, amountA, amountB)` - Crear operación de swap
- `completeOperation(operationId)` - Completar operación (otro usuario)
- `cancelOperation(operationId)` - Cancelar operación (solo creador)

### Funciones de Lectura

- `getAllowedTokens()` - Lista de tokens permitidos
- `getAllOperations()` - Todas las operaciones
- `getOperation(id)` - Operación específica
- `getOperationCount()` - Total de operaciones
- `isTokenAllowed(address)` - Verificar si token está permitido

### Eventos

- `TokenAdded(address token)`
- `TokenRemoved(address token)`
- `OperationCreated(uint256 id, address creator, address tokenA, address tokenB, uint256 amountA, uint256 amountB)`
- `OperationCompleted(uint256 id, address creator, address completer)`
- `OperationCancelled(uint256 id, address creator)`

## Seguridad

El contrato implementa las siguientes medidas de seguridad:

- **Ownable**: Solo el owner puede agregar/remover tokens
- **ReentrancyGuard**: Protección contra ataques de reentrancy
- **SafeERC20**: Transferencias seguras de tokens
- **Validaciones**: Verificación de tokens permitidos, cantidades > 0, etc.

## Troubleshooting

### "MetaMask no se conecta"

- Verifica que estás en la red correcta (localhost:8545, Chain ID: 31337)
- Recarga la página
- Desconecta y vuelve a conectar la wallet

### "Transaction failed"

- Verifica que tienes suficiente balance del token
- Verifica que el token está aprobado
- Revisa la consola del navegador para más detalles

### "Could not decode result data"

- Esto puede ocurrir cuando no hay tokens o operaciones aún
- El frontend maneja esto automáticamente mostrando listas vacías

### "Network error" al desplegar

- Verifica que Anvil está corriendo en http://localhost:8545
- Reinicia Anvil y vuelve a ejecutar `deploy.sh`

## Licencia

MIT

## Recursos Adicionales

- [Foundry Book](https://book.getfoundry.sh/)
- [Ethers.js Docs](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Solidity by Example](https://solidity-by-example.org/)
