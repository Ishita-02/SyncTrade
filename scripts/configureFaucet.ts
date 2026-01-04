import hre from "hardhat";
import { parseUnits } from "viem";

async function main() {
  const [owner] = await hre.viem.getWalletClients();

  console.log("⚙️ Configuring Faucet Tokens");
  console.log("Owner:", owner.account.address);

  const FAUCET_ADDRESS = "0x3eedf20e882e2431306ce9051d73d52c724bffb3";

  const TOKENS = {
    USDC: {
      address: "0x0cb06d17db9a5eee2ffc278c1cc7a4f27cecfa6d",
      decimals: 6,
      drip: "500",       
      max: "2000",
    },
    WETH: {
      address: "0x25422f717ed1c5f40c857631b75e8254cec277fc",
      decimals: 18,
      drip: "0.25",
      max: "1",
    },
    ARB: {
      address: "0x075b7cb0ebe78993b7cd683dfb0177744c12f7a3",
      decimals: 18,
      drip: "50",
      max: "200",
    },
    LINK: {
      address: "0xd4b0cff6a44ad1bf89e11cb0cd8f6def9d1bc91e",
      decimals: 18,
      drip: "50",
      max: "200",
    },
    UNI: {
      address: "0x62b235b76923a6c0521809683df12a62e5984916",
      decimals: 18,
      drip: "50",
      max: "200",
    },
    WBTC: {
      address: "0x41db84064e1118bae32c57b99b97095ea97bfb24",
      decimals: 8,
      drip: "0.005",
      max: "0.02",
    },
  };

  const faucet = await hre.viem.getContractAt(
    "TokenFaucet",
    FAUCET_ADDRESS
  );

  const ONE_DAY = BigInt(24 * 60 * 60);

  for (const [symbol, cfg] of Object.entries(TOKENS)) {
    console.log(`\n🔧 Setting ${symbol}`);

    await faucet.write.addOrUpdateToken([
      cfg.address as `0x${string}`,
      parseUnits(cfg.drip, cfg.decimals),
      parseUnits(cfg.max, cfg.decimals),
      ONE_DAY,     // ⏱️ 1 day cooldown
      true,
    ]);

    console.log(
      `   ✅ ${symbol}: drip=${cfg.drip}, max=${cfg.max}, cooldown=1 day`
    );
  }

  console.log("\n🎉 Faucet configuration completed successfully");
}

main().catch((err) => {
  console.error("❌ Error configuring faucet:", err);
  process.exit(1);
});
