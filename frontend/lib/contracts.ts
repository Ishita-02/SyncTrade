import coreAbi from "../abi/Core.json";
import erc20Abi from "../abi/erc20.json"
import faucetAbi from "../abi/TokenFaucet.json"

export const CORE_CONTRACT = process.env
  .NEXT_PUBLIC_CORE_CONTRACT as `0x${string}`;

export const CORE_ABI = coreAbi as any;
export const ERC20_ABI = erc20Abi as any;
export const FAUCET_ABI = faucetAbi as any;

export const FAUCET_TOKENS = [
  { symbol: "USDC", address: process.env.NEXT_PUBLIC_MOCK_USDC as `0x${string}` },
  { symbol: "WETH", address: process.env.NEXT_PUBLIC_MOCK_WETH as `0x${string}` },
  { symbol: "WBTC", address: process.env.NEXT_PUBLIC_MOCK_WBTC as `0x${string}` },
  { symbol: "UNI",  address: process.env.NEXT_PUBLIC_MOCK_UNI as `0x${string}` },
  { symbol: "ARB",  address: process.env.NEXT_PUBLIC_MOCK_ARB as `0x${string}` },
  { symbol: "LINK", address: process.env.NEXT_PUBLIC_MOCK_LINK as `0x${string}` },
];