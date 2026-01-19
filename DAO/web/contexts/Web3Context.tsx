"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { DAOVotingABI, MinimalForwarderABI } from "@/lib/contracts";

interface Web3ContextType {
  account: string | null;
  provider: BrowserProvider | null;
  daoContract: Contract | null;
  forwarderContract: Contract | null;
  userBalance: string;
  daoTotalBalance: string;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalances: () => Promise<void>;
  getBlockTimestamp: () => Promise<number>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [daoContract, setDaoContract] = useState<Contract | null>(null);
  const [forwarderContract, setForwarderContract] = useState<Contract | null>(null);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [daoTotalBalance, setDaoTotalBalance] = useState<string>("0");
  const [chainId, setChainId] = useState<number | null>(null);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask!");
        return;
      }

      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      
      const signer = await browserProvider.getSigner();
      
      const daoAddress = process.env.NEXT_PUBLIC_DAO_ADDRESS;
      const forwarderAddress = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS;

      if (!daoAddress || !forwarderAddress) {
        alert("Contract addresses not configured. Please check .env.local");
        return;
      }

      const dao = new Contract(daoAddress, DAOVotingABI, signer);
      const forwarder = new Contract(forwarderAddress, MinimalForwarderABI, signer);

      setProvider(browserProvider);
      setAccount(accounts[0]);
      setDaoContract(dao);
      setForwarderContract(forwarder);
      setChainId(Number(network.chainId));

      // Load balances
      await loadBalances(dao, accounts[0]);

    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Error connecting wallet. Check console for details.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setDaoContract(null);
    setForwarderContract(null);
    setUserBalance("0");
    setDaoTotalBalance("0");
    setChainId(null);
  };

  const loadBalances = async (dao: Contract, userAddress: string) => {
    try {
      const userBal = await dao.getUserBalance(userAddress);
      const totalBal = await dao.totalBalance();
      
      setUserBalance(formatEther(userBal));
      setDaoTotalBalance(formatEther(totalBal));
    } catch (error) {
      console.error("Error loading balances:", error);
    }
  };

  const refreshBalances = async () => {
    if (daoContract && account) {
      await loadBalances(daoContract, account);
    }
  };

  const getBlockTimestamp = async (): Promise<number> => {
    if (!provider) {
      return Math.floor(Date.now() / 1000); // Fallback to system time
    }
    
    try {
      const block = await provider.getBlock('latest');
      return block ? block.timestamp : Math.floor(Date.now() / 1000);
    } catch (error) {
      console.error("Error getting block timestamp:", error);
      return Math.floor(Date.now() / 1000); // Fallback to system time
    }
  };

  // Handle account changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          if (daoContract) {
            loadBalances(daoContract, accounts[0]);
          }
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account, daoContract]);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        daoContract,
        forwarderContract,
        userBalance,
        daoTotalBalance,
        chainId,
        connectWallet,
        disconnectWallet,
        refreshBalances,
        getBlockTimestamp,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
