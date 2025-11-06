require("@nomicfoundation/hardhat-toolbox");

// IMPORTANT: Replace with your actual private key
// Get it from MetaMask: Account Details → Export Private Key
const PRIVATE_KEY = "YOUR_PRIVATE_KEY_HERE";

module.exports = {
  solidity: "0.8.0",
  networks: {
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [PRIVATE_KEY]
    }
  }
};

