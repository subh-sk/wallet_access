/**
 * Smart Contract Deployment Script
 * This script helps deploy the USDTTransfer contract to BSC
 * 
 * Prerequisites:
 * 1. Install Node.js and npm
 * 2. Install required packages: npm install web3 @truffle/hdwallet-provider
 * 3. Have some BNB in your wallet for gas fees
 */

const Web3 = require('web3');
const fs = require('fs');

// Configuration
const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545';
const BSC_MAINNET_RPC = 'https://bsc-dataseed1.binance.org:443';

// USDT Contract Addresses
const USDT_MAINNET = '0x55d398326f99059fF775485246999027B3197955';
const USDT_TESTNET = 'YOUR_TEST_USDT_ADDRESS'; // Deploy TestUSDT.sol first

// Your wallet private key (KEEP THIS SECRET!)
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';

// Choose network (testnet/mainnet)
const NETWORK = 'testnet'; // Change to 'mainnet' for production

// Smart Contract Bytecode and ABI
// You need to compile the contract first using Remix IDE or Hardhat
// Then paste the bytecode and ABI here

const contractBytecode = `YOUR_CONTRACT_BYTECODE_HERE`;

const contractABI = [
    // Paste your contract ABI here after compilation
];

async function deployContract() {
    try {
        console.log('Starting deployment...\n');
        
        // Connect to network
        const rpcUrl = NETWORK === 'mainnet' ? BSC_MAINNET_RPC : BSC_TESTNET_RPC;
        const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        
        console.log(`Connected to ${NETWORK}`);
        console.log(`RPC: ${rpcUrl}\n`);
        
        // Add account from private key
        const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
        web3.eth.accounts.wallet.add(account);
        web3.eth.defaultAccount = account.address;
        
        console.log(`Deploying from: ${account.address}`);
        
        // Check balance
        const balance = await web3.eth.getBalance(account.address);
        console.log(`Account Balance: ${web3.utils.fromWei(balance, 'ether')} BNB\n`);
        
        if (parseFloat(web3.utils.fromWei(balance, 'ether')) < 0.01) {
            console.error('❌ Insufficient BNB balance for deployment!');
            console.error('You need at least 0.01 BNB for gas fees.');
            return;
        }
        
        // Get USDT address based on network
        const usdtAddress = NETWORK === 'mainnet' ? USDT_MAINNET : USDT_TESTNET;
        
        console.log(`USDT Token Address: ${usdtAddress}`);
        console.log('Deploying contract...\n');
        
        // Create contract instance
        const contract = new web3.eth.Contract(contractABI);
        
        // Deploy contract
        const deployTx = contract.deploy({
            data: contractBytecode,
            arguments: [usdtAddress]
        });
        
        // Estimate gas
        const gas = await deployTx.estimateGas({ from: account.address });
        console.log(`Estimated Gas: ${gas}`);
        
        // Send transaction
        const deployedContract = await deployTx.send({
            from: account.address,
            gas: gas,
            gasPrice: await web3.eth.getGasPrice()
        });
        
        console.log('\n✅ Contract deployed successfully!');
        console.log(`Contract Address: ${deployedContract.options.address}`);
        console.log(`Network: ${NETWORK}`);
        console.log(`\nView on Explorer: https://${NETWORK === 'mainnet' ? '' : 'testnet.'}bscscan.com/address/${deployedContract.options.address}`);
        
        // Save deployment info
        const deploymentInfo = {
            network: NETWORK,
            contractAddress: deployedContract.options.address,
            usdtAddress: usdtAddress,
            deployer: account.address,
            timestamp: new Date().toISOString(),
            explorerUrl: `https://${NETWORK === 'mainnet' ? '' : 'testnet.'}bscscan.com/address/${deployedContract.options.address}`
        };
        
        fs.writeFileSync(
            `deployment-${NETWORK}.json`,
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log(`\nDeployment info saved to deployment-${NETWORK}.json`);
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error(error);
    }
}

// Run deployment
deployContract();

