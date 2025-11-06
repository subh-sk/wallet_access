// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title USDT Transfer Contract
 * @dev This contract allows users to transfer USDT tokens through the contract
 * Users must approve this contract to spend their USDT before transferring
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract USDTTransfer {
    address public owner;
    IERC20 public usdtToken;
    
    // Fee configuration (in basis points, 100 = 1%)
    uint256 public transferFee = 0; // 0% fee by default
    uint256 public constant MAX_FEE = 500; // Maximum 5% fee
    
    // Events
    event TokenTransfer(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Constructor sets the USDT token address and contract owner
     * @param _usdtTokenAddress Address of the USDT token contract on BSC
     * BSC Mainnet USDT: 0x55d398326f99059fF775485246999027B3197955
     * BSC Testnet: Deploy your own test token or use existing test token
     */
    constructor(address _usdtTokenAddress) {
        require(_usdtTokenAddress != address(0), "Invalid token address");
        owner = msg.sender;
        usdtToken = IERC20(_usdtTokenAddress);
    }
    
    /**
     * @dev Transfer USDT from sender to recipient
     * @param _to Recipient address
     * @param _amount Amount of USDT to transfer (in smallest unit, with decimals)
     * @return success Boolean indicating if the transfer was successful
     */
    function transferUSDT(address _to, uint256 _amount) external returns (bool success) {
        require(_to != address(0), "Invalid recipient address");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Check sender's balance
        uint256 senderBalance = usdtToken.balanceOf(msg.sender);
        require(senderBalance >= _amount, "Insufficient USDT balance");
        
        // Check allowance
        uint256 allowance = usdtToken.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Insufficient allowance. Please approve tokens first.");
        
        // Calculate fee
        uint256 fee = (_amount * transferFee) / 10000;
        uint256 amountAfterFee = _amount - fee;
        
        // Transfer tokens from sender to recipient
        require(
            usdtToken.transferFrom(msg.sender, _to, amountAfterFee),
            "Transfer failed"
        );
        
        // Transfer fee to contract owner if fee is set
        if (fee > 0) {
            require(
                usdtToken.transferFrom(msg.sender, owner, fee),
                "Fee transfer failed"
            );
        }
        
        emit TokenTransfer(msg.sender, _to, amountAfterFee, fee, block.timestamp);
        return true;
    }
    
    /**
     * @dev Transfer USDT to multiple recipients in one transaction
     * @param _recipients Array of recipient addresses
     * @param _amounts Array of amounts to transfer to each recipient
     * @return success Boolean indicating if all transfers were successful
     */
    function batchTransferUSDT(
        address[] memory _recipients,
        uint256[] memory _amounts
    ) external returns (bool success) {
        require(_recipients.length == _amounts.length, "Arrays length mismatch");
        require(_recipients.length > 0, "Empty recipients array");
        require(_recipients.length <= 100, "Too many recipients (max 100)");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }
        
        // Check sender's balance
        uint256 senderBalance = usdtToken.balanceOf(msg.sender);
        require(senderBalance >= totalAmount, "Insufficient USDT balance");
        
        // Check allowance
        uint256 allowance = usdtToken.allowance(msg.sender, address(this));
        require(allowance >= totalAmount, "Insufficient allowance");
        
        // Perform transfers
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient address");
            require(_amounts[i] > 0, "Amount must be greater than 0");
            
            uint256 fee = (_amounts[i] * transferFee) / 10000;
            uint256 amountAfterFee = _amounts[i] - fee;
            
            require(
                usdtToken.transferFrom(msg.sender, _recipients[i], amountAfterFee),
                "Transfer failed"
            );
            
            if (fee > 0) {
                require(
                    usdtToken.transferFrom(msg.sender, owner, fee),
                    "Fee transfer failed"
                );
            }
            
            emit TokenTransfer(msg.sender, _recipients[i], amountAfterFee, fee, block.timestamp);
        }
        
        return true;
    }
    
    /**
     * @dev Check the USDT balance of an address
     * @param _account Address to check balance for
     * @return balance USDT balance of the address
     */
    function getUSDTBalance(address _account) external view returns (uint256 balance) {
        return usdtToken.balanceOf(_account);
    }
    
    /**
     * @dev Check the allowance granted to this contract
     * @param _owner Address of the token owner
     * @return allowance Amount of USDT this contract can spend
     */
    function getAllowance(address _owner) external view returns (uint256 allowance) {
        return usdtToken.allowance(_owner, address(this));
    }
    
    /**
     * @dev Update the transfer fee (only owner)
     * @param _newFee New fee in basis points (100 = 1%)
     */
    function updateFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee exceeds maximum");
        uint256 oldFee = transferFee;
        transferFee = _newFee;
        emit FeeUpdated(oldFee, _newFee);
    }
    
    /**
     * @dev Transfer ownership of the contract
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner);
    }
    
    /**
     * @dev Emergency function to withdraw any tokens accidentally sent to this contract
     * @param _token Address of the token to withdraw
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        IERC20(_token).transfer(owner, _amount);
    }
}

