#!/bin/bash

# Script para probar el flujo completo de un proposal sin esperar tiempo real
# Usar con Anvil corriendo en localhost:8545

RPC_URL="http://127.0.0.1:8545"
DAO_ADDRESS="0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"

echo "=== Testing Proposal Flow with Time Manipulation ==="
echo ""

# Función para avanzar el tiempo
advance_time() {
  local seconds=$1
  local description=$2
  echo "⏰ $description..."
  cast rpc evm_increaseTime $seconds --rpc-url $RPC_URL > /dev/null
  cast rpc evm_mine --rpc-url $RPC_URL > /dev/null
  echo "✅ Time advanced by $seconds seconds"
  echo ""
}

# Función para mostrar info del proposal
show_proposal() {
  local proposal_id=$1
  echo "📊 Proposal #$proposal_id Status:"
  cast call $DAO_ADDRESS "getProposal(uint256)(uint256,address,uint256,uint256,uint256,uint256,uint256,bool,address,string)" $proposal_id --rpc-url $RPC_URL
  echo ""
}

echo "📝 Step 1: Create a proposal"
echo "   - Go to the web app and create a proposal with deadline: 7 days"
echo "   - Note the proposal ID"
read -p "Press Enter when you've created the proposal..."
echo ""

read -p "Enter the Proposal ID: " PROPOSAL_ID
echo ""

echo "📊 Initial Proposal State:"
show_proposal $PROPOSAL_ID

echo "🗳️  Step 2: Vote on the proposal"
echo "   - Vote FOR, AGAINST, or ABSTAIN in the web app"
read -p "Press Enter when you've finished voting..."
echo ""

echo "📊 After Voting:"
show_proposal $PROPOSAL_ID

echo "⏭️  Step 3: Skip to deadline (advancing 7 days + 1 minute)"
advance_time 604860 "Advancing to after deadline"

echo "📊 After Deadline:"
show_proposal $PROPOSAL_ID
echo "   - Refresh the web app - proposal should now show as 'Approved' or 'Rejected'"
read -p "Press Enter to continue..."
echo ""

echo "⏭️  Step 4: Skip execution delay (advancing 1 hour)"
advance_time 3600 "Advancing past execution delay"

echo "📊 After Execution Delay:"
show_proposal $PROPOSAL_ID
echo "   - Refresh the web app - 'Execute Proposal' button should now appear (if approved)"
read -p "Press Enter to continue..."
echo ""

echo "⚡ Step 5: Execute the proposal"
echo "   - Click 'Execute Proposal' button in the web app"
read -p "Press Enter when you've executed the proposal..."
echo ""

echo "📊 Final Proposal State:"
show_proposal $PROPOSAL_ID

echo ""
echo "🎉 Test Complete!"
echo "   - If approved and executed: Check that funds were transferred"
echo "   - If rejected: Funds stay in DAO"
