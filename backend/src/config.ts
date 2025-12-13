import dotenv from "dotenv";
dotenv.config();

export const config = {
  RPC_URL: process.env.RPC_URL!,
  CORE_CONTRACT: process.env.CORE_CONTRACT! as `0x${string}`,
  PORT: Number(process.env.PORT || 5000),
  PRIVATE_KEY: process.env.PRIVATE_KEY!,
  CHAIN_ID: process.env.CHAIN_ID!,
};
