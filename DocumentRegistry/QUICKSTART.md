# 🚀 Guía de Inicio Rápido

## Pasos Rápidos para Ejecutar el Proyecto

### 1. Iniciar Anvil (Terminal 1)

```bash
# Linux/Mac
./scripts/start-anvil.sh

# Windows
scripts\start-anvil.bat

# O manualmente
anvil
```

Anvil estará disponible en `http://127.0.0.1:8545`

### 2. Desplegar el Contrato (Terminal 2)

```bash
# Linux/Mac
./scripts/deploy.sh

# Windows
scripts\deploy.bat

# O manualmente
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**⚠️ IMPORTANTE:** Copiar la dirección del contrato desplegado de la salida.

### 3. Configurar Frontend

```bash
cd frontend
cp .env.local.example .env.local
```

Editar `.env.local` y agregar:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # Dirección del contrato desplegado
```

### 4. Iniciar Frontend (Terminal 3)

```bash
cd frontend
npm run dev
```

Abrir `http://localhost:3000` en el navegador.

### 5. Usar la Aplicación

1. **Conectar Wallet:** Seleccionar una wallet del selector en la barra lateral
2. **Firmar Documento:** 
   - Ir a pestaña "Sign Document"
   - Subir un archivo
   - Hacer clic en "Sign Document"
3. **Verificar Documento:**
   - Ir a pestaña "Verify Document"
   - Subir el mismo archivo
   - Ingresar la dirección del firmante
   - Hacer clic en "Verify Document"
4. **Ver Historial:**
   - Ir a pestaña "History"
   - Ver todos los documentos firmados

## 🧪 Ejecutar Tests

```bash
# Todos los tests
forge test

# Tests con verbosidad
forge test -vvv

# Cobertura
forge coverage
```

## 📝 Notas Importantes

- **Anvil debe estar corriendo** antes de desplegar o usar el frontend
- **La dirección del contrato** debe actualizarse en `.env.local` después de cada despliegue
- **Las wallets** son simuladas (no son MetaMask real)
- **Los fondos** en Anvil son ilimitados para desarrollo

## 🐛 Solución de Problemas

### Error: "Contract not initialized"
- Verificar que `NEXT_PUBLIC_CONTRACT_ADDRESS` esté configurado
- Verificar que Anvil esté corriendo
- Verificar que el contrato se haya desplegado correctamente

### Error: "Wallet not connected"
- Seleccionar una wallet del selector en la barra lateral

### Error: "Hash already signed"
- El documento ya fue firmado previamente
- Usar un documento diferente o reiniciar Anvil

### Error al compilar
```bash
forge clean
forge build
```

### Error en frontend
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

