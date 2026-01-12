"use client";

/**
 * @file MetaMaskContext.tsx
 * @description Context Provider para manejo de wallets (simulación MetaMask)
 * @security Las claves privadas NUNCA se exponen en el estado o props
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { deriveWalletsFromMnemonic } from "@/lib/wallet";

// Interfaz pública - SOLO expone datos no sensibles
interface PublicWallet {
  address: string;
  index: number;
}

interface MetaMaskContextType {
  wallets: PublicWallet[];
  currentWallet: PublicWallet | null;
  provider: ethers.JsonRpcProvider | null;
  isConnected: boolean;
  connect: (walletIndex: number) => void;
  disconnect: () => void;
  getWalletInstance: () => ethers.Wallet | null;
  signMessage: (message: string) => Promise<string>;
  requestSignature: (hash: string) => Promise<string>;
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

// Mnemonic por defecto para desarrollo (NUNCA usar en producción)
const DEFAULT_MNEMONIC =
  process.env.NEXT_PUBLIC_DEFAULT_MNEMONIC ||
  "test test test test test test test test test test test junk";

export function MetaMaskProvider({ children }: { children: React.ReactNode }) {
  // Estado público - SOLO addresses e índices
  const [wallets, setWallets] = useState<PublicWallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<PublicWallet | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Almacenamiento PRIVADO de wallets con claves - NUNCA se expone
  // Usamos useRef para mantener las instancias de wallet sin exponerlas en el estado
  const privateWalletsRef = useRef<Map<number, ethers.HDNodeWallet>>(new Map());

  // Inicializar wallets desde mnemonic dinámicamente
  useEffect(() => {
    try {
      const derivedWallets = deriveWalletsFromMnemonic(DEFAULT_MNEMONIC, 5);
      
      // Almacenar wallets con claves privadas en ref (privado, no se expone)
      const walletsMap = new Map<number, ethers.HDNodeWallet>();
      const publicWalletList: PublicWallet[] = [];
      
      derivedWallets.forEach((w, index) => {
        walletsMap.set(index, w.wallet);
        publicWalletList.push({
          address: w.address,
          index,
        });
      });
      
      privateWalletsRef.current = walletsMap;
      setWallets(publicWalletList);
    } catch (error) {
      console.error("Error initializing wallets:", error);
    }
  }, []);

  // Inicializar JsonRpcProvider (Anvil local)
  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
    const providerInstance = new ethers.JsonRpcProvider(rpcUrl);
    setProvider(providerInstance);
    
    // Fondear automáticamente las wallets derivadas cuando el provider esté listo
    const fundWallets = async () => {
      try {
        // Primera cuenta de Anvil (tiene fondos ilimitados por defecto)
        const anvilPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        
        // Crear wallet de Anvil para enviar fondos
        const anvilWallet = new ethers.Wallet(anvilPrivateKey, providerInstance);
        
        // Verificar que Anvil esté disponible
        await providerInstance.getBlockNumber();
        
        // Obtener wallets derivadas
        const derivedWallets = deriveWalletsFromMnemonic(DEFAULT_MNEMONIC, 5);
        
        // Fondear cada wallet con 100 ETH (suficiente para desarrollo)
        for (const w of derivedWallets) {
          try {
            const balance = await providerInstance.getBalance(w.address);
            // Solo fondear si no tiene fondos suficientes (menos de 1 ETH)
            if (balance < ethers.parseEther("1")) {
              const tx = await anvilWallet.sendTransaction({
                to: w.address,
                value: ethers.parseEther("100"),
              });
              await tx.wait();
              console.log(`✅ Funded wallet ${w.address} with 100 ETH`);
            }
          } catch (err) {
            console.warn(`⚠️ Failed to fund wallet ${w.address}:`, err);
          }
        }
      } catch (error) {
        // Silenciar el error si Anvil no está corriendo (es normal durante desarrollo)
        console.warn("⚠️ Could not auto-fund wallets. Make sure Anvil is running:", error);
      }
    };
    
    // Fondear wallets después de un pequeño delay para asegurar que el provider esté listo
    const timer = setTimeout(fundWallets, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Conectar wallet
  const connect = useCallback(
    (walletIndex: number) => {
      const wallet = wallets.find((w) => w.index === walletIndex);
      if (wallet) {
        setCurrentWallet(wallet);
        setIsConnected(true);
        // Guardar SOLO el índice en localStorage (nunca la clave privada)
        localStorage.setItem("connectedWalletIndex", walletIndex.toString());
      }
    },
    [wallets]
  );

  // Desconectar wallet
  const disconnect = useCallback(() => {
    setCurrentWallet(null);
    setIsConnected(false);
    localStorage.removeItem("connectedWalletIndex");
  }, []);

  // Restaurar wallet conectada desde localStorage
  useEffect(() => {
    const savedIndex = localStorage.getItem("connectedWalletIndex");
    if (savedIndex && wallets.length > 0) {
      const index = parseInt(savedIndex, 10);
      connect(index);
    }
  }, [wallets, connect]);

  // Obtener instancia de wallet para firmar (INTERNO, no expone la clave)
  const getWalletInstance = useCallback((): ethers.Wallet | null => {
    if (!currentWallet || !provider) return null;
    
    // Obtener la wallet privada del ref (no se expone)
    const privateWallet = privateWalletsRef.current.get(currentWallet.index);
    if (!privateWallet) return null;
    
    // Conectar el HDNodeWallet al provider (más seguro que crear nuevo Wallet)
    // La clave privada permanece encapsulada dentro del HDNodeWallet
    return privateWallet.connect(provider) as unknown as ethers.Wallet;
  }, [currentWallet, provider]);

  // Función para firmar mensajes (encapsula la lógica, no expone la clave)
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      const walletInstance = getWalletInstance();
      if (!walletInstance) {
        throw new Error("Wallet not connected");
      }
      
      // La firma se hace internamente, la clave privada nunca se expone
      return await walletInstance.signMessage(ethers.getBytes(message));
    },
    [getWalletInstance]
  );

  // Función para solicitar firma con confirmación del usuario (simula MetaMask)
  const requestSignature = useCallback(
    async (hash: string): Promise<string> => {
      if (!isConnected || !currentWallet) {
        throw new Error("Please connect your wallet first");
      }

      // Mostrar alerta de confirmación (simula MetaMask)
      const userConfirmed = window.confirm(
        `Sign Document Hash?\n\n` +
        `Hash: ${hash}\n` +
        `From: ${currentWallet.address}\n\n` +
        `Click OK to sign, or Cancel to reject.`
      );

      if (!userConfirmed) {
        throw new Error("User rejected the signature request");
      }

      // Firmar el hash después de la confirmación
      return await signMessage(hash);
    },
    [isConnected, currentWallet, signMessage]
  );

  return (
    <MetaMaskContext.Provider
      value={{
        wallets,
        currentWallet,
        provider,
        isConnected,
        connect,
        disconnect,
        getWalletInstance,
        signMessage,
        requestSignature,
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  if (context === undefined) {
    throw new Error("useMetaMask must be used within a MetaMaskProvider");
  }
  return context;
}

