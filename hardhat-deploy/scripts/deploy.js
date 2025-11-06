const hre = require("hardhat");

async function main() {
  console.log("Deploying TestUSDT to BSC Testnet...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BNB\n");

  // Deploy TestUSDT
  const TestUSDT = await hre.ethers.getContractFactory("SimpleTestUSDT");
  const testUSDT = await TestUSDT.deploy();
  
  await testUSDT.waitForDeployment();
  const address = await testUSDT.getAddress();

  console.log("✅ TestUSDT deployed to:", address);
  console.log("\n📋 Update this address in your app:");
  console.log("File: static/js/app.js");
  console.log("Line 69: const USDT_CONTRACT_ADDRESS =", `'${address}';`);
  console.log("\n🔍 View on BSCScan:");
  console.log(`https://testnet.bscscan.com/address/${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

