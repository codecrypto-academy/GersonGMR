# 🛒 E-Commerce con Blockchain y Stablecoins

Sistema completo de e-commerce basado en blockchain que integra stablecoins (EuroToken), pagos con tarjeta de crédito (Stripe), smart contracts para gestión de comercio electrónico, y aplicaciones web para administración y clientes.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Seguridad](#seguridad)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contribución](#contribución)

## 🎯 Descripción General

Este proyecto es un sistema completo de e-commerce descentralizado que permite:

- **Creación y gestión de stablecoins**: Token ERC20 (EuroToken) que representa euros digitales
- **Compra de tokens con tarjeta**: Integración con Stripe para comprar EuroTokens con tarjeta de crédito
- **Pasarela de pagos**: Sistema de pagos con criptomonedas entre clientes y comerciantes
- **Smart contracts**: Gestión completa de empresas, productos, carritos e invoices en blockchain
- **Panel de administración**: Interfaz web para que empresas gestionen sus productos y facturas
- **Tienda online**: Aplicación web para clientes finales

## 🏗️ Arquitectura

```
ecommerce/
├── stablecoin/
│   ├── sc/                          # Smart Contract EuroToken
│   │   ├── src/EuroToken.sol
│   │   ├── test/EuroToken.t.sol
│   │   └── script/DeployEuroToken.s.sol
│   ├── compra-stablecoin/           # App para comprar tokens (Puerto 6001)
│   └── pasarela-de-pago/            # Pasarela de pagos (Puerto 6002)
├── sc-ecommerce/                    # Smart Contract E-commerce
│   ├── src/
│   │   ├── Ecommerce.sol           # Contrato principal
│   │   ├── CompanyLib.sol
│   │   ├── ProductLib.sol
│   │   ├── CartLib.sol
│   │   ├── InvoiceLib.sol
│   │   └── PaymentLib.sol
│   ├── test/Ecommerce.t.sol
│   └── script/DeployEcommerce.s.sol
├── web-admin/                       # Panel de administración (Puerto 6003)
├── web-customer/                    # Tienda online (Puerto 6004)
├── restart-all.sh                   # Script de deploy completo
└── README.md
```

## 🛠️ Tecnologías

### Blockchain y Smart Contracts
- **Solidity** ^0.8.24: Lenguaje para smart contracts
- **Foundry/Forge**: Framework de desarrollo y testing
- **Anvil**: Blockchain local para desarrollo
- **Ethers.js v6**: Librería para interactuar con Ethereum
- **OpenZeppelin**: Contratos seguros y estándar

### Frontend
- **Next.js 15**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos
- **MetaMask**: Wallet de criptomonedas

### Pagos
- **Stripe**: Procesamiento de pagos fiat
- **ERC20**: Estándar de token para EuroToken

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** 18+ y npm
2. **Foundry** (Forge, Anvil, Cast)
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```
3. **Git**
4. **MetaMask** (extensión del navegador)
5. **Cuenta de Stripe** (para pagos con tarjeta)

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd ecommerce
```

### 2. Instalar Dependencias de Foundry

```bash
# En stablecoin/sc
cd stablecoin/sc
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# En sc-ecommerce
cd ../../sc-ecommerce
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 3. Instalar Dependencias de Next.js

Para cada aplicación Next.js:

```bash
# Compra Stablecoin
cd stablecoin/compra-stablecoin
npm install

# Pasarela de Pago
cd ../pasarela-de-pago
npm install

# Web Admin
cd ../../web-admin
npm install

# Web Customer
cd ../web-customer
npm install
```

## ⚙️ Configuración

### 1. Configurar Variables de Entorno

Cada aplicación tiene un archivo `.env.example`. Copia y configura según tus necesidades:

#### compra-stablecoin/.env.local
```env
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://localhost:8545
PRIVATE_KEY=0x...  # Solo para mint desde backend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### pasarela-de-pago/.env.local
```env
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

#### web-admin/.env.local
```env
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

#### web-customer/.env.local
```env
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_PAYMENT_GATEWAY_URL=http://localhost:6002
```

### 2. Configurar Stripe

1. Crea una cuenta en [Stripe](https://stripe.com)
2. Obtén tus API keys desde el dashboard (Developers → API keys) y ponlas en `compra-stablecoin/.env.local`
3. **Webhooks en local con Stripe CLI** (recomendado, sin ngrok):
   - Instala [Stripe CLI](https://stripe.com/docs/stripe-cli)
   - Inicia sesión: `stripe login`
   - En una terminal, con compra-stablecoin corriendo en el puerto 6001:
     ```bash
     stripe listen --forward-to localhost:6001/api/webhook
     ```
   - La CLI mostrará algo como: `Ready! Your webhook signing secret is whsec_xxxx...`
   - Copia ese valor y ponlo en `STRIPE_WEBHOOK_SECRET` en `compra-stablecoin/.env.local`
   - No hace falta crear el endpoint en el Dashboard: el listener de la CLI reenvía los eventos a tu app local
4. Para producción: crea un endpoint en el Dashboard (Developers → Webhooks) con tu URL pública y usa su signing secret en `STRIPE_WEBHOOK_SECRET`

### 3. Configurar MetaMask

1. Instala la extensión MetaMask en tu navegador
2. Crea una nueva red local:
   - Network Name: Localhost 8545
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
3. Importa una cuenta de prueba desde Anvil (ver sección de Deploy)

## 🎮 Uso

### Opción 1: Deploy Automatizado (Recomendado)

El script `restart-all.sh` automatiza todo el proceso:

```bash
chmod +x restart-all.sh
./restart-all.sh
```

Este script:
1. Inicia Anvil (blockchain local)
2. Despliega EuroToken
3. Despliega Ecommerce
4. Actualiza variables de entorno
5. Instala dependencias

**Nota**: Después del script, necesitas iniciar manualmente las aplicaciones Next.js en terminales separadas.

### Opción 2: Deploy Manual

#### 1. Iniciar Anvil

```bash
anvil --host 0.0.0.0 --port 8545
```

Anvil mostrará 10 cuentas con fondos. Guarda las private keys para usar en MetaMask.

#### 2. Deploy EuroToken

En una nueva terminal:

```bash
cd stablecoin/sc
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/DeployEuroToken.s.sol --rpc-url http://localhost:8545 --broadcast
```

Copia la dirección del contrato desplegado.

#### 3. Deploy Ecommerce

```bash
cd ../../sc-ecommerce
export EUROTOKEN_ADDRESS=<direccion-del-eurotoken>
forge script script/DeployEcommerce.s.sol --rpc-url http://localhost:8545 --broadcast
```

Copia la dirección del contrato Ecommerce.

#### 4. Actualizar Variables de Entorno

Actualiza los archivos `.env.local` de cada aplicación con las direcciones de los contratos.

#### 5. Iniciar Aplicaciones Next.js

En terminales separadas:

```bash
# Terminal 1: Compra Stablecoin
cd stablecoin/compra-stablecoin
npm run dev

# Terminal 2: Pasarela de Pago
cd stablecoin/pasarela-de-pago
npm run dev

# Terminal 3: Web Admin
cd web-admin
npm run dev

# Terminal 4: Web Customer
cd web-customer
npm run dev

# Terminal 5 (opcional): Stripe CLI para webhooks locales (solo si vas a probar compra de tokens)
stripe listen --forward-to localhost:6001/api/webhook
# Copia el whsec_... que muestra y ponlo en compra-stablecoin/.env.local como STRIPE_WEBHOOK_SECRET
```

### Acceder a las Aplicaciones

- **Compra Stablecoin**: http://localhost:6001
- **Pasarela de Pago**: http://localhost:6002
- **Web Admin**: http://localhost:6003
- **Web Customer**: http://localhost:6004

## 🔄 Flujo Completo de Uso

### 1. Comprar Tokens

1. Ve a http://localhost:6001
2. Conecta MetaMask
3. Ingresa cantidad de EURT a comprar
4. Completa el pago con Stripe (usa tarjetas de prueba)
5. Los tokens se acreditarán automáticamente

### 2. Registrar Empresa (Admin)

1. Ve a http://localhost:6003
2. Conecta MetaMask con una cuenta diferente
3. Registra tu empresa (nombre, NIF)
4. Agrega productos

### 3. Comprar Productos (Cliente)

1. Ve a http://localhost:6004
2. Conecta MetaMask (cuenta con tokens)
3. Navega productos y agrega al carrito
4. Ve al carrito y procede al checkout
5. Se creará una invoice y redirigirá a la pasarela de pago
6. Confirma el pago en la pasarela
7. Verifica tu pedido en "Mis Pedidos"

### 4. Ver Facturas (Admin)

1. En http://localhost:6003, ve a la pestaña "Facturas"
2. Verás todas las facturas de tu empresa
3. Puedes ver el estado (Pagada/Pendiente) y detalles

### 5. IPFS Hash (imagen de producto)

Al registrar productos en web-admin (puerto 6003), el campo **"IPFS Hash (imagen)"** es opcional. Si quieres que el producto muestre una imagen en la tienda:

1. **Sube la imagen a IPFS** usando alguno de estos servicios (gratis):
   - [Pinata](https://app.pinata.cloud): regístrate, sube el archivo y copia el **CID** que te dan.
   - [web3.storage](https://web3.storage): sube el archivo y copia el CID.
2. **Pega solo el CID** en el campo (ej. `QmXyz...` o `bafybei...`). No incluyas `ipfs://` ni la URL completa; la app construye `https://ipfs.io/ipfs/<CID>` automáticamente.
3. Si lo dejas vacío, en la tienda se mostrará "Sin imagen".

## 📁 Estructura del Proyecto

```
ecommerce/
├── stablecoin/
│   ├── sc/                    # Contrato EuroToken
│   ├── compra-stablecoin/     # App compra tokens
│   └── pasarela-de-pago/      # Pasarela de pagos
├── sc-ecommerce/              # Contratos E-commerce
├── web-admin/                 # Panel administración
├── web-customer/              # Tienda online
├── restart-all.sh            # Script deploy
├── .gitignore                # Git ignore
└── README.md                 # Este archivo
```

## 🔒 Seguridad

### Estándares Aplicados

Este proyecto sigue los estándares de seguridad de la industria:

#### Smart Contracts
- ✅ Uso de OpenZeppelin para contratos estándar y seguros
- ✅ Validación de inputs en todas las funciones
- ✅ Control de acceso con `onlyOwner` y verificaciones
- ✅ Protección contra reentrancy (usando transferFrom de ERC20)
- ✅ Validación de stock antes de procesar pagos
- ✅ Uso de SafeMath implícito en Solidity 0.8+

#### Next.js y Web
- ✅ Variables de entorno para secrets (nunca hardcodeadas)
- ✅ Validación de inputs en frontend y backend
- ✅ Sanitización de datos de usuario
- ✅ HTTPS en producción (requerido para Stripe)
- ✅ Validación de webhooks de Stripe
- ✅ Rate limiting recomendado para APIs públicas

#### Archivos y Repositorio
- ✅ `.gitignore` completo para evitar commitear secrets
- ✅ `.env.example` como template sin valores reales
- ✅ No commitear private keys ni credenciales
- ✅ Documentación de seguridad en código

### Checklist de Seguridad

Antes de hacer commit:

- [ ] No hay archivos `.env` o `.env.local` en el commit
- [ ] No hay private keys hardcodeadas
- [ ] No hay API keys en el código
- [ ] Los archivos sensibles están en `.gitignore`
- [ ] Las variables de entorno están documentadas

### Recomendaciones Adicionales

1. **Para Producción**:
   - Usa una red blockchain real (testnet o mainnet)
   - Configura HTTPS
   - Usa un servicio de gestión de secrets (AWS Secrets Manager, etc.)
   - Implementa rate limiting
   - Usa un servicio de monitoreo (Sentry, etc.)

2. **Para Desarrollo**:
   - Nunca uses private keys reales
   - Usa cuentas de prueba de Stripe
   - Mantén los secrets locales y nunca los compartas

## 🧪 Testing

### Tests de Smart Contracts

```bash
# Tests de EuroToken
cd stablecoin/sc
forge test

# Tests de Ecommerce
cd ../../sc-ecommerce
forge test

# Tests con logs detallados
forge test -vvv
```

### Tests de Integración

Los tests de integración requieren que Anvil esté corriendo:

```bash
# Terminal 1: Iniciar Anvil
anvil

# Terminal 2: Ejecutar tests
forge test
```

## 🐛 Troubleshooting

### Problemas Comunes

#### Anvil no inicia
```bash
# Verificar que el puerto 8545 está libre
lsof -i :8545

# Matar proceso si está ocupado
kill -9 <PID>
```

#### MetaMask no se conecta
- Verifica que Anvil está corriendo
- Verifica que la red está configurada correctamente (Chain ID: 31337)
- Intenta recargar la página

#### Contratos no se despliegan
- Verifica que Anvil está corriendo
- Verifica que PRIVATE_KEY está configurada
- Verifica que las dependencias de Foundry están instaladas

#### Next.js no compila
- Verifica que Node.js 18+ está instalado
- Elimina `node_modules` y `package-lock.json`, luego `npm install`
- Verifica que las variables de entorno están configuradas

#### Stripe webhook no funciona
- **En local**: usa el listener de Stripe CLI: `stripe listen --forward-to localhost:6001/api/webhook` y pon en `STRIPE_WEBHOOK_SECRET` el `whsec_...` que muestra la CLI (ver sección "Configurar Stripe")
- Verifica que compra-stablecoin está en marcha en el puerto 6001 antes de lanzar `stripe listen`
- Si prefieres ngrok: expón el puerto 6001, crea el endpoint en el Dashboard con `https://tu-subdominio.ngrok.io/api/webhook` y usa su signing secret
- Comprueba que `STRIPE_WEBHOOK_SECRET` está en `compra-stablecoin/.env.local`

### Logs

Los logs de Anvil se guardan en `anvil.log` cuando se usa el script de deploy.

Para ver logs en tiempo real:
```bash
tail -f anvil.log
```

## 📚 Comandos Útiles

### Foundry

```bash
# Compilar contratos
forge build

# Ejecutar tests
forge test

# Tests con logs
forge test -vvv

# Formatear código
forge fmt

# Limpiar builds
forge clean

# Verificar contrato
forge verify-contract <address> <contract> --chain-id <chain-id>
```

### Anvil

```bash
# Iniciar Anvil
anvil

# Con cuentas específicas
anvil --accounts 10

# Con mnemonic personalizado
anvil --mnemonic "tu mnemonic aquí"
```

### Cast (Interactuar con contratos)

```bash
# Llamar función view
cast call <ADDRESS> "functionName()" --rpc-url http://localhost:8545

# Enviar transacción
cast send <ADDRESS> "functionName(args)" --private-key <KEY> --rpc-url http://localhost:8545

# Obtener balance
cast balance <ADDRESS> --rpc-url http://localhost:8545
```

### Next.js

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Iniciar producción
npm run start

# Linting
npm run lint
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código

- Usa `forge fmt` para formatear Solidity
- Usa ESLint para TypeScript/JavaScript
- Sigue las convenciones de nombres del proyecto
- Documenta funciones complejas
- Escribe tests para nuevas funcionalidades

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- OpenZeppelin por los contratos estándar y seguros
- Foundry por el excelente framework de desarrollo
- Next.js por el framework React
- Stripe por la infraestructura de pagos

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la sección de Troubleshooting
2. Abre un issue en el repositorio
3. Consulta la documentación de las tecnologías utilizadas

---

**⚠️ IMPORTANTE**: Este proyecto es para fines educativos y de desarrollo. No uses en producción sin una auditoría de seguridad completa y las debidas precauciones.
