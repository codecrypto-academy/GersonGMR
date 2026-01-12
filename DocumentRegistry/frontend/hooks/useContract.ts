/**
 * @file useContract.ts
 * @description Hook para interactuar con el contrato DocumentRegistry
 */

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useMetaMask } from "@/contexts/MetaMaskContext";
// @ts-ignore - JSON import
import DocumentRegistryABI from "@/abis/DocumentRegistry.json";

interface Document {
  hash: string;
  timestamp: bigint;
  signer: string;
  signature: string;
}

// Mantener DocumentSignature para compatibilidad hacia atrás
interface DocumentSignature {
  hash: string;
  timestamp: bigint;
  signature: string;
  signer: string;
}

interface UseContractReturn {
  contract: ethers.Contract | null;
  signDocument: (hash: string, signature: string) => Promise<void>;
  verifyDocument: (hash: string, signer: string) => Promise<{ isValid: boolean; timestamp: bigint }>;
  getDocument: (hash: string) => Promise<Document>;
  getSignature: (hash: string) => Promise<DocumentSignature>;
  getSignerHistory: (signer: string) => Promise<string[]>;
  getSignerCount: (signer: string) => Promise<bigint>;
  checkDocumentExists: (hash: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export function useContract(): UseContractReturn {
  const { provider, getWalletInstance, isConnected } = useMetaMask();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dirección del contrato desde variables de entorno
  const contractAddress =
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Inicializar contrato
  useEffect(() => {
    if (provider) {
      try {
        // Validar que la dirección del contrato sea válida
        if (!ethers.isAddress(contractAddress)) {
          setError(`Invalid contract address: ${contractAddress}`);
          return;
        }

        const abi = DocumentRegistryABI.abi || DocumentRegistryABI;
        const contractInstance = new ethers.Contract(
          contractAddress,
          abi,
          provider
        );
        setContract(contractInstance);
      } catch (err) {
        console.error("Error initializing contract:", err);
        setError("Failed to initialize contract");
      }
    }
  }, [provider, contractAddress]);

  // Firmar documento
  const signDocument = useCallback(
    async (hash: string, signature: string) => {
      if (!contract || !isConnected) {
        throw new Error("Contract not initialized or wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const wallet = getWalletInstance();
        if (!wallet) {
          throw new Error("Wallet not available");
        }

        const contractWithSigner = contract.connect(wallet) as ethers.Contract;
        const tx = await contractWithSigner.signDocument(
          hash,
          signature
        );
        await tx.wait();
      } catch (err: any) {
        const errorMessage =
          err.reason || err.message || "Failed to sign document";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [contract, isConnected, getWalletInstance]
  );

  // Verificar documento
  const verifyDocument = useCallback(
    async (
      hash: string,
      signer: string
    ): Promise<{ isValid: boolean; timestamp: bigint }> => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await contract.verifyDocument(hash, signer);
        return {
          isValid: result[0],
          timestamp: result[1],
        };
      } catch (err: any) {
        const errorMessage =
          err.reason || err.message || "Failed to verify document";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // Obtener información completa del documento (nueva función)
  const getDocument = useCallback(
    async (hash: string): Promise<Document> => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await contract.getDocument(hash);
        // El contrato retorna el struct Document completo
        return {
          hash: result.hash,
          timestamp: result.timestamp,
          signer: result.signer,
          signature: result.signature,
        };
      } catch (err: any) {
        const errorMessage =
          err.reason || err.message || "Failed to get document";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // Obtener información de firma (compatibilidad hacia atrás)
  const getSignature = useCallback(
    async (hash: string): Promise<DocumentSignature> => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await contract.getSignature(hash);
        // El contrato retorna una tupla: (uint256 timestamp, address signer, bytes signature)
        return {
          hash: hash, // El hash se pasa como parámetro, no se retorna en getSignature
          timestamp: result[0],
          signature: result[2],
          signer: result[1],
        };
      } catch (err: any) {
        const errorMessage =
          err.reason || err.message || "Failed to get signature";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // Obtener historial de firmas
  const getSignerHistory = useCallback(
    async (signer: string): Promise<string[]> => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const hashes = await contract.getSignerHistory(signer);
        return hashes;
      } catch (err: any) {
        const errorMessage =
          err.reason || err.message || "Failed to get signer history";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // Obtener conteo de firmas
  const getSignerCount = useCallback(
    async (signer: string): Promise<bigint> => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const count = await contract.getSignerCount(signer);
        return count;
      } catch (err: any) {
        const errorMessage =
          err.reason || err.message || "Failed to get signer count";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [contract]
  );

  // Verificar si un documento ya fue firmado
  const checkDocumentExists = useCallback(
    async (hash: string): Promise<boolean> => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      try {
        // Intentar obtener el documento, si existe retorna true
        // Si no existe, getDocument lanzará HashNotFound, entonces retornamos false
        await contract.getDocument(hash);
        return true;
      } catch (err: any) {
        // Si el error es HashNotFound, el documento no existe
        const errorMessage = err.reason || err.message || "";
        if (errorMessage.includes("HashNotFound")) {
          return false;
        }
        // Si es otro error, lo propagamos
        throw err;
      }
    },
    [contract]
  );

  return {
    contract,
    signDocument,
    verifyDocument,
    getDocument,
    getSignature,
    getSignerHistory,
    getSignerCount,
    checkDocumentExists,
    isLoading,
    error,
  };
}

