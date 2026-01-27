#!/bin/bash

# Script de deploy completo para el sistema de e-commerce con blockchain
# Este script automatiza el proceso de deploy de todos los componentes

set -e

echo "=========================================="
echo "  E-Commerce Blockchain - Deploy Completo"
echo "=========================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -d "stablecoin" ] || [ ! -d "sc-ecommerce" ]; then
    print_error "Este script debe ejecutarse desde el directorio raíz del proyecto (ecommerce/)"
    exit 1
fi

# Verificar que Foundry (forge, cast, anvil) está instalado
if ! command -v forge &> /dev/null; then
    print_error "Foundry no está instalado. Por favor instálalo desde https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi
if ! command -v anvil &> /dev/null; then
    print_error "Anvil no encontrado. Ejecuta 'foundryup' para actualizar Foundry."
    exit 1
fi

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    exit 1
fi

# Función para verificar si Anvil está respondiendo (portable: Linux, Mac, Windows/Git Bash)
anvil_responding() {
    cast block-number --rpc-url http://localhost:8545 2>/dev/null && return 0
    return 1
}

# 1. Asegurar que Anvil está corriendo
if anvil_responding; then
    print_info "Anvil ya está corriendo en el puerto 8545. Continuando..."
else
    print_info "Iniciando Anvil (blockchain local)..."
    ANVIL_LOG="anvil.log"
    anvil --host 127.0.0.1 --port 8545 > "$ANVIL_LOG" 2>&1 &
    ANVIL_PID=$!
    sleep 5

    if ! anvil_responding; then
        print_error "No se pudo iniciar Anvil. Últimas líneas de $ANVIL_LOG:"
        echo "---"
        tail -20 "$ANVIL_LOG" 2>/dev/null || cat "$ANVIL_LOG" 2>/dev/null
        echo "---"
        echo ""
        print_warning "En Windows/Git Bash, inicia Anvil manualmente en OTRA terminal:"
        echo "  anvil --host 127.0.0.1 --port 8545"
        echo ""
        print_warning "Cuando Anvil esté corriendo, vuelve a ejecutar: ./restart-all.sh"
        exit 1
    fi
    print_info "Anvil iniciado (PID: $ANVIL_PID)"
fi

# Configurar variable de entorno para private key (primera cuenta de Anvil)
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 2. Deploy EuroToken
print_info "Desplegando contrato EuroToken..."
cd stablecoin/sc

# Instalar dependencias si es necesario
if [ ! -d "lib" ]; then
    print_info "Instalando dependencias de Foundry..."
    forge install OpenZeppelin/openzeppelin-contracts
fi

# Compilar contratos
forge build

# Deploy EuroToken
EUROTOKEN_ADDRESS=$(forge script script/DeployEuroToken.s.sol --rpc-url http://localhost:8545 --broadcast -vvv | grep "EuroToken deployed at:" | awk '{print $NF}')

if [ -z "$EUROTOKEN_ADDRESS" ]; then
    print_error "No se pudo obtener la dirección del contrato EuroToken"
    exit 1
fi

print_info "EuroToken desplegado en: $EUROTOKEN_ADDRESS"
export EUROTOKEN_ADDRESS

cd ../..

# 3. Deploy Ecommerce
print_info "Desplegando contrato Ecommerce..."
cd sc-ecommerce

# Instalar dependencias si es necesario
if [ ! -d "lib" ]; then
    print_info "Instalando dependencias de Foundry..."
    forge install OpenZeppelin/openzeppelin-contracts
fi

# Compilar contratos
forge build

# Deploy Ecommerce
ECOMMERCE_ADDRESS=$(forge script script/DeployEcommerce.s.sol --rpc-url http://localhost:8545 --broadcast -vvv | grep "Ecommerce deployed at:" | awk '{print $NF}')

if [ -z "$ECOMMERCE_ADDRESS" ]; then
    print_error "No se pudo obtener la dirección del contrato Ecommerce"
    exit 1
fi

print_info "Ecommerce desplegado en: $ECOMMERCE_ADDRESS"
export ECOMMERCE_ADDRESS

cd ..

# 4. Actualizar variables de entorno de las aplicaciones Next.js
print_info "Actualizando variables de entorno..."

# compra-stablecoin
if [ -f "stablecoin/compra-stablecoin/.env.example" ]; then
    cat > stablecoin/compra-stablecoin/.env.local << EOF
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_RPC_URL=http://localhost:8545
PRIVATE_KEY=$PRIVATE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
EOF
    print_info "Variables de entorno actualizadas para compra-stablecoin"
fi

# pasarela-de-pago
if [ -f "stablecoin/pasarela-de-pago/.env.example" ]; then
    cat > stablecoin/pasarela-de-pago/.env.local << EOF
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_RPC_URL=http://localhost:8545
EOF
    print_info "Variables de entorno actualizadas para pasarela-de-pago"
fi

# web-admin
if [ -f "web-admin/.env.example" ]; then
    cat > web-admin/.env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_RPC_URL=http://localhost:8545
EOF
    print_info "Variables de entorno actualizadas para web-admin"
fi

# web-customer
if [ -f "web-customer/.env.example" ]; then
    cat > web-customer/.env.local << EOF
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$EUROTOKEN_ADDRESS
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_PAYMENT_GATEWAY_URL=http://localhost:6002
EOF
    print_info "Variables de entorno actualizadas para web-customer"
fi

# 5. Instalar dependencias de las aplicaciones Next.js
print_info "Instalando dependencias de las aplicaciones Next.js..."
ECOMMERCE_ROOT="$(pwd)"

for app in stablecoin/compra-stablecoin stablecoin/pasarela-de-pago web-admin web-customer; do
    cd "$ECOMMERCE_ROOT"
    if [ -d "$app" ]; then
        print_info "Instalando dependencias para $app..."
        cd "$app"
        if [ ! -f "package.json" ]; then
            print_warning "No se encontró package.json en $app, saltando..."
            continue
        fi
        # Instalar dependencias (si node_modules no existe o si package.json fue modificado)
        if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
            npm install
        else
            print_info "Dependencias ya instaladas para $app"
        fi
    else
        print_warning "Directorio $app no encontrado, saltando..."
    fi
done
cd "$ECOMMERCE_ROOT"

# 6. Mostrar resumen
echo ""
echo "=========================================="
echo "  Deploy Completado"
echo "=========================================="
echo ""
print_info "Direcciones de contratos:"
echo "  EuroToken:  $EUROTOKEN_ADDRESS"
echo "  Ecommerce:  $ECOMMERCE_ADDRESS"
echo ""
print_info "Aplicaciones disponibles en:"
echo "  Compra Stablecoin:  http://localhost:6001"
echo "  Pasarela de Pago:   http://localhost:6002"
echo "  Web Admin:           http://localhost:6003"
echo "  Web Customer:        http://localhost:6004"
echo ""
print_warning "Para iniciar las aplicaciones Next.js, ejecuta en terminales separadas:"
echo "  cd stablecoin/compra-stablecoin && npm run dev"
echo "  cd stablecoin/pasarela-de-pago && npm run dev"
echo "  cd web-admin && npm run dev"
echo "  cd web-customer && npm run dev"
echo ""
if [ -n "$ANVIL_PID" ]; then
    print_info "Anvil está en segundo plano (PID: $ANVIL_PID). Para detener: kill $ANVIL_PID"
else
    print_info "Anvil está en http://localhost:8545 (lo iniciaste en otra terminal)"
fi
echo ""
