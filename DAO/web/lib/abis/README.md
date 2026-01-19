# 📦 ABIs del DAO

Este directorio contiene los ABIs (Application Binary Interface) de los smart contracts del DAO, generados automáticamente desde Foundry.

## 📁 Archivos

### JSON Files (Distribución Pública)
- `DAOVoting.json` - ABI del contrato principal del DAO
- `MinimalForwarder.json` - ABI del forwarder de meta-transacciones

**Estos archivos JSON están versionados en Git** para que cualquiera pueda integrar el DAO en sus proyectos.

### TypeScript Module
- `index.ts` - Exports TypeScript con type safety para el frontend

## 🚀 Uso

### Para Desarrolladores Externos (Cualquier lenguaje/framework)

Si quieres integrar este DAO en tu proyecto, usa los archivos JSON directamente:

```javascript
// ethers.js
import DAOVotingABI from './DAOVoting.json';
const contract = new ethers.Contract(address, DAOVotingABI, provider);

// web3.js
import DAOVotingABI from './DAOVoting.json';
const contract = new web3.eth.Contract(DAOVotingABI, address);

// Python (web3.py)
import json
with open('DAOVoting.json') as f:
    abi = json.load(f)
contract = web3.eth.contract(address=address, abi=abi)
```

### Para Este Frontend (TypeScript)

El frontend usa los exports de `index.ts` para mejor type safety:

```typescript
import { DAOVotingABI, MinimalForwarderABI } from '@/lib/abis';

const contract = new Contract(address, DAOVotingABI, signer);
```

## 🔄 Actualización

Los ABIs se sincronizan automáticamente desde los contratos de Foundry:

```bash
# Automático (al instalar dependencias)
npm install

# Manual
npm run sync:abis

# Deploy completo (compila, despliega, sincroniza)
bash scripts/deploy-and-sync.sh
```

## 📊 Compatibilidad

### JSON Files ✅
- Universal: Funciona con **cualquier** librería web3
- Multi-lenguaje: JavaScript, Python, Go, Rust, etc.
- Estándar: Formato oficial de Ethereum

### TypeScript Exports ✅
- Type Safety: Autocompletado y validación de tipos
- Import limpio: `import { DAOVotingABI } from '@/lib/abis'`
- Optimizado: Para este proyecto Next.js

## 🔐 Versionamiento

**¿Por qué versionamos los ABIs JSON?**

1. **Accesibilidad**: Otros desarrolladores pueden clonar el repo y usar los ABIs inmediatamente
2. **Historial**: Git trackea cambios en el ABI (breaking changes visibles)
3. **CI/CD**: El frontend puede buildear sin recompilar contratos
4. **Integración**: Otros proyectos pueden importar los ABIs como dependencia

## 📝 Notas

- **NO edites estos archivos manualmente** - Se regeneran automáticamente
- Los ABIs se generan desde `sc/out/` (output de Foundry)
- Siempre sincroniza después de cambiar contratos
- Los JSON son el formato estándar, el TypeScript es un wrapper conveniente

## 🌐 Uso Público

Si publicas este DAO, los desarrolladores externos pueden:

1. Clonar el repo
2. Navegar a `web/lib/abis/`
3. Copiar `DAOVoting.json` o `MinimalForwarder.json`
4. Usarlo en su proyecto

**Ejemplo de integración externa:**

```bash
# Otro proyecto quiere integrar tu DAO
curl https://raw.githubusercontent.com/tu-repo/DAO/main/web/lib/abis/DAOVoting.json -o DAOVoting.json

# Ahora pueden usarlo en su proyecto
```

---

**Los ABIs son la interfaz pública de tu smart contract. Mantenerlos accesibles en JSON es fundamental para la adopción.** 🚀
