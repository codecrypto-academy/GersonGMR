# 🛡️ Error Handling en el DAO

Este documento explica cómo el frontend maneja todos los errores del contrato y los presenta de manera amigable al usuario.

## 📋 Arquitectura

### 1. Manejador Central de Errores
**Archivo**: `web/lib/errorHandler.ts`

Esta función mapea todos los errores técnicos del contrato a mensajes user-friendly:

```typescript
getErrorMessage(error: any): string
```

### 2. Errores del Contrato Mapeados

#### Funding Errors (fundDao)
| Error del Contrato | Mensaje Amigable |
|-------------------|------------------|
| `Must send ETH` | "Please enter an amount greater than 0 ETH" |

#### Create Proposal Errors
| Error del Contrato | Mensaje Amigable |
|-------------------|------------------|
| `Invalid recipient` | "The recipient address is not valid" |
| `Cannot send funds to DAO itself` | "You cannot create a proposal to send funds to the DAO itself" |
| `Amount must be greater than 0` | "The amount must be greater than 0 ETH" |
| `Insufficient DAO balance` | "The DAO doesn't have enough funds for this proposal" |
| `Deadline must be in the future` | "The voting deadline must be in the future" |
| `Description cannot be empty` | "Please provide a description for your proposal" |
| `Insufficient balance to create proposal` | "You need to have at least 10% of the DAO's total balance to create a proposal" |

#### Voting Errors
| Error del Contrato | Mensaje Amigable |
|-------------------|------------------|
| `Invalid proposal ID` | "This proposal doesn't exist" |
| `Voting period has ended` | "The voting period for this proposal has ended" |
| `Proposal already executed` | "This proposal has already been executed" |
| `Must have balance to vote` | "You need to deposit funds to the DAO before you can vote" |

#### Execution Errors
| Error del Contrato | Mensaje Amigable |
|-------------------|------------------|
| `Voting period not ended` | "The voting period hasn't ended yet" |
| `Execution delay period not passed` | "The execution delay period hasn't passed yet. Please wait 1 hour after the deadline" |
| `Proposal not approved` | "This proposal was not approved (more votes against than for)" |
| `Insufficient contract balance` | "The DAO doesn't have enough funds to execute this proposal" |
| `Transfer failed` | "The transfer to the recipient failed. Please try again" |

#### User/Wallet Errors
| Error | Mensaje Amigable |
|-------|------------------|
| User rejected transaction | "You cancelled the transaction" |
| Insufficient gas | "You don't have enough ETH in your wallet to pay for gas fees" |
| Wrong network | "Please connect to the correct network (Anvil on localhost:8545)" |
| MetaMask not installed | "Please install MetaMask to use this application" |
| Invalid address | "Invalid Ethereum address. Please check the address and try again" |
| Network error | "Network connection error. Please check your internet connection and make sure Anvil is running" |

## 🔧 Componentes Actualizados

### 1. **FundingPanel.tsx**
- Maneja errores al depositar fondos
- Muestra mensajes claros cuando falla el depósito

### 2. **CreateProposal.tsx**
- Valida direcciones de destinatario
- Muestra errores cuando no tienes suficiente balance para crear propuestas
- Valida que la descripción no esté vacía

### 3. **VoteButtons.tsx**
- Maneja errores en votaciones gasless
- Informa cuando el período de votación ha terminado
- Avisa si no tienes fondos depositados

### 4. **ProposalCard.tsx**
- Maneja errores al ejecutar propuestas
- Informa sobre delays de ejecución
- Muestra errores de fondos insuficientes

### 5. **Web3Context.tsx**
- Maneja errores al conectar MetaMask
- Valida que el usuario tenga MetaMask instalado

### 6. **API Relayer** (`app/api/relay/route.ts`)
- Extrae mensajes de error de contratos revertidos
- Envía mensajes claros al frontend

## 🎨 Diseño de Mensajes

Todos los componentes usan el mismo patrón para mostrar mensajes:

```tsx
{message && (
  <div className={`p-3 rounded-lg text-sm ${
    message.includes("✅") 
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
      : message.includes("❌")
      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  }`}>
    {message}
  </div>
)}
```

### Estados de Mensajes:
- ✅ **Éxito** (verde): Operación completada
- ❌ **Error** (rojo): Operación fallida con mensaje amigable
- ℹ️ **Info** (azul): Operación en progreso

## 🧪 Ejemplos de Uso

### Ejemplo 1: Usuario sin fondos intenta votar
```typescript
// Error técnico del contrato:
"Must have balance to vote"

// Mensaje mostrado al usuario:
"❌ You need to deposit funds to the DAO before you can vote"
```

### Ejemplo 2: Usuario cancela transacción
```typescript
// Error de MetaMask:
"user rejected transaction"

// Mensaje mostrado al usuario:
"❌ You cancelled the transaction"
```

### Ejemplo 3: Propuesta ya ejecutada
```typescript
// Error del contrato:
"Proposal already executed"

// Mensaje mostrado al usuario:
"❌ This proposal has already been executed"
```

## 🚀 Ventajas

1. **User-Friendly**: Los usuarios nunca ven errores técnicos
2. **Consistente**: Todos los errores se manejan de la misma manera
3. **Mantenible**: Un solo lugar para actualizar mensajes de error
4. **Completo**: Cubre todos los casos posibles del contrato
5. **Debugging**: Los errores técnicos se registran en la consola para desarrollo

## 🔍 Testing

Para probar el manejo de errores:

1. **Sin fondos**: Intenta votar sin haber depositado ETH
2. **Balance insuficiente**: Intenta crear un proposal con menos del 10% del balance total
3. **Cancelar transacción**: Rechaza una transacción en MetaMask
4. **Propuesta inexistente**: Intenta votar en un proposal que no existe
5. **Después del deadline**: Intenta votar después de que termine el período

Todos estos casos mostrarán mensajes claros sin detalles técnicos.
