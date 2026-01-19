/**
 * Maps technical contract errors to user-friendly messages
 */
export function getErrorMessage(error: any): string {
  const errorString = error?.message || error?.toString() || "";
  
  // Funding errors
  if (errorString.includes("Must send ETH")) {
    return "Please enter an amount greater than 0 ETH";
  }
  
  // Create proposal errors
  if (errorString.includes("Invalid recipient")) {
    return "The recipient address is not valid";
  }
  
  if (errorString.includes("Amount must be greater than 0")) {
    return "The amount must be greater than 0 ETH";
  }
  
  if (errorString.includes("Insufficient DAO balance")) {
    return "The DAO doesn't have enough funds for this proposal";
  }
  
  if (errorString.includes("Deadline must be in the future")) {
    return "The voting deadline must be in the future";
  }
  
  if (errorString.includes("Description cannot be empty")) {
    return "Please provide a description for your proposal";
  }
  
  if (errorString.includes("Insufficient balance to create proposal")) {
    return "You need to have at least 10% of the DAO's total balance to create a proposal";
  }
  
  // Voting errors
  if (errorString.includes("Invalid proposal ID")) {
    return "This proposal doesn't exist";
  }
  
  if (errorString.includes("Voting period has ended")) {
    return "The voting period for this proposal has ended";
  }
  
  if (errorString.includes("Proposal already executed")) {
    return "This proposal has already been executed";
  }
  
  if (errorString.includes("Must have balance to vote")) {
    return "You need to deposit funds to the DAO before you can vote";
  }
  
  // Execution errors
  if (errorString.includes("Voting period not ended")) {
    return "The voting period hasn't ended yet";
  }
  
  if (errorString.includes("Execution delay period not passed")) {
    return "The execution delay period hasn't passed yet. Please wait 1 hour after the deadline";
  }
  
  if (errorString.includes("Proposal not approved")) {
    return "This proposal was not approved (more votes against than for)";
  }
  
  if (errorString.includes("Insufficient contract balance")) {
    return "The DAO doesn't have enough funds to execute this proposal";
  }
  
  if (errorString.includes("Transfer failed")) {
    return "The transfer to the recipient failed. Please try again";
  }
  
  // User rejected transaction
  if (errorString.includes("user rejected") || 
      errorString.includes("User denied") || 
      errorString.includes("ACTION_REJECTED") ||
      errorString.includes("User rejected the request")) {
    return "You cancelled the transaction";
  }
  
  // Insufficient gas
  if (errorString.includes("insufficient funds for gas") || 
      errorString.includes("insufficient funds for intrinsic transaction cost")) {
    return "You don't have enough ETH in your wallet to pay for gas fees";
  }
  
  // Network errors
  if (errorString.includes("network") || errorString.includes("connection")) {
    return "Network connection error. Please check your internet connection and make sure Anvil is running";
  }
  
  // Wrong network
  if (errorString.includes("wrong network") || errorString.includes("unsupported network")) {
    return "Please connect to the correct network (Anvil on localhost:8545)";
  }
  
  // MetaMask not installed
  if (errorString.includes("window.ethereum") || errorString.includes("MetaMask")) {
    return "Please install MetaMask to use this application";
  }
  
  // Invalid address
  if (errorString.includes("invalid address") || errorString.includes("invalid BigNumber")) {
    return "Invalid Ethereum address. Please check the address and try again";
  }
  
  // Generic fallback
  console.warn("Unhandled error:", errorString);
  return "An error occurred. Please try again";
}
