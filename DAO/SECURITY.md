# Guía de Seguridad - DAO Voting Platform

## 🔒 Información Sensible

### ⚠️ NUNCA subir a Git:

1. **Claves Privadas**
   - `.env` con `PRIVATE_KEY`
   - `.env.local` con `RELAYER_PRIVATE_KEY`
   - Archivos de wallet JSON
   - Mnemonics o seed phrases

2. **Archivos de Configuración con Datos Sensibles**
   - Archivos `.env*` (excepto `.env.example`)
   - API keys de servicios (Infura, Alchemy, Etherscan)
   - Contraseñas o tokens

3. **Archivos de Build**
   - `node_modules/`
   - `out/`, `cache/`
   - Archivos compilados

## ✅ Buenas Prácticas

### 1. Gestión de Claves Privadas

**Para Desarrollo Local:**
```bash
# Usar cuentas de Anvil (ya generadas y públicas)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Para Testnet/Mainnet:**
```bash
# NUNCA usar claves con fondos reales en código
# Usar servicios de gestión de secretos:

# Opción 1: Variables de entorno del sistema
export PRIVATE_KEY="0x..."

# Opción 2: Servicios de secrets
# - AWS Secrets Manager
# - HashiCorp Vault
# - Google Secret Manager

# Opción 3: Hardware Wallets
# - Ledger
# - Trezor
```

### 2. Separación de Entornos

```bash
# Desarrollo Local
.env.local           # Local con Anvil

# Testnet
.env.sepolia         # Sepolia testnet

# Producción
.env.production      # Mainnet (usar secrets manager)
```

### 3. Verificar antes de Commit

```bash
# Antes de hacer commit, verificar:
git status

# Asegurarse que NO aparezcan:
# - .env
# - .env.local
# - archivos con claves privadas
# - node_modules/

# Ver qué archivos se van a subir:
git diff --staged
```

### 4. Limpiar Historial si se Subió algo Sensible

```bash
# Si accidentalmente subiste una clave privada:

# 1. Cambiar INMEDIATAMENTE la clave comprometida
# 2. Mover fondos a nueva wallet

# 3. Limpiar el historial de Git (CUIDADO!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 4. Force push (solo si es tu propio repo)
git push origin --force --all
```

## 🛡️ Configuración de Seguridad

### Archivo .env.example

Siempre incluir un archivo `.env.example` sin valores reales:

```env
# .env.example
PRIVATE_KEY=0x...
RELAYER_PRIVATE_KEY=0x...
API_KEY=your_api_key_here
```

### Pre-commit Hook (Opcional)

Crear `.git/hooks/pre-commit`:

```bash
#!/bin/sh

# Verificar que no se están subiendo archivos sensibles
if git diff --cached --name-only | grep -E '\.env$|\.env\.local$'; then
    echo "❌ ERROR: Intentando subir archivos .env"
    echo "Los archivos .env contienen información sensible."
    exit 1
fi

# Verificar claves privadas en código
if git diff --cached | grep -E 'PRIVATE_KEY.*0x[a-fA-F0-9]{64}'; then
    echo "❌ ERROR: Posible clave privada en el código"
    exit 1
fi

echo "✅ Pre-commit check passed"
exit 0
```

Hacer ejecutable:
```bash
chmod +x .git/hooks/pre-commit
```

## 🔍 Checklist de Seguridad

Antes de hacer push a un repositorio público:

- [ ] Verificar que `.gitignore` está configurado correctamente
- [ ] No hay archivos `.env*` (excepto `.env.example`)
- [ ] No hay claves privadas en el código
- [ ] No hay API keys hardcoded
- [ ] Los archivos `node_modules/` y `lib/` no están incluidos
- [ ] Los archivos de build (`out/`, `.next/`) no están incluidos
- [ ] Revisar `git status` antes de commit
- [ ] Revisar `git diff` antes de commit

## 🚨 Qué hacer si Comprometiste una Clave

### Acción Inmediata:

1. **Transferir fondos**
   ```bash
   # Mover TODOS los fondos a una nueva wallet INMEDIATAMENTE
   # La clave comprometida ya es pública
   ```

2. **Revocar accesos**
   - Cambiar todas las API keys
   - Rotar todas las credenciales
   - Actualizar secretos en servicios

3. **Notificar**
   - Si es un proyecto público, notificar a usuarios
   - Documentar el incidente
   - Actualizar medidas de seguridad

4. **Limpiar repositorio**
   - Usar `git filter-branch` o `BFG Repo-Cleaner`
   - Force push al repositorio
   - Contactar a GitHub para limpiar caché

## 📋 Recursos Adicionales

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Git Secrets](https://github.com/awslabs/git-secrets)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## 🔐 Recomendaciones Finales

1. **Nunca** compartir claves privadas
2. **Siempre** usar `.env.example` en lugar de `.env` en documentación
3. **Verificar** dos veces antes de hacer commit
4. **Usar** hardware wallets para fondos reales
5. **Implementar** pre-commit hooks
6. **Auditar** regularmente el repositorio
7. **Educar** al equipo sobre mejores prácticas

---

**La seguridad es responsabilidad de todos. Mantente alerta! 🔒**
