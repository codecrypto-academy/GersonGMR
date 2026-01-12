#!/bin/bash

# Script de despliegue para DocumentRegistry
# Uso: ./scripts/deploy.sh [RPC_URL] [PRIVATE_KEY]

RPC_URL=${1:-http://127.0.0.1:8545}
PRIVATE_KEY=${2:-$PRIVATE_KEY}

if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY no está definido"
    echo "Uso: ./scripts/deploy.sh [RPC_URL] [PRIVATE_KEY]"
    echo "O exportar PRIVATE_KEY como variable de entorno"
    exit 1
fi

echo "Desplegando DocumentRegistry..."
echo "RPC URL: $RPC_URL"

forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $RPC_URL \
    --broadcast \
    --private-key $PRIVATE_KEY

echo "Despliegue completado!"
echo "No olvides actualizar NEXT_PUBLIC_CONTRACT_ADDRESS en frontend/.env.local"

