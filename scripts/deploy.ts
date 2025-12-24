import hre from "hardhat";
import { parseUnits } from "viem";

async function main() {
  // 1. Setup Clients
  const publicClient = await hre.viem.getPublicClient();
  const [deployer, tester] = await hre.viem.getWalletClients();

  console.log("🚀 Starting Deployment...");
  console.log("   Deployer:", deployer.account.address);
  if (tester) console.log("   Tester:", tester.account.address);

  // ================================================
  // 2. Deploy Mock Tokens
  // ================================================
  console.log("\n📦 Deploying Mock Tokens...");

  // USDC (6 decimals)
  const usdc = await hre.viem.deployContract("MockERC20", [
    "Mock USDC",
    "USDC",
    6
  ]);
  console.log("   Mock USDC deployed at:", usdc.address);

  // WETH (18 decimals)
  const weth = await hre.viem.deployContract("MockERC20", [
    "Mock WETH",
    "WETH",
    18
  ]);
  console.log("   Mock WETH deployed at:", weth.address);

  // WBTC (8 decimals)
  const wbtc = await hre.viem.deployContract("MockERC20", [
    "Mock WBTC",
    "WBTC",
    8
  ]);
  console.log("   Mock WBTC deployed at:", wbtc.address);

  // ================================================
  // 3. Deploy Core Contract (NO ORACLE)
  // ================================================
  console.log("\n🏗️  Deploying Core Contract...");

  
  const core = await hre.viem.deployContract("Core", [
    usdc.address // FIX: only collateral token now
  ] as const);

  console.log("   ✅ Core deployed at:", core.address);

  // ================================================
  // 4. Mint Tokens for Testing
  // ================================================
  console.log("\n💰 Minting Tokens to Deployer & Tester...");

  const amountUSDC = parseUnits("100000", 6); // 100k USDC
  const amountWETH = parseUnits("100", 18);  // 100 WETH
  const amountWBTC = parseUnits("10", 8);    // 10 WBTC

  // Mint to Deployer
  await usdc.write.mint([deployer.account.address, amountUSDC]);
  await weth.write.mint([deployer.account.address, amountWETH]);
  await wbtc.write.mint([deployer.account.address, amountWBTC]);

  // Mint to Tester
  if (tester) {
    await usdc.write.mint([tester.account.address, amountUSDC]);
    await weth.write.mint([tester.account.address, amountWETH]);
    await wbtc.write.mint([tester.account.address, amountWBTC]);
  }

  console.log("   ✅ Minted test tokens");

  // ================================================
  // 5. Output Summary for .env
  // ================================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 COPY THIS INTO YOUR .env FILES");
  console.log("=".repeat(60));

  console.log(`\n# Backend .env`);
  console.log(`CORE_CONTRACT="${core.address}"`);
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
