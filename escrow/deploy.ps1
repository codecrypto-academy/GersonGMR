# ============================================================================
# ESCROW DAPP - SCRIPT DE DEPLOYMENT AUTOMATIZADO (PowerShell)
# ============================================================================
# Este script despliega todos los contratos necesarios y configura el proyecto
# 
# Requisitos:
#   - Anvil corriendo en http://localhost:8545
#   - Foundry instalado (forge, cast)
#   - Node.js instalado
#
# Uso: .\deploy.ps1
# ============================================================================

$ErrorActionPreference = "Stop"

# Directorio del script
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$SC_DIR = Join-Path $SCRIPT_DIR "sc"
$WEB_DIR = Join-Path $SCRIPT_DIR "web"

# Private key de Anvil account #0 (Owner/Deployer)
$PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Cuentas de test de Anvil
$ACCOUNT_0 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
$ACCOUNT_1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
$ACCOUNT_2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

# RPC URL
$RPC_URL = "http://localhost:8545"

Write-Host "============================================" -ForegroundColor Blue
Write-Host "   ESCROW DAPP - DEPLOYMENT SCRIPT" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# ============================================================================
# Verificaciones previas
# ============================================================================
Write-Host "[1/8] Verificando requisitos..." -ForegroundColor Yellow

# Verificar que Anvil está corriendo
try {
    $response = Invoke-WebRequest -Uri $RPC_URL -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -ErrorAction SilentlyContinue
    Write-Host "✓ Anvil está corriendo" -ForegroundColor Green
} catch {
    Write-Host "Error: Anvil no está corriendo en $RPC_URL" -ForegroundColor Red
    Write-Host "Ejecuta 'anvil' en otra terminal primero" -ForegroundColor Yellow
    exit 1
}

# Verificar forge
try {
    $null = Get-Command forge -ErrorAction Stop
    Write-Host "✓ Foundry instalado" -ForegroundColor Green
} catch {
    Write-Host "Error: Foundry (forge) no está instalado" -ForegroundColor Red
    exit 1
}

# ============================================================================
# Instalar dependencias de Foundry
# ============================================================================
Write-Host ""
Write-Host "[2/8] Instalando dependencias de Foundry..." -ForegroundColor Yellow
Set-Location $SC_DIR

# Inicializar git si no existe (requerido por forge install)
if (!(Test-Path ".git")) {
    git init
    git add .
    git commit -m "Initial commit" --allow-empty
    Write-Host "✓ Repositorio git inicializado" -ForegroundColor Green
}

# Crear directorio lib si no existe
if (!(Test-Path "lib")) {
    New-Item -ItemType Directory -Path "lib" | Out-Null
}

# Instalar OpenZeppelin v4.9.6 (compatible con Solidity 0.8.13)
if (!(Test-Path "lib/openzeppelin-contracts")) {
    git clone --branch v4.9.6 --depth 1 https://github.com/OpenZeppelin/openzeppelin-contracts.git lib/openzeppelin-contracts
    Write-Host "✓ OpenZeppelin v4.9.6 instalado" -ForegroundColor Green
} else {
    Write-Host "✓ OpenZeppelin ya existe" -ForegroundColor Green
}

# Instalar ds-test (dependencia de forge-std)
if (!(Test-Path "lib/ds-test")) {
    git clone --depth 1 https://github.com/dapphub/ds-test.git lib/ds-test
    Write-Host "✓ ds-test instalado" -ForegroundColor Green
} else {
    Write-Host "✓ ds-test ya existe" -ForegroundColor Green
}

# Instalar forge-std v1.7.6 (compatible)
if (!(Test-Path "lib/forge-std")) {
    git clone --branch v1.7.6 --depth 1 https://github.com/foundry-rs/forge-std.git lib/forge-std
    Write-Host "✓ forge-std instalado" -ForegroundColor Green
} else {
    Write-Host "✓ forge-std ya existe" -ForegroundColor Green
}

# ============================================================================
# Compilar contratos
# ============================================================================
Write-Host ""
Write-Host "[3/8] Compilando contratos..." -ForegroundColor Yellow
forge build
Write-Host "✓ Contratos compilados" -ForegroundColor Green

# ============================================================================
# Función para extraer dirección del output
# ============================================================================
function Get-DeployedAddress {
    param($Output)
    $match = $Output | Select-String -Pattern "Deployed to: (0x[a-fA-F0-9]+)"
    if ($match) {
        return $match.Matches[0].Groups[1].Value
    }
    return $null
}

# ============================================================================
# Desplegar Escrow
# ============================================================================
Write-Host ""
Write-Host "[4/8] Desplegando contrato Escrow..." -ForegroundColor Yellow

$escrowOutput = forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast src/Escrow.sol:Escrow 2>&1
$ESCROW_ADDRESS = Get-DeployedAddress $escrowOutput

Write-Host "✓ Escrow desplegado en: $ESCROW_ADDRESS" -ForegroundColor Green

# ============================================================================
# Desplegar TokenA
# ============================================================================
Write-Host ""
Write-Host "[5/8] Desplegando Token A (TKA)..." -ForegroundColor Yellow

$tokenAOutput = forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast src/TestToken.sol:TestToken --constructor-args "Token A" "TKA" 18 2>&1
$TOKEN_A_ADDRESS = Get-DeployedAddress $tokenAOutput

Write-Host "✓ Token A desplegado en: $TOKEN_A_ADDRESS" -ForegroundColor Green

# ============================================================================
# Desplegar TokenB
# ============================================================================
Write-Host ""
Write-Host "[6/8] Desplegando Token B (TKB)..." -ForegroundColor Yellow

$tokenBOutput = forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast src/TestToken.sol:TestToken --constructor-args "Token B" "TKB" 18 2>&1
$TOKEN_B_ADDRESS = Get-DeployedAddress $tokenBOutput

Write-Host "✓ Token B desplegado en: $TOKEN_B_ADDRESS" -ForegroundColor Green

# ============================================================================
# Agregar tokens al Escrow y Mintear
# ============================================================================
Write-Host ""
Write-Host "[7/8] Configurando tokens y minteando..." -ForegroundColor Yellow

# Agregar Token A al Escrow
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $ESCROW_ADDRESS "addToken(address)" $TOKEN_A_ADDRESS 2>&1 | Out-Null
Write-Host "✓ Token A agregado al Escrow" -ForegroundColor Green

# Agregar Token B al Escrow
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $ESCROW_ADDRESS "addToken(address)" $TOKEN_B_ADDRESS 2>&1 | Out-Null
Write-Host "✓ Token B agregado al Escrow" -ForegroundColor Green

# Cantidad a mintear: 1000 tokens (con 18 decimales)
$MINT_AMOUNT = "1000000000000000000000"

# Mintear Token A a las 3 cuentas
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $TOKEN_A_ADDRESS "mint(address,uint256)" $ACCOUNT_0 $MINT_AMOUNT 2>&1 | Out-Null
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $TOKEN_A_ADDRESS "mint(address,uint256)" $ACCOUNT_1 $MINT_AMOUNT 2>&1 | Out-Null
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $TOKEN_A_ADDRESS "mint(address,uint256)" $ACCOUNT_2 $MINT_AMOUNT 2>&1 | Out-Null
Write-Host "✓ 1000 TKA minteados a las 3 cuentas de test" -ForegroundColor Green

# Mintear Token B a las 3 cuentas
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $TOKEN_B_ADDRESS "mint(address,uint256)" $ACCOUNT_0 $MINT_AMOUNT 2>&1 | Out-Null
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $TOKEN_B_ADDRESS "mint(address,uint256)" $ACCOUNT_1 $MINT_AMOUNT 2>&1 | Out-Null
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $TOKEN_B_ADDRESS "mint(address,uint256)" $ACCOUNT_2 $MINT_AMOUNT 2>&1 | Out-Null
Write-Host "✓ 1000 TKB minteados a las 3 cuentas de test" -ForegroundColor Green

# ============================================================================
# Actualizar contracts.ts en el frontend
# ============================================================================
Write-Host ""
Write-Host "[8/8] Actualizando configuración del frontend..." -ForegroundColor Yellow

$CONTRACTS_FILE = Join-Path $WEB_DIR "lib/contracts.ts"

if (Test-Path $CONTRACTS_FILE) {
    $content = Get-Content $CONTRACTS_FILE -Raw
    $content = $content -replace "export const ESCROW_ADDRESS = '.*'", "export const ESCROW_ADDRESS = '$ESCROW_ADDRESS'"
    $content = $content -replace "export const TOKEN_A_ADDRESS = '.*'", "export const TOKEN_A_ADDRESS = '$TOKEN_A_ADDRESS'"
    $content = $content -replace "export const TOKEN_B_ADDRESS = '.*'", "export const TOKEN_B_ADDRESS = '$TOKEN_B_ADDRESS'"
    Set-Content $CONTRACTS_FILE $content
    Write-Host "✓ contracts.ts actualizado" -ForegroundColor Green
} else {
    Write-Host "⚠ No se encontró contracts.ts" -ForegroundColor Yellow
}

# ============================================================================
# Generar archivo de información de deployment
# ============================================================================
$DEPLOYMENT_INFO = Join-Path $SCRIPT_DIR "deployment-info.txt"
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$infoContent = @"
============================================
ESCROW DAPP - DEPLOYMENT INFO
============================================
Fecha: $date
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

CONFIGURACION DE METAMASK
--------------------------------------------
Network Name: Anvil Local
RPC URL: http://localhost:8545
Chain ID: 31337
Currency Symbol: ETH

COMANDOS UTILES
--------------------------------------------
Iniciar frontend:
  cd web && npm install && npm run dev

Ejecutar tests:
  cd sc && forge test -vvv

============================================
"@

Set-Content $DEPLOYMENT_INFO $infoContent
Write-Host "✓ deployment-info.txt generado" -ForegroundColor Green

# ============================================================================
# Resumen final
# ============================================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "   DEPLOYMENT COMPLETADO EXITOSAMENTE" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Contratos desplegados:" -ForegroundColor Green
Write-Host "  Escrow:   $ESCROW_ADDRESS" -ForegroundColor Yellow
Write-Host "  Token A:  $TOKEN_A_ADDRESS" -ForegroundColor Yellow
Write-Host "  Token B:  $TOKEN_B_ADDRESS" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tokens minteados:" -ForegroundColor Green
Write-Host "  1000 TKA + 1000 TKB a cada cuenta de test"
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Green
Write-Host "  1. cd web && npm install"
Write-Host "  2. npm run dev"
Write-Host "  3. Abrir http://localhost:3000"
Write-Host "  4. Conectar MetaMask con red localhost:8545 (Chain ID: 31337)"
Write-Host "  5. Importar cuentas de test con las private keys"
Write-Host ""
Write-Host "Ver deployment-info.txt para más detalles" -ForegroundColor Blue
Write-Host ""

Set-Location $SCRIPT_DIR
