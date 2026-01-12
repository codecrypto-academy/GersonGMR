"use client";

/**
 * @file WalletContext.tsx
 * @description Context Provider para manejo de wallets (simulación MetaMask)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { deriveWalletsFromMnemonic } from "@/lib/wallet";

interface Wallet {
  address: string;
  privateKey: string;
  index: number;
}

interface WalletContextType {
  wallets: Wallet[];
  currentWallet: Wallet | null;
  setCurrentWallet: (wallet: Wallet | null) => void;
  provider: ethers.JsonRpcProvider | null;
  isConnected: boolean;
  connect: (walletIndex: number) => void;
  disconnect: () => void;
  getWalletInstance: () => ethers.Wallet | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Mnemonic por defecto para desarrollo (NUNCA usar en producción)
const DEFAULT_MNEMONIC =
  process.env.NEXT_PUBLIC_DEFAULT_MNEMONIC ||
  "test test test test test test test test test test test junk";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<Wallet | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Inicializar wallets desde mnemonic
  useEffect(() => {
    try {
      const derivedWallets = deriveWalletsFromMnemonic(DEFAULT_MNEMONIC, 5);
      const walletList: Wallet[] = derivedWallets.map((w, index) => ({
        address: w.address,
        privateKey: w.wallet.privateKey,
        index,
      }));
      setWallets(walletList);
    } catch (error) {
      console.error("Error initializing wallets:", error);
    }
  }, []);

  // Inicializar provider (Anvil local)
  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
    const providerInstance = new ethers.JsonRpcProvider(rpcUrl);
    setProvider(providerInstance);
  }, []);

  // Conectar wallet
  const connect = useCallback(
    (walletIndex: number) => {
      const wallet = wallets.find((w) => w.index === walletIndex);
      if (wallet) {
        setCurrentWallet(wallet);
        setIsConnected(true);
        // Guardar en localStorage para persistencia
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

  // Obtener instancia de wallet para firmar
  const getWalletInstance = useCallback((): ethers.Wallet | null => {
    if (!currentWallet || !provider) return null;
    return new ethers.Wallet(currentWallet.privateKey, provider);
  }, [currentWallet, provider]);

  return (
    <WalletContext.Provider
      value={{
        wallets,
        currentWallet,
        setCurrentWallet,
        provider,
        isConnected,
        connect,
        disconnect,
        getWalletInstance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

