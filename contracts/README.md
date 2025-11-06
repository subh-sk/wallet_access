# Smart Contracts for USDT Transfer

This directory contains the smart contracts needed for the USDT transfer functionality.

## Contracts

### 1. USDTTransfer.sol
Main contract that handles USDT transfers with the following features:
- Single token transfers
- Batch transfers to multiple recipients
- Optional transfer fees (configurable by owner)
- Security checks for balance and allowance
- Emergency withdrawal function
- Ownership management

### 2. TestUSDT.sol
ERC20 token contract for testing on BSC Testnet:
- Mimics USDT functionality
- Minting capability for testing
- Standard ERC20 implementation

## Deployment Instructions

### Option 1: Using Remix IDE (Recommended for Beginners)

1. **Open Remix IDE**
   - Go to https://remix.ethereum.org/

2. **Create Contract Files**
   - Create new files and copy the contract code
   - `USDTTransfer.sol` and `TestUSDT.sol`

3. **Compile Contracts**
   - Select Solidity Compiler (0.8.0 or higher)
   - Click "Compile" for each contract

4. **Deploy TestUSDT (Testnet Only)**
   - Go to "Deploy & Run Transactions"
   - Select "Injected Provider - MetaMask"
   - Make sure MetaMask is connected to BSC Testnet
   - Deploy `TestUSDT` first
   - Copy the deployed contract address

5. **Deploy USDTTransfer**
   - In the constructor field, paste the USDT token address:
     - Testnet: Your deployed TestUSDT address
     - Mainnet: `0x55d398326f99059fF775485246999027B3197955`
   - Click "Deploy"
   - Confirm the transaction in MetaMask

6. **Save Contract Address**
   - Copy the deployed contract address
   - Update `static/js/app.js` with the new contract address

### Option 2: Using Hardhat

1. **Install Hardhat**
   ```bash
   npm install --save-dev hardhat @nomiclabs/hardhat-waffle
   ```

2. **Initialize Hardhat**
   ```bash
   npx hardhat
   ```

3. **Configure Hardhat**
   - Edit `hardhat.config.js` to add BSC network

4. **Deploy**
   ```bash
   npx hardhat run scripts/deploy.js --network bscTestnet
   ```

### Option 3: Using Truffle

1. **Install Truffle**
   ```bash
   npm install -g truffle
   ```

2. **Initialize Project**
   ```bash
   truffle init
   ```

3. **Deploy**
   ```bash
   truffle migrate --network bscTestnet
   ```

## BSC Network Configuration

### Testnet
- **Network Name:** Binance Smart Chain Testnet
- **RPC URL:** https://data-seed-prebsc-1-s1.binance.org:8545
- **Chain ID:** 97
- **Symbol:** BNB
- **Block Explorer:** https://testnet.bscscan.com
- **Faucet:** https://testnet.binance.org/faucet-smart

### Mainnet
- **Network Name:** Binance Smart Chain Mainnet
- **RPC URL:** https://bsc-dataseed1.binance.org:443
- **Chain ID:** 56
- **Symbol:** BNB
- **Block Explorer:** https://bscscan.com

## Contract Addresses

### USDT Token
- **Mainnet:** `0x55d398326f99059fF775485246999027B3197955`
- **Testnet:** Deploy your own TestUSDT

### USDTTransfer Contract
- **Testnet:** [Your deployed address]
- **Mainnet:** [Your deployed address]

## Testing on Testnet

1. **Get Test BNB**
   - Visit https://testnet.binance.org/faucet-smart
   - Enter your wallet address
   - Receive test BNB for gas fees

2. **Get Test USDT**
   - Deploy TestUSDT contract
   - Call `mint()` function to mint tokens to your address

3. **Test the Application**
   - Connect your wallet
   - Approve USDT spending
   - Try transferring tokens

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never share your private key**
2. **Test thoroughly on testnet before mainnet**
3. **Audit the contract code before using with real funds**
4. **Set reasonable transfer fees (if any)**
5. **Use a hardware wallet for mainnet deployments**
6. **Verify contract source code on BSCScan**

## Contract Verification

After deployment, verify your contract on BSCScan:

1. Go to BSCScan (testnet or mainnet)
2. Find your contract address
3. Click "Verify and Publish"
4. Enter contract details and source code
5. Verify

## Gas Optimization Tips

- Batch transfers save gas compared to multiple single transfers
- Approve once with a large amount to avoid multiple approval transactions
- Use appropriate gas price based on network congestion

## Support

For issues or questions:
- Check BSCScan for transaction status
- Review contract events and logs
- Test with small amounts first
- Consult BSC documentation: https://docs.binance.org/smart-chain/

