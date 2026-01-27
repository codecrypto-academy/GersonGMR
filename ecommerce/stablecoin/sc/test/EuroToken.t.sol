// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {EuroToken} from "../src/EuroToken.sol";

contract EuroTokenTest is Test {
    EuroToken public token;
    address public owner;
    address public user1;
    address public user2;

    event Transfer(address indexed from, address indexed to, uint256 value);

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        token = new EuroToken(owner);
    }

    function test_Deploy() public view {
        assertEq(token.name(), "EuroToken");
        assertEq(token.symbol(), "EURT");
        assertEq(token.decimals(), 6);
        assertEq(token.owner(), owner);
    }

    function test_MintByOwner() public {
        uint256 amount = 1000 * 10**6; // 1000 EURT
        
        vm.expectEmit(true, true, false, true);
        emit Transfer(address(0), user1, amount);
        
        token.mint(user1, amount);
        
        assertEq(token.balanceOf(user1), amount);
        assertEq(token.totalSupply(), amount);
    }

    function test_MintByNonOwner() public {
        uint256 amount = 1000 * 10**6;
        
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, amount);
    }

    function test_MintToZeroAddress() public {
        uint256 amount = 1000 * 10**6;
        
        vm.expectRevert("EuroToken: cannot mint to zero address");
        token.mint(address(0), amount);
    }

    function test_MintZeroAmount() public {
        vm.expectRevert("EuroToken: amount must be greater than zero");
        token.mint(user1, 0);
    }

    function test_Transfer() public {
        uint256 amount = 1000 * 10**6;
        token.mint(user1, amount);
        
        vm.prank(user1);
        bool success = token.transfer(user2, amount);
        assertTrue(success);
        
        assertEq(token.balanceOf(user1), 0);
        assertEq(token.balanceOf(user2), amount);
    }

    function test_Burn() public {
        uint256 mintAmount = 1000 * 10**6;
        uint256 burnAmount = 300 * 10**6;
        
        token.mint(user1, mintAmount);
        token.burn(user1, burnAmount);
        
        assertEq(token.balanceOf(user1), mintAmount - burnAmount);
        assertEq(token.totalSupply(), mintAmount - burnAmount);
    }

    function test_BurnByNonOwner() public {
        uint256 amount = 1000 * 10**6;
        token.mint(user1, amount);
        
        vm.prank(user1);
        vm.expectRevert();
        token.burn(user1, amount);
    }

    function test_Decimals() public view {
        assertEq(token.decimals(), 6);
    }

    function test_MultipleMints() public {
        token.mint(user1, 100 * 10**6);
        token.mint(user2, 200 * 10**6);
        token.mint(user1, 50 * 10**6);
        
        assertEq(token.balanceOf(user1), 150 * 10**6);
        assertEq(token.balanceOf(user2), 200 * 10**6);
        assertEq(token.totalSupply(), 350 * 10**6);
    }
}
