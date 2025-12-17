import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains"; // <--- Import hardhat chain
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as `0x${string}`;
const RPC_URL = "http://127.0.0.1:8545";

if (!PRIVATE_KEY) throw new Error("Missing ADMIN_PRIVATE_KEY");

const account = privateKeyToAccount(PRIVATE_KEY);

export const walletClient = createWalletClient({
  account,
  chain: hardhat,
  transport: http(RPC_URL),
}).extend(publicActions);

console.log("Backend Wallet Connected:", account.address);