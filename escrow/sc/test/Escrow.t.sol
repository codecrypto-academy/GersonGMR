// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/TestToken.sol";

contract EscrowTest is Test {
    Escrow public escrow;
    TestToken public tokenA;
    TestToken public tokenB;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    uint256 public constant INITIAL_BALANCE = 1000 * 10**18;
    uint256 public constant AMOUNT_A = 100 * 10**18;
    uint256 public constant AMOUNT_B = 50 * 10**18;

    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event OperationCreated(
        uint256 indexed operationId,
        address indexed creator,
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    );
    event OperationCompleted(
        uint256 indexed operationId,
        address indexed creator,
        address indexed completer
    );
    event OperationCancelled(uint256 indexed operationId, address indexed creator);

    function setUp() public {
        vm.startPrank(owner);
        
        // Desplegar contratos
        escrow = new Escrow();
        tokenA = new TestToken("Token A", "TKA", 18);
        tokenB = new TestToken("Token B", "TKB", 18);

        // Agregar tokens permitidos
        escrow.addToken(address(tokenA));
        escrow.addToken(address(tokenB));

        // Mint tokens a usuarios
        tokenA.mint(user1, INITIAL_BALANCE);
        tokenA.mint(user2, INITIAL_BALANCE);
        tokenB.mint(user1, INITIAL_BALANCE);
        tokenB.mint(user2, INITIAL_BALANCE);

        vm.stopPrank();

        // Aprobar tokens para el escrow
        vm.prank(user1);
        tokenA.approve(address(escrow), type(uint256).max);
        vm.prank(user1);
        tokenB.approve(address(escrow), type(uint256).max);
        vm.prank(user2);
        tokenA.approve(address(escrow), type(uint256).max);
        vm.prank(user2);
        tokenB.approve(address(escrow), type(uint256).max);
    }

    // ============ Tests para addToken ============

    function test_AddToken() public {
        TestToken newToken = new TestToken("New Token", "NEW", 18);
        
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit TokenAdded(address(newToken));
        escrow.addToken(address(newToken));

        assertTrue(escrow.isTokenAllowed(address(newToken)));
        assertEq(escrow.getAllowedTokensCount(), 3);
    }

    function test_AddToken_RevertIfNotOwner() public {
        TestToken newToken = new TestToken("New Token", "NEW", 18);
        
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        escrow.addToken(address(newToken));
    }

    function test_AddToken_RevertIfZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid token address");
        escrow.addToken(address(0));
    }

    function test_AddToken_RevertIfAlreadyAllowed() public {
        vm.prank(owner);
        vm.expectRevert("Token already allowed");
        escrow.addToken(address(tokenA));
    }

    // ============ Tests para removeToken ============

    function test_RemoveToken() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit TokenRemoved(address(tokenA));
        escrow.removeToken(address(tokenA));

        assertFalse(escrow.isTokenAllowed(address(tokenA)));
        assertEq(escrow.getAllowedTokensCount(), 1);
    }

    function test_RemoveToken_RevertIfNotOwner() public {
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        escrow.removeToken(address(tokenA));
    }

    function test_RemoveToken_RevertIfNotAllowed() public {
        TestToken newToken = new TestToken("New Token", "NEW", 18);
        
        vm.prank(owner);
        vm.expectRevert("Token is not allowed");
        escrow.removeToken(address(newToken));
    }

    // ============ Tests para createOperation ============

    function test_CreateOperation() public {
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit OperationCreated(0, user1, address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);

        Escrow.Operation memory op = escrow.getOperation(0);
        
        assertEq(op.id, 0);
        assertEq(op.creator, user1);
        assertEq(op.tokenA, address(tokenA));
        assertEq(op.tokenB, address(tokenB));
        assertEq(op.amountA, AMOUNT_A);
        assertEq(op.amountB, AMOUNT_B);
        assertTrue(op.isActive);

        // Verificar transferencia
        assertEq(tokenA.balanceOf(user1), INITIAL_BALANCE - AMOUNT_A);
        assertEq(tokenA.balanceOf(address(escrow)), AMOUNT_A);
    }

    function test_CreateOperation_RevertIfTokenANotAllowed() public {
        TestToken invalidToken = new TestToken("Invalid", "INV", 18);
        
        vm.prank(user1);
        vm.expectRevert("Token is not allowed");
        escrow.createOperation(address(invalidToken), address(tokenB), AMOUNT_A, AMOUNT_B);
    }

    function test_CreateOperation_RevertIfTokenBNotAllowed() public {
        TestToken invalidToken = new TestToken("Invalid", "INV", 18);
        
        vm.prank(user1);
        vm.expectRevert("Token is not allowed");
        escrow.createOperation(address(tokenA), address(invalidToken), AMOUNT_A, AMOUNT_B);
    }

    function test_CreateOperation_RevertIfSameTokens() public {
        vm.prank(user1);
        vm.expectRevert("Tokens must be different");
        escrow.createOperation(address(tokenA), address(tokenA), AMOUNT_A, AMOUNT_B);
    }

    function test_CreateOperation_RevertIfAmountAZero() public {
        vm.prank(user1);
        vm.expectRevert("Amount A must be greater than 0");
        escrow.createOperation(address(tokenA), address(tokenB), 0, AMOUNT_B);
    }

    function test_CreateOperation_RevertIfAmountBZero() public {
        vm.prank(user1);
        vm.expectRevert("Amount B must be greater than 0");
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, 0);
    }

    // ============ Tests para completeOperation ============

    function test_CompleteOperation() public {
        // Crear operación
        vm.prank(user1);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);

        // Completar operación
        vm.prank(user2);
        vm.expectEmit(true, true, true, false);
        emit OperationCompleted(0, user1, user2);
        escrow.completeOperation(0);

        Escrow.Operation memory op = escrow.getOperation(0);
        assertFalse(op.isActive);

        // Verificar balances
        assertEq(tokenA.balanceOf(user1), INITIAL_BALANCE - AMOUNT_A);
        assertEq(tokenA.balanceOf(user2), INITIAL_BALANCE + AMOUNT_A);
        assertEq(tokenB.balanceOf(user1), INITIAL_BALANCE + AMOUNT_B);
        assertEq(tokenB.balanceOf(user2), INITIAL_BALANCE - AMOUNT_B);
        assertEq(tokenA.balanceOf(address(escrow)), 0);
    }

    function test_CompleteOperation_RevertIfOwnOperation() public {
        vm.prank(user1);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);

        vm.prank(user1);
        vm.expectRevert("Cannot complete your own operation");
        escrow.completeOperation(0);
    }

    function test_CompleteOperation_RevertIfNotActive() public {
        vm.prank(user1);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);

        vm.prank(user2);
        escrow.completeOperation(0);

        vm.prank(user2);
        vm.expectRevert("Operation is not active");
        escrow.completeOperation(0);
    }

    function test_CompleteOperation_RevertIfNotExists() public {
        vm.prank(user2);
        vm.expectRevert("Operation does not exist");
        escrow.completeOperation(999);
    }

    // ============ Tests para cancelOperation ============

    function test_CancelOperation() public {
        vm.prank(user1);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);

        uint256 balanceBefore = tokenA.balanceOf(user1);

        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit OperationCancelled(0, user1);
        escrow.cancelOperation(0);

        Escrow.Operation memory op = escrow.getOperation(0);
        assertFalse(op.isActive);

        // Verificar que los tokens fueron devueltos
        assertEq(tokenA.balanceOf(user1), balanceBefore + AMOUNT_A);
        assertEq(tokenA.balanceOf(address(escrow)), 0);
    }

    function test_CancelOperation_RevertIfNotCreator() public {
        vm.prank(user1);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);

        vm.prank(user2);
        vm.expectRevert("Only creator can cancel");
        escrow.cancelOperation(0);
    }

    function test_CancelOperation_RevertIfNotActive() public {
        vm.prank(user1);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);

        vm.prank(user1);
        escrow.cancelOperation(0);

        vm.prank(user1);
        vm.expectRevert("Operation is not active");
        escrow.cancelOperation(0);
    }

    // ============ Tests para funciones view ============

    function test_GetAllowedTokens() public {
        address[] memory tokens = escrow.getAllowedTokens();
        
        assertEq(tokens.length, 2);
        assertEq(tokens[0], address(tokenA));
        assertEq(tokens[1], address(tokenB));
    }

    function test_GetAllOperations() public {
        vm.prank(user1);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
        
        vm.prank(user2);
        escrow.createOperation(address(tokenB), address(tokenA), AMOUNT_B, AMOUNT_A);

        Escrow.Operation[] memory ops = escrow.getAllOperations();
        
        assertEq(ops.length, 2);
        assertEq(ops[0].creator, user1);
        assertEq(ops[1].creator, user2);
    }

    function test_GetOperationCount() public {
        assertEq(escrow.getOperationCount(), 0);
        
        vm.prank(user1);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
        
        assertEq(escrow.getOperationCount(), 1);
    }

    // ============ Tests de integración ============

    function test_MultipleOperationsFlow() public {
        // User1 crea operación 1
        vm.prank(user1);
        escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);

        // User2 crea operación 2
        vm.prank(user2);
        escrow.createOperation(address(tokenB), address(tokenA), AMOUNT_B, AMOUNT_A);

        // User2 completa operación 1
        vm.prank(user2);
        escrow.completeOperation(0);

        // User1 cancela su operación... espera, no puede porque es la de user2
        // User1 completa operación 2
        vm.prank(user1);
        escrow.completeOperation(1);

        Escrow.Operation[] memory ops = escrow.getAllOperations();
        assertFalse(ops[0].isActive);
        assertFalse(ops[1].isActive);
    }

    function test_Fuzz_CreateAndCompleteOperation(uint256 amountA, uint256 amountB) public {
        amountA = bound(amountA, 1, INITIAL_BALANCE);
        amountB = bound(amountB, 1, INITIAL_BALANCE);

        vm.prank(user1);
        escrow.createOperation(address(tokenA), address(tokenB), amountA, amountB);

        vm.prank(user2);
        escrow.completeOperation(0);

        assertEq(tokenA.balanceOf(user2), INITIAL_BALANCE + amountA);
        assertEq(tokenB.balanceOf(user1), INITIAL_BALANCE + amountB);
    }
}
