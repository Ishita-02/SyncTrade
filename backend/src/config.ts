// backend/src/config.ts
import dotenv from "dotenv";
dotenv.config();

export const config = {
  RPC_URL: process.env.RPC_URL_LOCAL!,
  CORE_CONTRACT: process.env.CORE_CONTRACT! as `0x${string}`,
  PORT: Number(process.env.PORT || 5000),
  PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY!,
  CHAIN_ID: process.env.CHAIN_ID!,
  
  // Mock tokens for testing
  MOCK_USDC: (process.env.MOCK_USDC || "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`,
  MOCK_WETH: (process.env.MOCK_WETH || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") as `0x${string}`,
  MOCK_WBTC: (process.env.MOCK_WBTC || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0") as `0x${string}`,
};

// Validate
if (!config.PRIVATE_KEY) {
  console.error("❌ ADMIN_PRIVATE_KEY not set in .env");
  process.exit(1);
}

console.log("📍 Backend Config Loaded:");
console.log(`   RPC: ${config.RPC_URL}`);
console.log(`   Chain ID: ${config.CHAIN_ID}`);
console.log(`   Contract: ${config.CORE_CONTRACT}`);
console.log(`   Mock USDC: ${config.MOCK_USDC}`);
console.log(`   Mock WETH: ${config.MOCK_WETH}`);
console.log(`   Mock WBTC: ${config.MOCK_WBTC}`);