// frontend/src/hooks/useTokenBalance.ts
import { useReadContract, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useTokenBalance(tokenAddress?: `0x${string}`) {
  const { address } = useAccount();

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const { data: balance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  });

  const formattedBalance = balance && decimals 
    ? formatUnits(balance, decimals)
    : '0';

  return {
    balance: formattedBalance,
    rawBalance: balance,
    decimals,
    isLoading,
    refetch,
  };
}