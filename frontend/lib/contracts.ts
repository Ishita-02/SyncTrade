import coreAbi from "../abi/Core.json";
import erc20Abi from "../abi/erc20.json"

export const CORE_CONTRACT = process.env
  .NEXT_PUBLIC_CORE_CONTRACT as `0x${string}`;

export const CORE_ABI = coreAbi as any;
export const ERC20_ABI = erc20Abi as any;
