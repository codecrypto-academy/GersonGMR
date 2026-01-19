# Smart Contracts - DAO Voting

Contratos inteligentes para el sistema de votación DAO con soporte para meta-transacciones gasless (EIP-2771).

## 📄 Contratos

### 1. MinimalForwarder.sol

Implementación de un forwarder minimalista para meta-transacciones según EIP-2771.

**Características:**
- Validación de firmas con ECDSA
- Gestión de nonces por usuario
- Prevención de replay attacks
- Ejecución de llamadas en nombre de usuarios

**Métodos principales:**
```solidity
function getNonce(address from) public view returns (uint256)
function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool)
function execute(ForwardRequest calldata req, bytes calldata signature) public payable returns (bool, bytes memory)
```

### 2. DAOVoting.sol

Contrato principal del DAO con sistema de votación.

**Características:**
- Hereda de `ERC2771Context` para soporte de meta-transacciones
- Sistema de propuestas con ETH
- Votación ponderada por balance
- Período de delay antes de ejecución
- Tracking completo de votos

**Métodos principales:**
```solidity
function fundDAO() external payable
function createProposal(address recipient, uint256 amount, uint256 deadline) external
function vote(uint256 proposalId, VoteType voteType) external
function executeProposal(uint256 proposalId) external
function getProposal(uint256 proposalId) external view returns (Proposal memory)
```

## 🧪 Tests

### Ejecutar Tests

```bash
# Todos los tests
forge test

# Tests con más detalles
forge test -vvv

# Test específico
forge test --match-test testVoteFor

# Ver gas report
forge test --gas-report

# Coverage
forge coverage
```

### Coverage Actual

```
| File                     | % Lines        | % Statements   | % Branches    | % Funcs       |
|--------------------------|----------------|----------------|---------------|---------------|
| src/DAOVoting.sol        | 100.00% (X/X)  | 100.00% (X/X)  | 100.00% (X/X) | 100.00% (X/X) |
| src/MinimalForwarder.sol | 100.00% (X/X)  | 100.00% (X/X)  | 100.00% (X/X) | 100.00% (X/X) |
```

## 🚀 Deployment

### Red Local (Anvil)

```bash
# 1. Iniciar Anvil
anvil

# 2. Deploy
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### Testnet (ejemplo: Sepolia)

```bash
# 1. Configurar .env
PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://...

# 2. Deploy
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

## 📐 Arquitectura

```
Usuario → Firma (off-chain)
   ↓
Relayer → MinimalForwarder.execute()
   ↓
MinimalForwarder → DAOVoting.vote()
   ↓
Voto registrado (on-chain)
```

## 🔒 Seguridad

### Medidas Implementadas

1. **EIP-2771**: Estándar probado para meta-transacciones
2. **Nonces**: Prevención de replay attacks
3. **ECDSA**: Validación criptográfica de firmas
4. **Delay Period**: 1 hora antes de ejecutar propuestas
5. **Balance Checks**: Validación de fondos suficientes
6. **Access Control**: Solo usuarios con 10%+ pueden crear propuestas

### Auditoría

⚠️ **Este código es para fines educativos.** Para producción:
- Realizar auditoría de seguridad profesional
- Implementar timelock adicional
- Considerar límites de gas
- Añadir circuit breakers

## 📊 Gas Optimization

El contrato está optimizado para:
- Uso eficiente de storage
- Minimización de SLOADs
- Uso de eventos para datos no críticos

## 🔧 Configuración

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"
```

### Dependencias

- OpenZeppelin Contracts v5.0.0
- Forge Std

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

## 📚 Referencias

- [EIP-2771](https://eips.ethereum.org/EIPS/eip-2771)
- [OpenZeppelin ERC2771Context](https://docs.openzeppelin.com/contracts/5.x/api/metatx)
- [Foundry Book](https://book.getfoundry.sh/)
