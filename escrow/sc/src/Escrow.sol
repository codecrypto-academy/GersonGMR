// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Escrow
 * @dev Contrato de escrow para intercambio seguro de tokens ERC20
 * @notice Permite a usuarios crear operaciones de swap con tokens autorizados
 */
contract Escrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Estructura para representar una operación de swap
    struct Operation {
        uint256 id;
        address creator;
        address tokenA;
        address tokenB;
        uint256 amountA;
        uint256 amountB;
        bool isActive;
    }

    // Array de tokens permitidos
    address[] public allowedTokens;
    
    // Mapping para verificar si un token está permitido
    mapping(address => bool) public isTokenAllowed;
    
    // Array de todas las operaciones
    Operation[] public operations;
    
    // Contador de operaciones
    uint256 public operationCounter;

    // Eventos
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

    // Modifiers
    modifier onlyActiveOperation(uint256 _operationId) {
        require(_operationId < operations.length, "Operation does not exist");
        require(operations[_operationId].isActive, "Operation is not active");
        _;
    }

    modifier onlyAllowedToken(address _token) {
        require(isTokenAllowed[_token], "Token is not allowed");
        _;
    }

    constructor() Ownable() {}

    /**
     * @dev Agrega un token a la lista de tokens permitidos
     * @param _token Dirección del token ERC20 a agregar
     */
    function addToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(!isTokenAllowed[_token], "Token already allowed");
        
        allowedTokens.push(_token);
        isTokenAllowed[_token] = true;
        
        emit TokenAdded(_token);
    }

    /**
     * @dev Remueve un token de la lista de tokens permitidos
     * @param _token Dirección del token ERC20 a remover
     */
    function removeToken(address _token) external onlyOwner {
        require(isTokenAllowed[_token], "Token is not allowed");
        
        isTokenAllowed[_token] = false;
        
        // Encontrar y remover del array
        for (uint256 i = 0; i < allowedTokens.length; i++) {
            if (allowedTokens[i] == _token) {
                allowedTokens[i] = allowedTokens[allowedTokens.length - 1];
                allowedTokens.pop();
                break;
            }
        }
        
        emit TokenRemoved(_token);
    }

    /**
     * @dev Crea una nueva operación de swap
     * @param _tokenA Token que el creador está ofreciendo
     * @param _tokenB Token que el creador quiere recibir
     * @param _amountA Cantidad de tokenA que ofrece
     * @param _amountB Cantidad de tokenB que quiere recibir
     */
    function createOperation(
        address _tokenA,
        address _tokenB,
        uint256 _amountA,
        uint256 _amountB
    ) external nonReentrant onlyAllowedToken(_tokenA) onlyAllowedToken(_tokenB) {
        require(_tokenA != _tokenB, "Tokens must be different");
        require(_amountA > 0, "Amount A must be greater than 0");
        require(_amountB > 0, "Amount B must be greater than 0");

        // Transferir tokenA del usuario al contrato
        IERC20(_tokenA).safeTransferFrom(msg.sender, address(this), _amountA);

        // Crear la operación
        uint256 operationId = operationCounter;
        operations.push(Operation({
            id: operationId,
            creator: msg.sender,
            tokenA: _tokenA,
            tokenB: _tokenB,
            amountA: _amountA,
            amountB: _amountB,
            isActive: true
        }));

        operationCounter++;

        emit OperationCreated(operationId, msg.sender, _tokenA, _tokenB, _amountA, _amountB);
    }

    /**
     * @dev Completa una operación de swap
     * @param _operationId ID de la operación a completar
     */
    function completeOperation(uint256 _operationId) 
        external 
        nonReentrant 
        onlyActiveOperation(_operationId) 
    {
        Operation storage operation = operations[_operationId];
        
        require(msg.sender != operation.creator, "Cannot complete your own operation");

        // Marcar como inactiva
        operation.isActive = false;

        // Transferir tokenB del completador al creador
        IERC20(operation.tokenB).safeTransferFrom(
            msg.sender,
            operation.creator,
            operation.amountB
        );

        // Transferir tokenA del contrato al completador
        IERC20(operation.tokenA).safeTransfer(msg.sender, operation.amountA);

        emit OperationCompleted(_operationId, operation.creator, msg.sender);
    }

    /**
     * @dev Cancela una operación y devuelve los tokens al creador
     * @param _operationId ID de la operación a cancelar
     */
    function cancelOperation(uint256 _operationId) 
        external 
        nonReentrant 
        onlyActiveOperation(_operationId) 
    {
        Operation storage operation = operations[_operationId];
        
        require(msg.sender == operation.creator, "Only creator can cancel");

        // Marcar como inactiva
        operation.isActive = false;

        // Devolver tokenA al creador
        IERC20(operation.tokenA).safeTransfer(operation.creator, operation.amountA);

        emit OperationCancelled(_operationId, operation.creator);
    }

    /**
     * @dev Obtiene la lista de tokens permitidos
     * @return Array de direcciones de tokens permitidos
     */
    function getAllowedTokens() external view returns (address[] memory) {
        return allowedTokens;
    }

    /**
     * @dev Obtiene todas las operaciones
     * @return Array de todas las operaciones
     */
    function getAllOperations() external view returns (Operation[] memory) {
        return operations;
    }

    /**
     * @dev Obtiene una operación específica
     * @param _operationId ID de la operación
     * @return Operación solicitada
     */
    function getOperation(uint256 _operationId) external view returns (Operation memory) {
        require(_operationId < operations.length, "Operation does not exist");
        return operations[_operationId];
    }

    /**
     * @dev Obtiene el número total de operaciones
     * @return Número total de operaciones
     */
    function getOperationCount() external view returns (uint256) {
        return operations.length;
    }

    /**
     * @dev Obtiene el número de tokens permitidos
     * @return Número de tokens permitidos
     */
    function getAllowedTokensCount() external view returns (uint256) {
        return allowedTokens.length;
    }
}
