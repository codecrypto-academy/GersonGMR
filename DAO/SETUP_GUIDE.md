# 🚀 Guía de Setup Rápido - DAO Voting

Guía paso a paso para poner en marcha el proyecto completo en minutos.

## ⚡ Setup Rápido (5 minutos)

### 1. Requisitos Previos

Instalar herramientas necesarias:

```bash
# Verificar Node.js (debe ser v18+)
node --version

# Instalar Foundry si no está instalado
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verificar instalación
forge --version
anvil --version
```

### 2. Clonar o Navegar al Proyecto

```bash
cd "c:\Users\ggers\IA Projects\GersonGMR\DAO"
```

### 3. Setup de Smart Contracts

```bash
cd sc

# Instalar dependencias de Foundry
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std

# Compilar contratos
forge build

# Ejecutar tests
forge test
```

### 4. Iniciar Blockchain Local

Abrir **nueva terminal** y ejecutar:

```bash
anvil
```

**⚠️ IMPORTANTE**: Copia las **claves privadas** y **direcciones** que muestra Anvil. Las necesitarás más adelante.

Ejemplo de salida de Anvil:
```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...

Private Keys
==================
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...
```

### 5. Desplegar Contratos

En otra terminal (dejando Anvil corriendo):

```bash
cd sc

# Crear archivo .env con la primera private key de Anvil
echo "PRIVATE_KEY=" > .env

# Desplegar
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

**📋 Guarda las direcciones de los contratos que se muestran!**

Ejemplo de salida:
```
MinimalForwarder deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
DAOVoting deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### 6. Setup del Frontend

```bash
cd ../web

# Instalar dependencias
npm install

# Crear archivo .env.local
cp env.example .env.local
```

**Editar `.env.local`** con las direcciones de los contratos:

```env
# Reemplazar con las direcciones del deployment
NEXT_PUBLIC_DAO_ADDRESS=
NEXT_PUBLIC_FORWARDER_ADDRESS=

# Configuración de red local
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Relayer - usar cuenta (1) de Anvil
RELAYER_PRIVATE_KEY=
RELAYER_ADDRESS=
RPC_URL=http://127.0.0.1:8545
```

### 7. Iniciar Frontend

```bash
npm run dev
```

Abrir navegador en: **http://localhost:3000**

### 8. Configurar MetaMask

1. Abrir MetaMask
2. Agregar red personalizada:
   - **Network Name**: Localhost
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

3. Importar cuentas de Anvil:
   - Clic en icono de cuenta → Import Account
   - Pegar private key de cuenta (0) o (2) de Anvil
   - **NO uses la (1) porque es el relayer**

## ✅ Verificación

Deberías tener **3 terminales** corriendo:

1. **Terminal 1**: Anvil (blockchain local)
2. **Terminal 2**: Frontend Next.js (`npm run dev`)
3. **Terminal 3**: Libre para comandos

## 🎯 Primer Uso

### Paso 1: Fondear el DAO

1. Conecta tu wallet en http://localhost:3000
2. Ve a "Fund the DAO"
3. Ingresa 10 ETH
4. Confirma transacción en MetaMask

### Paso 2: Crear Propuesta

1. Ve a "Create Proposal"
2. Completa el formulario:
   - **Recipient**: Cualquier dirección (ej: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`)
   - **Amount**: 5 ETH
   - **Voting Period**: 7 días

3. Haz clic en "Create Proposal"
4. Confirma en MetaMask

### Paso 3: Votar (Gasless!)

1. Ve a la propuesta que creaste
2. Asegúrate que "Use gasless voting" esté marcado
3. Haz clic en "Vote FOR"
4. **Solo firma** el mensaje en MetaMask (sin pagar gas!)
5. El voto se registrará automáticamente

### Paso 4: Probar con Múltiples Usuarios

1. Importa otra cuenta de Anvil en MetaMask
2. Cambia a esa cuenta
3. Fondea el DAO con esa cuenta
4. Vota en la propuesta

## 🔄 Flujo Completo de Prueba

```bash
# Usuario A (cuenta 0 de Anvil)
1. Fondear DAO con 10 ETH
2. Crear propuesta: 5 ETH a dirección X
3. Votar FOR (gasless)

# Usuario B (cuenta 2 de Anvil)
1. Fondear DAO con 5 ETH
2. Votar AGAINST en propuesta (gasless)

# Usuario C (cuenta 3 de Anvil)
1. Fondear DAO con 20 ETH
2. Votar FOR en propuesta (gasless)

# Resultado
- Propuesta aprobada (30 FOR vs 5 AGAINST)
- Después del deadline + 1 hora, se puede ejecutar
```

## 🛠️ Comandos de Desarrollo

### Reiniciar Todo

```bash
# Terminal con Anvil: Ctrl+C, luego
anvil

# Volver a desplegar contratos
cd sc
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Actualizar .env.local con nuevas direcciones
# Reiniciar frontend: Ctrl+C, luego
npm run dev
```

### Ver Logs

```bash
# Ver logs de Anvil
# (ya se muestran en la terminal donde corre)

# Ver logs del frontend
# (ya se muestran en la terminal de npm run dev)

# Ver logs del relayer
# (aparecen en la terminal de npm run dev cuando se hace una votación gasless)
```

### Tests

```bash
# Tests de contratos
cd sc
forge test

# Tests verbose
forge test -vvv

# Gas report
forge test --gas-report

# Coverage
forge coverage
```

## 🐛 Problemas Comunes

### "User rejected transaction"
→ Hiciste clic en "Reject" en MetaMask. Vuelve a intentar.

### "Insufficient balance to create proposal"
→ Necesitas al menos 10% del balance total del DAO.

### "Contract addresses not configured"
→ Verifica que `.env.local` tenga las direcciones correctas del deployment.

### Frontend no conecta con contratos
→ Verifica que Anvil esté corriendo y las direcciones sean correctas.

### MetaMask no muestra transacciones
→ Ve a MetaMask → Settings → Advanced → Reset Account

### Error de nonce
→ MetaMask → Settings → Advanced → Reset Account

## 📞 Soporte

Si algo no funciona:

1. Verifica que Anvil esté corriendo
2. Verifica que las direcciones en `.env.local` sean correctas
3. Revisa los logs en ambas terminales
4. Reinicia todo el proceso desde el paso 4

## 🎉 ¡Listo!

Ahora tienes un DAO completamente funcional con votación gasless!

### Próximos Pasos

- Experimentar con múltiples cuentas
- Probar el daemon de ejecución automática: `curl http://localhost:3000/api/daemon`
- Modificar los contratos y volver a desplegar
- Explorar el código y aprender

---

**¿Preguntas? Revisa el README.md principal para más detalles.**
