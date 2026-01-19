# ⚠️ IMPORTANTE: Actualizar Direcciones de Contratos

Los contratos han sido re-desplegados con un fix importante para el balance del DAO.

## Acción Requerida

Por favor, actualiza el archivo `web/.env.local` con las nuevas direcciones:

```env
# Contract Addresses (get these after deploying contracts)
NEXT_PUBLIC_FORWARDER_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
NEXT_PUBLIC_DAO_ADDRESS=0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Relayer Configuration (server-side only)
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
RELAYER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
RPC_URL=http://127.0.0.1:8545
```

## Cambios Realizados

1. ✅ **Campo de descripción** agregado a las propuestas
2. ✅ **Barras individuales** para cada tipo de voto (FOR, AGAINST, ABSTAIN)
3. ✅ **Sistema de votación 1 persona = 1 voto** (ya no es ponderado por ETH)
4. ✅ **Actualización instantánea** después de votar (sin recargar página)
5. ✅ **Contador de proposals** en el panel de funding
6. ✅ **FIX CRÍTICO**: `totalBalance` ahora se actualiza correctamente después de ejecutar proposals

## Después de actualizar .env.local

Reinicia el servidor Next.js:

```bash
# Ctrl+C para detener
cd web
npm run dev
```

## Nota

Los fondos depositados en el contrato anterior se perdieron (solo en Anvil local). Necesitarás:
1. Depositar fondos nuevamente en el DAO
2. Crear nuevas propuestas (ahora con descripción)
3. Votar en las nuevas propuestas

Puedes eliminar este archivo después de actualizar las direcciones.
