#!/bin/bash

# Script para iniciar Anvil con configuración por defecto
# Uso: ./scripts/start-anvil.sh

echo "Iniciando Anvil..."
echo "RPC URL: http://127.0.0.1:8545"
echo ""
echo "Cuentas disponibles:"
echo "Account[0]: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "Presiona Ctrl+C para detener Anvil"
echo ""

anvil

