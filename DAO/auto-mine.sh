#!/bin/bash

# Auto-mine script for Anvil
# Este script mina un nuevo bloque cada 5 segundos para que el frontend
# pueda detectar cambios de estado en tiempo real

echo "🔨 Auto-mining started (mining every 5 seconds)"
echo "Press Ctrl+C to stop"
echo ""

while true; do
  TIMESTAMP=$(date +"%H:%M:%S")
  echo "[$TIMESTAMP] Mining new block..."
  cast rpc evm_mine --rpc-url http://127.0.0.1:8545 > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "[$TIMESTAMP] ✅ Block mined successfully"
  else
    echo "[$TIMESTAMP] ❌ Failed to mine block (is Anvil running?)"
  fi
  
  sleep 5
done
