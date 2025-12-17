import hre from "hardhat";
import { parseUnits } from "viem";

async function main() {
  // 1. Setup Clients using Viem
  const publicClient = await hre.viem.getPublicClient();
  const [deployer, tester] = await hre.viem.getWalletClients();

  console.log("🚀 Starting Deployment...");
  console.log("   Deployer:", deployer.account.address);
  // If a second account exists (e.g. for frontend testing), print it
  if (tester) console.log("   Tester:", tester.account.address);

  // ================================================
  // 2. Deploy Mock Tokens
  // ================================================
  console.log("\n📦 Deploying Mock Tokens...");

  // USDC (6 decimals)
  const usdc = await hre.viem.deployContract("MockERC20", ["Mock USDC", "USDC", 6]);
  console.log("   Mock USDC deployed at:", usdc.address);

  // WETH (18 decimals)
  const weth = await hre.viem.deployContract("MockERC20", ["Mock WETH", "WETH", 18]);
  console.log("   Mock WETH deployed at:", weth.address);

  // WBTC (8 decimals)
  const wbtc = await hre.viem.deployContract("MockERC20", ["Mock WBTC", "WBTC", 8]);
  console.log("   Mock WBTC deployed at:", wbtc.address);

  // ================================================
  // 3. Deploy Mock Price Feeds (Aggregators)
  // ================================================
  console.log("\n📊 Deploying Mock Price Feeds...");
  
  // Note: Values passed as BigInt for safety
  // ETH Price = $3000 (8 decimals)
  const ethFeed = await hre.viem.deployContract("MockV3Aggregator", [8, BigInt(3000 * 10**8)]);
  console.log("   ETH Feed deployed at:", ethFeed.address);

  // BTC Price = $60,000 (8 decimals)
  const btcFeed = await hre.viem.deployContract("MockV3Aggregator", [8, BigInt(60000 * 10**8)]);
  console.log("   BTC Feed deployed at:", btcFeed.address);

  // USDC Price = $1 (8 decimals)
  const usdcFeed = await hre.viem.deployContract("MockV3Aggregator", [8, BigInt(1 * 10**8)]);
  console.log("   USDC Feed deployed at:", usdcFeed.address);

  // ================================================
  // 4. Deploy & Configure Oracle
  // ================================================
  console.log("\n🔮 Deploying ChainlinkOracle...");
  const oracle = await hre.viem.deployContract("ChainlinkOracle", []);
  console.log("   Oracle deployed at:", oracle.address);

  console.log("   🔗 Linking Feeds in Oracle...");
  // 86400 seconds = 1 day timeout
  await oracle.write.setFeed([weth.address, ethFeed.address]);
  await oracle.write.setFeed([wbtc.address, btcFeed.address]);
  await oracle.write.setFeed([usdc.address, usdcFeed.address]);
  console.log("   ✅ Feeds linked");

  // ================================================
  // 5. Deploy Core Contract
  // ================================================
  console.log("\n🏗️  Deploying Core Contract...");
  const core = await hre.viem.deployContract("Core", [
    usdc.address, 
    oracle.address
  ]);
  console.log("   ✅ Core deployed at:", core.address);

  // ================================================
  // 6. Mint Tokens for Testing
  // ================================================
  console.log("\n💰 Minting Tokens to Deployer & Tester...");
  
  const amountUSDC = parseUnits("100000", 6); // 100k USDC
  const amountWETH = parseUnits("100", 18);   // 100 WETH
  const amountWBTC = parseUnits("10", 8);     // 10 WBTC

  // Mint to Deployer (Account #0 - Backend)
  await usdc.write.mint([deployer.account.address, amountUSDC]);
  await weth.write.mint([deployer.account.address, amountWETH]);
  await wbtc.write.mint([deployer.account.address, amountWBTC]);

  // Mint to Tester (Account #1 - Frontend User)
  if (tester) {
    await usdc.write.mint([tester.account.address, amountUSDC]);
    await weth.write.mint([tester.account.address, amountWETH]);
    await wbtc.write.mint([tester.account.address, amountWBTC]);
  }
  
  console.log("   ✅ Minted 100k USDC, 100 WETH, 10 WBTC to accounts");

  // ================================================
  // 7. Output Summary for .env
  // ================================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 COPY THIS INTO YOUR .env FILES");
  console.log("=".repeat(60));
  
  console.log(`\n# Backend .env`);
  console.log(`CORE_CONTRACT="${core.address}"`);
  console.log(`PRICE_ORACLE="${oracle.address}"`);
  console.log(`MOCK_USDC="${usdc.address}"`);
  console.log(`MOCK_WETH="${weth.address}"`);
  console.log(`MOCK_WBTC="${wbtc.address}"`);

  console.log(`\n# Frontend .env (NEXT_PUBLIC_...)`);
  console.log(`NEXT_PUBLIC_CORE_CONTRACT="${core.address}"`);
  console.log(`NEXT_PUBLIC_USDC="${usdc.address}"`);
  console.log(`NEXT_PUBLIC_WETH="${weth.address}"`);
  console.log(`NEXT_PUBLIC_WBTC="${wbtc.address}"`);
  
  console.log("=".repeat(60) + "\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});