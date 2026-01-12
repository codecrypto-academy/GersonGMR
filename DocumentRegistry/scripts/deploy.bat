@echo off
REM Script de despliegue para DocumentRegistry (Windows)
REM Uso: scripts\deploy.bat [RPC_URL] [PRIVATE_KEY]

set RPC_URL=%1
if "%RPC_URL%"=="" set RPC_URL=http://127.0.0.1:8545

set PRIVATE_KEY=%2
if "%PRIVATE_KEY%"=="" set PRIVATE_KEY=%PRIVATE_KEY%

if "%PRIVATE_KEY%"=="" (
    echo Error: PRIVATE_KEY no esta definido
    echo Uso: scripts\deploy.bat [RPC_URL] [PRIVATE_KEY]
    echo O exportar PRIVATE_KEY como variable de entorno
    exit /b 1
)

echo Desplegando DocumentRegistry...
echo RPC URL: %RPC_URL%

forge script script/Deploy.s.sol:DeployScript --rpc-url %RPC_URL% --broadcast --private-key %PRIVATE_KEY%

echo Despliegue completado!
echo No olvides actualizar NEXT_PUBLIC_CONTRACT_ADDRESS en frontend\.env.local

