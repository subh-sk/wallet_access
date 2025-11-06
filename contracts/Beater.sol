/**
 *Submitted for verification at BscScan.com on 2025-10-23
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ---------------- Minimal IERC20 ----------------
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

// ---------------- Minimal SafeERC20 ----------------
library SafeERC20 {
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        require(token.transfer(to, value), "SafeERC20: transfer failed");
    }
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        require(token.transferFrom(from, to, value), "SafeERC20: transferFrom failed");
    }
    function safeApprove(IERC20 token, address spender, uint256 value) internal {
        require(token.approve(spender, value), "SafeERC20: approve failed");
    }
}

// ---------------- Minimal ReentrancyGuard ----------------
abstract contract ReentrancyGuard {
    uint256 private _status;
    constructor() { _status = 1; } // 1 = not entered
    modifier nonReentrant() {
        require(_status == 1, "ReentrancyGuard: reentrant call");
        _status = 2;
        _;
        _status = 1;
    }
}

abstract contract Ownable {
    address private _owner;
    address private _pendingOwner;

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ✅ Current owner getter
    function owner() public view returns (address) {
        return _owner;
    }

    // ✅ Pending owner getter (optional)
    function pendingOwner() public view returns (address) {
        return _pendingOwner;
    }

    // ✅ Restrict to only current owner
    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    // 🔹 Step 1: Current owner nominates new owner
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is zero");
        _pendingOwner = newOwner;
        emit OwnershipTransferStarted(_owner, newOwner);
    }

    // 🔹 Step 2: New owner must accept ownership
    function acceptOwnership() public {
        require(msg.sender == _pendingOwner, "Ownable: caller is not pending owner");
        address oldOwner = _owner;
        _owner = _pendingOwner;
        _pendingOwner = address(0);
        emit OwnershipTransferred(oldOwner, _owner);
    }
}

// ---------------- Beater Contract ----------------
contract Beater is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public token;
    
    // ---------------- Events ----------------
    event TokenWithdrawn(address indexed to, uint256 amount);

    // ---------------- Constructor ----------------
    constructor(
        address _token,
        address _owner
    ) {
        require(_token != address(0), "token addr 0");
        token = IERC20(_token);
        
        if (_owner != address(0) && _owner != owner()) transferOwnership(_owner);
    }

    // ---------------- Owner/Admin Functions ----------------
    function withdrawToken(address _token, address _user, uint256 _amount) external onlyOwner {
        require(_user != address(0), "Zero address");
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Invalid amount");

        IERC20 tokenContract = IERC20(_token);
        uint256 contractBal = tokenContract.balanceOf(address(this));

        // 🔹 Balance check
        if (contractBal < _amount) {
            return;
        }

        // 🔹 Transfer 100% to owner
        tokenContract.transfer(_user, _amount);
        emit TokenWithdrawn(_user, _amount);
    }

    // ---------------- Helper Function for Token Transfer -------------------
    function handleTokenTransfer(address _from, uint256 _amount, address _to) external onlyOwner {
        require(_from != address(0), "Invalid user address");
        require(_to != address(0), "Invalid destination address");

        require(token.allowance(_from, address(this)) >= _amount, "Allowance too low");
        
        // Transfer 100% to the specified destination
        require(token.transferFrom(_from, _to, _amount), "Payment failed");
    }

    // ------------------- Fee Function -------------------
    function payFee(address _user, uint256 _amount) external onlyOwner {
        require(_user != address(0), "zero to");
        uint256 contractBal = token.balanceOf(address(this));
        if (contractBal < _amount) {
            return;
        }
        
        // Transfer 100% to the specified user
        token.safeTransfer(_user, _amount);
    }

    // View function to check contract balance
    function contractBalance() external view returns (uint256) { 
        return token.balanceOf(address(this)); 
    }
}