import coreAbi from "../abi/Core.json";

export const CORE_CONTRACT = process.env
  .NEXT_PUBLIC_CORE_CONTRACT as `0x${string}`;

export const CORE_ABI = coreAbi as any;
