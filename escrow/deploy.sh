#!/bin/bash

# ============================================================================
# ESCROW DAPP - SCRIPT DE DEPLOYMENT AUTOMATIZADO
# ============================================================================
# Este script despliega todos los contratos necesarios y configura el proyecto
# 
# Requisitos:
#   - Anvil corriendo en http://localhost:8545
#   - Foundry instalado (forge, cast)
#   - Node.js instalado
#
# Uso: ./deploy.sh
# ============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SC_DIR="$SCRIPT_DIR/sc"
WEB_DIR="$SCRIPT_DIR/web"

# Private key de Anvil account #0 (Owner/Deployer)
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Cuentas de test de Anvil
ACCOUNT_0="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ACCOUNT_1="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
ACCOUNT_2="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

# RPC URL
RPC_URL="http://localhost:8545"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   ESCROW DAPP - DEPLOYMENT SCRIPT${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ============================================================================
# Verificaciones previas
# ============================================================================
echo -e "${YELLOW}[1/8] Verificando requisitos...${NC}"

# Verificar que Anvil está corriendo
if ! curl -s "$RPC_URL" -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo -e "${RED}Error: Anvil no está corriendo en $RPC_URL${NC}"
    echo -e "${YELLOW}Ejecuta 'anvil' en otra terminal primero${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Anvil está corriendo${NC}"

# Verificar forge
if ! command -v forge &> /dev/null; then
    echo -e "${RED}Error: Foundry (forge) no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Foundry instalado${NC}"

# ============================================================================
# Instalar dependencias de Foundry
# ============================================================================
echo ""
echo -e "${YELLOW}[2/8] Instalando dependencias de Foundry...${NC}"
cd "$SC_DIR"

# Inicializar git si no existe (requerido por forge install)
if [ ! -d ".git" ]; then
    git init
    git add .
    git commit -m "Initial commit" --allow-empty
    echo -e "${GREEN}✓ Repositorio git inicializado${NC}"
fi

# Crear directorio lib si no existe
mkdir -p lib

# Instalar OpenZeppelin v4.9.6 (compatible con Solidity 0.8.13)
if [ ! -d "lib/openzeppelin-contracts" ]; then
    git clone --branch v4.9.6 --depth 1 https://github.com/OpenZeppelin/openzeppelin-contracts.git lib/openzeppelin-contracts
    echo -e "${GREEN}✓ OpenZeppelin v4.9.6 instalado${NC}"
else
    echo -e "${GREEN}✓ OpenZeppelin ya existe${NC}"
fi

# Instalar ds-test (dependencia de forge-std)
if [ ! -d "lib/ds-test" ]; then
    git clone --depth 1 https://github.com/dapphub/ds-test.git lib/ds-test
    echo -e "${GREEN}✓ ds-test instalado${NC}"
else
    echo -e "${GREEN}✓ ds-test ya existe${NC}"
fi

# Instalar forge-std v1.7.6 (compatible)
if [ ! -d "lib/forge-std" ]; then
    git clone --branch v1.7.6 --depth 1 https://github.com/foundry-rs/forge-std.git lib/forge-std
    echo -e "${GREEN}✓ forge-std instalado${NC}"
else
    echo -e "${GREEN}✓ forge-std ya existe${NC}"
fi

# ============================================================================
# Compilar contratos
# ============================================================================
echo ""
echo -e "${YELLOW}[3/8] Compilando contratos...${NC}"
forge build
echo -e "${GREEN}✓ Contratos compilados${NC}"

# ============================================================================
# Desplegar Escrow
# ============================================================================
echo ""
echo -e "${YELLOW}[4/8] Desplegando contrato Escrow...${NC}"

ESCROW_OUTPUT=$(forge create --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast src/Escrow.sol:Escrow 2>&1)
ESCROW_ADDRESS=$(echo "$ESCROW_OUTPUT" | grep -oE "Deployed to: 0x[a-fA-F0-9]+" | awk '{print $3}')

echo -e "${GREEN}✓ Escrow desplegado en: $ESCROW_ADDRESS${NC}"

# ============================================================================
# Desplegar TokenA
# ============================================================================
echo ""
echo -e "${YELLOW}[5/8] Desplegando Token A (TKA)...${NC}"

TOKEN_A_OUTPUT=$(forge create --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast \
    src/TestToken.sol:TestToken \
    --constructor-args "Token A" "TKA" 18 2>&1)
TOKEN_A_ADDRESS=$(echo "$TOKEN_A_OUTPUT" | grep -oE "Deployed to: 0x[a-fA-F0-9]+" | awk '{print $3}')

echo -e "${GREEN}✓ Token A desplegado en: $TOKEN_A_ADDRESS${NC}"

# ============================================================================
# Desplegar TokenB
# ============================================================================
echo ""
echo -e "${YELLOW}[6/8] Desplegando Token B (TKB)...${NC}"

TOKEN_B_OUTPUT=$(forge create --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast \
    src/TestToken.sol:TestToken \
    --constructor-args "Token B" "TKB" 18 2>&1)
TOKEN_B_ADDRESS=$(echo "$TOKEN_B_OUTPUT" | grep -oE "Deployed to: 0x[a-fA-F0-9]+" | awk '{print $3}')

echo -e "${GREEN}✓ Token B desplegado en: $TOKEN_B_ADDRESS${NC}"

# ============================================================================
# Agregar tokens al Escrow y Mintear
# ============================================================================
echo ""
echo -e "${YELLOW}[7/8] Configurando tokens y minteando...${NC}"

# Agregar Token A al Escrow
cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
    "$ESCROW_ADDRESS" "addToken(address)" "$TOKEN_A_ADDRESS" > /dev/null
echo -e "${GREEN}✓ Token A agregado al Escrow${NC}"

# Agregar Token B al Escrow
cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
    "$ESCROW_ADDRESS" "addToken(address)" "$TOKEN_B_ADDRESS" > /dev/null
echo -e "${GREEN}✓ Token B agregado al Escrow${NC}"

# Cantidad a mintear: 1000 tokens (con 18 decimales)
MINT_AMOUNT="1000000000000000000000"

# Mintear Token A a las 3 cuentas
cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TOKEN_A_ADDRESS" "mint(address,uint256)" "$ACCOUNT_0" "$MINT_AMOUNT" > /dev/null
cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TOKEN_A_ADDRESS" "mint(address,uint256)" "$ACCOUNT_1" "$MINT_AMOUNT" > /dev/null
cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TOKEN_A_ADDRESS" "mint(address,uint256)" "$ACCOUNT_2" "$MINT_AMOUNT" > /dev/null
echo -e "${GREEN}✓ 1000 TKA minteados a las 3 cuentas de test${NC}"

# Mintear Token B a las 3 cuentas
cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TOKEN_B_ADDRESS" "mint(address,uint256)" "$ACCOUNT_0" "$MINT_AMOUNT" > /dev/null
cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TOKEN_B_ADDRESS" "mint(address,uint256)" "$ACCOUNT_1" "$MINT_AMOUNT" > /dev/null
cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
    "$TOKEN_B_ADDRESS" "mint(address,uint256)" "$ACCOUNT_2" "$MINT_AMOUNT" > /dev/null
echo -e "${GREEN}✓ 1000 TKB minteados a las 3 cuentas de test${NC}"

# ============================================================================
# Actualizar contracts.ts en el frontend
# ============================================================================
echo ""
echo -e "${YELLOW}[8/8] Actualizando configuración del frontend...${NC}"

CONTRACTS_FILE="$WEB_DIR/lib/contracts.ts"

# Leer el archivo y reemplazar las direcciones
if [ -f "$CONTRACTS_FILE" ]; then
    # Crear archivo temporal
    sed -i.bak \
        -e "s|export const ESCROW_ADDRESS = '.*'|export const ESCROW_ADDRESS = '$ESCROW_ADDRESS'|" \
        -e "s|export const TOKEN_A_ADDRESS = '.*'|export const TOKEN_A_ADDRESS = '$TOKEN_A_ADDRESS'|" \
        -e "s|export const TOKEN_B_ADDRESS = '.*'|export const TOKEN_B_ADDRESS = '$TOKEN_B_ADDRESS'|" \
        "$CONTRACTS_FILE"
    rm -f "$CONTRACTS_FILE.bak"
    echo -e "${GREEN}✓ contracts.ts actualizado${NC}"
else
    echo -e "${YELLOW}⚠ No se encontró contracts.ts, las direcciones se mostrarán abajo${NC}"
fi

# ============================================================================
# Generar archivo de información de deployment
# ============================================================================
DEPLOYMENT_INFO="$SCRIPT_DIR/deployment-info.txt"
cat > "$DEPLOYMENT_INFO" << EOF
============================================
ESCROW DAPP - DEPLOYMENT INFO
============================================
Fecha: $(date)
Red: Anvil (localhost:8545)
Chain ID: 31337

CONTRATOS DESPLEGADOS
--------------------------------------------
Escrow:   $ESCROW_ADDRESS
Token A:  $TOKEN_A_ADDRESS (TKA)
Token B:  $TOKEN_B_ADDRESS (TKB)

CUENTAS DE TEST (1000 TKA + 1000 TKB cada una)
--------------------------------------------
Account #0 (Owner): $ACCOUNT_0
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: $ACCOUNT_1
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: $ACCOUNT_2
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

CONFIGURACIÓN DE METAMASK
--------------------------------------------
Network Name: Anvil Local
RPC URL: http://localhost:8545
Chain ID: 31337
Currency Symbol: ETH

COMANDOS ÚTILES
--------------------------------------------
Iniciar frontend:
  cd web && npm install && npm run dev

Ejecutar tests:
  cd sc && forge test -vvv

Ver balances de tokens:
  cast call $TOKEN_A_ADDRESS "balanceOf(address)(uint256)" $ACCOUNT_0 --rpc-url $RPC_URL

============================================
EOF

echo -e "${GREEN}✓ deployment-info.txt generado${NC}"

# ============================================================================
# Resumen final
# ============================================================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   DEPLOYMENT COMPLETADO EXITOSAMENTE${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${GREEN}Contratos desplegados:${NC}"
echo -e "  Escrow:   ${YELLOW}$ESCROW_ADDRESS${NC}"
echo -e "  Token A:  ${YELLOW}$TOKEN_A_ADDRESS${NC}"
echo -e "  Token B:  ${YELLOW}$TOKEN_B_ADDRESS${NC}"
echo ""
echo -e "${GREEN}Tokens minteados:${NC}"
echo -e "  1000 TKA + 1000 TKB a cada cuenta de test"
echo ""
echo -e "${GREEN}Próximos pasos:${NC}"
echo -e "  1. cd web && npm install"
echo -e "  2. npm run dev"
echo -e "  3. Abrir http://localhost:3000"
echo -e "  4. Conectar MetaMask con red localhost:8545 (Chain ID: 31337)"
echo -e "  5. Importar cuentas de test con las private keys"
echo ""
echo -e "${BLUE}Ver deployment-info.txt para más detalles${NC}"
echo ""
