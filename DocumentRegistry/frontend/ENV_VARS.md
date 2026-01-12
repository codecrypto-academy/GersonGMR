# Variables de Entorno

Crea un archivo `.env.local` en el directorio `frontend/` con las siguientes variables:

```env
# RPC URL para conectar a Anvil (Ethereum local)
# Por defecto: http://127.0.0.1:8545
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Dirección del contrato DocumentRegistry desplegado
# Se obtiene después de desplegar el contrato con Foundry
# Ejemplo: 0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CONTRACT_ADDRESS=

# Mnemonic para generar wallets de prueba (simulación MetaMask)
# NUNCA usar en producción con fondos reales
# Por defecto: "test test test test test test test test test test test junk"
NEXT_PUBLIC_DEFAULT_MNEMONIC=test test test test test test test test test test test junk
```

## Instrucciones

1. Copiar este contenido a un archivo llamado `.env.local` en `frontend/`
2. Desplegar el contrato (ver README.md)
3. Actualizar `NEXT_PUBLIC_CONTRACT_ADDRESS` con la dirección del contrato desplegado
4. Reiniciar el servidor de desarrollo si está corriendo

