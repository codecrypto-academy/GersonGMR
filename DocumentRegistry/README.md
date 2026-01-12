# Document Registry

Sistema completo de registro y verificación de documentos mediante firma de hashes en blockchain Ethereum. El proyecto incluye un smart contract desarrollado con Solidity y Foundry, y un frontend moderno construido con Next.js, TypeScript y Ethers.js v6.

## 📋 Características

### Smart Contract
- ✅ Firma de documentos mediante hash SHA-256
- ✅ Verificación de autenticidad de documentos
- ✅ Historial completo de firmas por address
- ✅ Cumple con estándares de seguridad de la industria
- ✅ Sin campos redundantes (no `exists`, no `hashExists` mapping)
- ✅ Tests completos con cobertura >80%
- ✅ ABI exportado para integración con frontend

### Frontend
- ✅ Interfaz moderna y responsiva con Tailwind CSS
- ✅ Sistema de tabs: Sign, Verify, History
- ✅ Context Provider para gestión de wallets
- ✅ Wallets derivadas desde mnemonic (simulación MetaMask)
- ✅ Componente FileUploader con drag & drop
- ✅ Componente DocumentSigner con alerts
- ✅ Componente DocumentVerifier funcional
- ✅ Componente DocumentHistory mostrando datos completos
- ✅ Manejo completo de errores y excepciones
- ✅ Dark mode support

## 🏗️ Estructura del Proyecto

```
DocumentRegistry/
├── src/                    # Smart contracts (Solidity)
│   └── DocumentRegistry.sol
├── test/                   # Tests de Foundry
│   └── DocumentRegistry.t.sol
├── script/                 # Scripts de despliegue
│   ├── Deploy.s.sol
│   └── ExportABI.s.sol
├── frontend/              # Aplicación Next.js
│   ├── app/              # Páginas y layouts
│   ├── components/       # Componentes React
│   ├── contexts/         # Context providers
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilidades
│   └── abis/             # ABIs de contratos
└── README.md
```

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ y npm
- Foundry (para smart contracts)
- Anvil (incluido con Foundry)

### Instalación de Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Configuración del Proyecto

1. **Clonar o navegar al directorio del proyecto:**
```bash
cd GersonGMR/DocumentRegistry
```

2. **Instalar dependencias del smart contract:**
```bash
forge install
```

3. **Instalar dependencias del frontend:**
```bash
cd frontend
npm install
```

4. **Configurar variables de entorno:**
```bash
cd frontend
cp .env.local.example .env.local
```

Editar `.env.local` con tus valores:
```env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_MNEMONIC=test test test test test test test test test test test junk
```

## 🔧 Desarrollo

### Smart Contract

#### Compilar el contrato:
```bash
forge build
```

#### Ejecutar tests:
```bash
forge test
```

#### Ejecutar tests con cobertura:
```bash
forge coverage
```

#### Ejecutar tests con verbosidad:
```bash
forge test -vvv
```

### Despliegue en Anvil

1. **Iniciar Anvil en una terminal:**
```bash
anvil
```

Anvil iniciará en `http://127.0.0.1:8545` con 10 cuentas pre-fundadas.

2. **Desplegar el contrato (en otra terminal):**

Primero, crear un archivo `.env` en la raíz del proyecto con:
```env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Luego desplegar:
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast --private-key $PRIVATE_KEY
```

O usando la variable de entorno:
```bash
source .env
forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast
```

3. **Copiar la dirección del contrato desplegado:**
Después del despliegue, copiar la dirección mostrada en la consola y actualizarla en `frontend/.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

4. **Exportar ABI (opcional):**
El ABI se genera automáticamente en `out/DocumentRegistry.sol/DocumentRegistry.json` al compilar. Si necesitas copiarlo manualmente:
```bash
cp out/DocumentRegistry.sol/DocumentRegistry.json frontend/abis/DocumentRegistry.json
```

### Frontend

1. **Iniciar el servidor de desarrollo:**
```bash
cd frontend
npm run dev
```

2. **Abrir en el navegador:**
```
http://localhost:3000
```

## 📝 Uso

### Firmar un Documento

1. Conectar una wallet desde el selector en la barra lateral
2. Ir a la pestaña "Sign Document"
3. Arrastrar y soltar un archivo o hacer clic para seleccionarlo
4. El sistema calculará automáticamente el hash SHA-256
5. Hacer clic en "Sign Document"
6. Confirmar la transacción (simulada)
7. El documento quedará registrado en la blockchain

### Verificar un Documento

1. Ir a la pestaña "Verify Document"
2. Subir el documento que deseas verificar
3. Ingresar la dirección del firmante
4. Hacer clic en "Verify Document"
5. El sistema mostrará si el documento es válido y cuándo fue firmado

### Ver Historial

1. Conectar una wallet
2. Ir a la pestaña "History"
3. Ver todos los documentos firmados por esa wallet
4. Cada entrada muestra: hash, timestamp, signer y signature

## 🧪 Testing

### Tests del Smart Contract

Los tests cubren:
- ✅ Firma exitosa de documentos
- ✅ Prevención de hash vacío
- ✅ Prevención de hash duplicado
- ✅ Validación de firmas
- ✅ Verificación de documentos
- ✅ Obtención de historial
- ✅ Múltiples signers
- ✅ Manejo de errores

Ejecutar todos los tests:
```bash
forge test
```

Ejecutar un test específico:
```bash
forge test --match-test test_SignDocument_Success
```

Ver cobertura:
```bash
forge coverage
```

## 🔒 Seguridad

### Características de Seguridad Implementadas

1. **Validación de Inputs:**
   - Verificación de hash vacío
   - Validación de formato de address
   - Verificación de longitud de firma

2. **Prevención de Duplicados:**
   - Un hash solo puede ser firmado una vez
   - Verificación antes de almacenar

3. **Verificación de Firmas:**
   - Uso de `ecrecover` para validar firmas ECDSA
   - Verificación del prefijo Ethereum Signed Message

4. **Sin Campos Redundantes:**
   - No se usa `exists` boolean
   - No se usa `hashExists` mapping
   - Se verifica directamente el timestamp

## 📚 Arquitectura Técnica

### Smart Contract

**DocumentRegistry.sol** implementa:

- `signDocument(bytes32, bytes)`: Firma un documento
- `verifyDocument(bytes32, address)`: Verifica un documento
- `getSignature(bytes32)`: Obtiene información de una firma
- `getSignerHistory(address)`: Obtiene historial de un signer
- `getSignerCount(address)`: Obtiene conteo de firmas

**Estructura de Datos:**
```solidity
struct DocumentSignature {
    bytes32 hash;
    uint256 timestamp;
    bytes signature;
    address signer;
}
```

### Frontend

**Arquitectura:**
- **Context API**: Gestión de estado de wallets
- **Custom Hooks**: `useContract` para interacción con blockchain
- **Componentes Modulares**: Separación de responsabilidades
- **TypeScript**: Type safety en todo el código

**Flujo de Firma:**
1. Usuario sube archivo
2. Frontend calcula hash SHA-256
3. Wallet firma el hash
4. Transacción enviada a blockchain
5. Contrato valida y almacena

## 🐛 Manejo de Errores

El frontend maneja los siguientes errores:

- ❌ Wallet no conectada
- ❌ Hash vacío
- ❌ Hash ya firmado
- ❌ Firma inválida
- ❌ Documento no encontrado
- ❌ Address inválido
- ❌ Error de red/blockchain
- ❌ Error al procesar archivo

Todos los errores se muestran con alerts informativos al usuario.

## 📦 Scripts Disponibles

### Smart Contract
- `forge build`: Compilar contratos
- `forge test`: Ejecutar tests
- `forge coverage`: Ver cobertura de código
- `forge script script/Deploy.s.sol:DeployScript --rpc-url <RPC> --broadcast`: Desplegar

### Frontend
- `npm run dev`: Servidor de desarrollo
- `npm run build`: Build de producción
- `npm run start`: Servidor de producción
- `npm run lint`: Linter

## 🔧 Configuración Avanzada

### Cambiar la Red

Para usar una red diferente a Anvil:

1. Actualizar `NEXT_PUBLIC_RPC_URL` en `.env.local`
2. Desplegar el contrato en esa red
3. Actualizar `NEXT_PUBLIC_CONTRACT_ADDRESS`

### Usar Mnemonic Diferente

Editar `NEXT_PUBLIC_DEFAULT_MNEMONIC` en `.env.local` con tu mnemonic de 12 palabras.

## 📄 Licencia

MIT

## 👤 Autor

GersonGMR - Codecrypto Academy Student

## 🙏 Agradecimientos

- Foundry para el framework de desarrollo de smart contracts
- Next.js para el framework de frontend
- Ethers.js para la interacción con blockchain
- Tailwind CSS para el diseño

---

**Nota:** Este proyecto es para fines educativos. En producción, usar wallets reales con MetaMask u otros proveedores de wallet, y desplegar en redes de prueba o mainnet con las debidas precauciones de seguridad.
