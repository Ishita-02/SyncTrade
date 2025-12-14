import hre from "hardhat";

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();

  console.log("Deploying with account:", deployer.account.address);

  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log("Balance:", balance.toString());

  // ------------------------------------------------
  // 1. Deploy MockERC20 (Collateral)
  // ------------------------------------------------
  const collateral = await hre.viem.deployContract("MockERC20", [
    "Mock USDC",
    "mUSDC",
    18,
  ]);

  console.log("MockERC20 deployed at:", collateral.address);

  // ------------------------------------------------
  // 2. Deploy ChainlinkOracle
  // ------------------------------------------------
  const oracle = await hre.viem.deployContract("ChainlinkOracle", []);

  console.log("ChainlinkOracle deployed at:", oracle.address);

  // ------------------------------------------------
  // 3. Deploy Core
  // ------------------------------------------------
  const core = await hre.viem.deployContract("Core", [
    collateral.address,
    oracle.address,
  ]);

  console.log("Core deployed at:", core.address);

  // ------------------------------------------------
  // 4. Print env-ready output
  // ------------------------------------------------
  console.log("\n=== COPY THESE INTO ENV FILES ===");
  console.log(`CORE_CONTRACT=${core.address}`);
  console.log(`COLLATERAL_TOKEN=${collateral.address}`);
  console.log(`PRICE_ORACLE=${oracle.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
