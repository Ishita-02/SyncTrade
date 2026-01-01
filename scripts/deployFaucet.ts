import hre from "hardhat";
import { parseUnits } from "viem";

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const [deployer, tester] = await hre.viem.getWalletClients();

  console.log("🚀 Starting Deployment...");
  console.log("   Deployer:", deployer.account.address);
  if (tester) console.log("   Tester:", tester.account.address);

  // =================================================
  // 1. Deploy Mock Tokens
  // =================================================
  console.log("\n📦 Deploying Mock Tokens...");

  const deployToken = async (name: string, symbol: string, decimals: number) => {
    const token = await hre.viem.deployContract("MockERC20", [
      name,
      symbol,
      decimals
    ]);
    console.log(`   ${symbol} deployed at:`, token.address);
    return token;
  };

  const usdc = await deployToken("Mock USDC", "USDC", 6);
  const weth = await deployToken("Mock WETH", "WETH", 18);
  const wbtc = await deployToken("Mock WBTC", "WBTC", 8);
  const uni  = await deployToken("Mock UNI", "UNI", 18);
  const arb  = await deployToken("Mock Arbitrum", "ARB", 18);
  const link = await deployToken("Mock Chainlink", "LINK", 18);

  // =================================================
  // 2. Deploy Faucet
  // =================================================
  console.log("\n🚰 Deploying Token Faucet...");

  const faucet = await hre.viem.deployContract("TokenFaucet", []);
  console.log("   Faucet deployed at:", faucet.address);

  // =================================================
  // 3. Deploy Core Contract
  // =================================================
  console.log("\n🏗️ Deploying Core Contract...");

  const core = await hre.viem.deployContract("Core", [
    usdc.address
  ] as const);

  console.log("   ✅ Core deployed at:", core.address);

  // =================================================
  // 4. Mint Tokens
  // =================================================
  console.log("\n💰 Minting Tokens...");

  // Faucet supply (large)
  const faucetSupply = {
    USDC: parseUnits("1000000", 6),
    WETH: parseUnits("10000", 18),
    WBTC: parseUnits("1000", 8),
    UNI:  parseUnits("1000000", 18),
    ARB:  parseUnits("1000000", 18),
    LINK: parseUnits("500000", 18),
  };

  // Tester supply (small)
  const testSupply = {
    USDC: parseUnits("1000", 6),
    WETH: parseUnits("10", 18),
    WBTC: parseUnits("1", 8),
    UNI:  parseUnits("1000", 18),
    ARB:  parseUnits("1000", 18),
    LINK: parseUnits("500", 18),
  };

  // Mint to faucet
  await usdc.write.mint([faucet.address, faucetSupply.USDC]);
  await weth.write.mint([faucet.address, faucetSupply.WETH]);
  await wbtc.write.mint([faucet.address, faucetSupply.WBTC]);
  await uni.write.mint([faucet.address, faucetSupply.UNI]);
  await arb.write.mint([faucet.address, faucetSupply.ARB]);
  await link.write.mint([faucet.address, faucetSupply.LINK]);

  // Mint small amount to deployer
  await usdc.write.mint([deployer.account.address, testSupply.USDC]);
  await weth.write.mint([deployer.account.address, testSupply.WETH]);
  await wbtc.write.mint([deployer.account.address, testSupply.WBTC]);
  await uni.write.mint([deployer.account.address, testSupply.UNI]);
  await arb.write.mint([deployer.account.address, testSupply.ARB]);
  await link.write.mint([deployer.account.address, testSupply.LINK]);

  // Mint to tester (optional)
  if (tester) {
    await usdc.write.mint([tester.account.address, testSupply.USDC]);
    await weth.write.mint([tester.account.address, testSupply.WETH]);
    await wbtc.write.mint([tester.account.address, testSupply.WBTC]);
    await uni.write.mint([tester.account.address, testSupply.UNI]);
    await arb.write.mint([tester.account.address, testSupply.ARB]);
    await link.write.mint([tester.account.address, testSupply.LINK]);
  }

  console.log("   ✅ Tokens minted");

  // =================================================
  // 5. Output ENV
  // =================================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 COPY THIS INTO YOUR .env");
  console.log("=".repeat(60));

  console.log(`
    CORE_CONTRACT="${core.address}"
    FAUCET="${faucet.address}"

    MOCK_USDC="${usdc.address}"
    MOCK_WETH="${weth.address}"
    MOCK_WBTC="${wbtc.address}"
    MOCK_UNI="${uni.address}"
    MOCK_ARB="${arb.address}"
    MOCK_LINK="${link.address}"
`);

  console.log("=".repeat(60) + "\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
