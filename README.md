# 🚀 Crypto Wallet - USDT Transfer Demo

A comprehensive demo web application that allows users to connect their MetaMask or Trust Wallet, view their balance, and transfer USDT tokens on Binance Smart Chain (BSC).

![Demo Screenshot](https://via.placeholder.com/800x400/0F172A/4F46E5?text=Crypto+Wallet+Demo)

## ✨ Features

- 🔐 **Wallet Connection**: Connect MetaMask or Trust Wallet
- 💰 **Balance Display**: View BNB and USDT balances in real-time
- 📊 **Transaction History**: See recent transactions
- ✅ **USDT Approval**: Approve smart contract to spend USDT
- 💸 **Token Transfer**: Send USDT to any wallet address
- 🌐 **BSC Network**: Works on both Testnet and Mainnet
- 🎨 **Modern UI**: Beautiful dark-themed responsive interface
- ⚡ **Fast & Secure**: Direct wallet interaction, no backend signing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.8 or higher
- MetaMask or Trust Wallet browser extension
- Git (optional)

## 🛠️ Installation

### Step 1: Clone or Download the Repository

```bash
git clone <repository-url>
cd wallet_access
```

Or download and extract the ZIP file.

### Step 2: Create Virtual Environment (Recommended)

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the template
cp .env.template .env
```

Edit `.env` and configure:

```env
SECRET_KEY=your-secret-key-here
NETWORK=testnet
```

## 🚀 Quick Start

### 1. Run the Application

```bash
python app.py
```

The application will start at `http://localhost:5000`

### 2. Open in Browser

Navigate to `http://localhost:5000` in your web browser.

### 3. Connect Your Wallet

- Click "Connect Wallet" button
- Approve the connection in MetaMask/Trust Wallet
- The app will prompt you to switch to BSC Testnet

### 4. Get Test Tokens (Testnet Only)

**Get Test BNB:**
1. Visit https://testnet.binance.org/faucet-smart
2. Enter your wallet address
3. Receive test BNB for gas fees

**Get Test USDT:**
- Deploy the TestUSDT contract (see Smart Contract Deployment)
- Or use an existing test USDT token

### 5. Approve USDT Spending

1. Enter the amount you want to approve
2. Click "Approve USDT"
3. Confirm the transaction in your wallet

### 6. Transfer USDT

1. Enter recipient address
2. Enter amount to transfer
3. Click "Send USDT"
4. Confirm the transaction in your wallet

## 📁 Project Structure

```
wallet_access/
├── app.py                  # Flask backend application
├── config.py              # Configuration management
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (create this)
├── .gitignore            # Git ignore file
├── README.md             # This file
│
├── templates/
│   └── index.html        # Main HTML template
│
├── static/
│   ├── css/
│   │   └── style.css     # Styling
│   └── js/
│       └── app.js        # Frontend Web3 logic
│
└── contracts/
    ├── USDTTransfer.sol  # Main transfer contract
    ├── TestUSDT.sol      # Test USDT token
    ├── deploy.js         # Deployment script
    └── README.md         # Contract documentation
```

## 🔧 Smart Contract Deployment

### Option 1: Using Remix IDE (Recommended)

1. **Open Remix**
   - Go to https://remix.ethereum.org/

2. **Create Contract Files**
   - Copy `contracts/TestUSDT.sol` and `contracts/USDTTransfer.sol`
   - Create new files in Remix

3. **Compile**
   - Select Solidity Compiler (0.8.0+)
   - Compile both contracts

4. **Deploy TestUSDT (Testnet)**
   - Connect MetaMask to BSC Testnet
   - Deploy TestUSDT contract
   - Save the contract address

5. **Deploy USDTTransfer**
   - Use the TestUSDT address as constructor parameter
   - Deploy the contract
   - Save the contract address

6. **Update Frontend**
   - Edit `static/js/app.js`
   - Update `USDT_CONTRACT_ADDRESS` with your deployed address

### Option 2: Using Hardhat/Truffle

See `contracts/README.md` for detailed instructions.

## 🌐 Network Configuration

### BSC Testnet (Default)

- **RPC URL:** https://data-seed-prebsc-1-s1.binance.org:8545
- **Chain ID:** 97
- **Symbol:** BNB
- **Explorer:** https://testnet.bscscan.com
- **Faucet:** https://testnet.binance.org/faucet-smart

### BSC Mainnet

⚠️ **Use with real funds only after thorough testing!**

- **RPC URL:** https://bsc-dataseed1.binance.org:443
- **Chain ID:** 56
- **Symbol:** BNB
- **Explorer:** https://bscscan.com
- **USDT Address:** `0x55d398326f99059fF775485246999027B3197955`

## 🔐 Security Best Practices

### For Users

1. ✅ Always test on testnet first
2. ✅ Verify contract addresses before approving
3. ✅ Never share your private keys or seed phrase
4. ✅ Use hardware wallets for large amounts
5. ✅ Double-check recipient addresses
6. ✅ Start with small test transfers

### For Developers

1. ✅ Never commit `.env` file
2. ✅ Keep private keys secure
3. ✅ Audit smart contracts before mainnet
4. ✅ Use environment variables for sensitive data
5. ✅ Implement rate limiting in production
6. ✅ Add proper error handling
7. ✅ Verify contracts on BSCScan

## 🐛 Troubleshooting

### Wallet Won't Connect

- Ensure MetaMask/Trust Wallet is installed
- Check if the browser extension is enabled
- Try refreshing the page
- Clear browser cache

### Transaction Failed

- Ensure you have enough BNB for gas
- Check if you've approved enough USDT
- Verify you're on the correct network
- Check transaction on BSCScan for details

### Balance Shows Zero

- Ensure you're connected to the correct network
- Verify the USDT contract address is correct
- Check if your wallet actually has tokens
- Try refreshing the balance

### Can't Switch to BSC Network

- Manually add BSC network in MetaMask:
  - Network Name: BSC Testnet
  - RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545
  - Chain ID: 97
  - Symbol: BNB

## 📚 API Documentation

### Backend Endpoints

#### `GET /api/check-connection`
Check Web3 connection status.

#### `POST /api/get-balance`
Get BNB and USDT balance for an address.
```json
{
  "address": "0x..."
}
```

#### `POST /api/get-transactions`
Get recent transactions for an address.
```json
{
  "address": "0x..."
}
```

#### `POST /api/check-allowance`
Check USDT allowance for a spender.
```json
{
  "owner": "0x...",
  "spender": "0x..."
}
```

#### `GET /api/network-info`
Get current network information.

## 🎨 Customization

### Change Theme Colors

Edit `static/css/style.css` and modify the CSS variables:

```css
:root {
    --primary-color: #4F46E5;
    --secondary-color: #10B981;
    /* ... more colors */
}
```

### Add Custom Features

The codebase is modular and easy to extend:

- **Backend**: Add new routes in `app.py`
- **Frontend**: Add new functions in `static/js/app.js`
- **Contracts**: Extend `contracts/USDTTransfer.sol`

## 📝 License

This project is provided as-is for educational and demonstration purposes.

## ⚠️ Disclaimer

This is a demo application for educational purposes. Always conduct thorough testing and security audits before using with real funds. The developers are not responsible for any loss of funds.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review BSC documentation: https://docs.binance.org/smart-chain/
- Check transaction status on BSCScan

## 🎯 Roadmap

- [ ] Add support for other tokens (BEP-20)
- [ ] Implement batch transfers UI
- [ ] Add transaction history pagination
- [ ] Integrate price feeds for USD conversion
- [ ] Add QR code scanner for addresses
- [ ] Implement gasless transactions (meta-transactions)
- [ ] Add multi-language support

## 📊 Tech Stack

- **Backend**: Python, Flask, Web3.py
- **Frontend**: HTML5, CSS3, JavaScript, Web3.js
- **Smart Contracts**: Solidity 0.8.0+
- **Blockchain**: Binance Smart Chain (BSC)
- **Wallets**: MetaMask, Trust Wallet

---

Made with ❤️ for the crypto community

