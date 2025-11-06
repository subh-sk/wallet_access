# Deploy with Hardhat (Alternative to Remix)

If Remix keeps timing out, use Hardhat for reliable deployment.

## Setup

1. **Install Node.js** (if not installed):
   - Download from: https://nodejs.org/
   - Install LTS version

2. **Install Dependencies:**
   ```bash
   cd hardhat-deploy
   npm install
   ```

3. **Configure:**
   - Open `hardhat.config.js`
   - Replace `YOUR_PRIVATE_KEY_HERE` with your MetaMask private key
   - ⚠️ NEVER share or commit this file!

4. **Get Private Key from MetaMask:**
   - Open MetaMask
   - Click 3 dots → Account Details
   - Click "Export Private Key"
   - Enter password
   - Copy the key

5. **Copy Contract:**
   - Copy `../contracts/SimpleTestUSDT.sol` to `hardhat-deploy/contracts/`

6. **Deploy:**
   ```bash
   npm run deploy
   ```

7. **Update App:**
   - Copy the deployed contract address
   - Update `static/js/app.js` line 69

## Success!
Your contract is deployed and ready to use! 🎉

