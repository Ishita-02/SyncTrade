import { FEES } from "../constants/fees.js";

export function calculateSizeUsd(collateralUsd: number, leverage: number) {
  return collateralUsd * leverage;
}

export function calculateFees(sizeUsd: number, leaderFeeBps: number) {
  const openFeeUsd =
    (sizeUsd * FEES.OPEN_FEE_BPS) / 10_000;

  const closeFeeUsd =
    (sizeUsd * FEES.CLOSE_FEE_BPS) / 10_000;

  const protocolFeeUsd =
    (sizeUsd * FEES.PROTOCOL_FEE_BPS) / 10_000;

  return {
    openFeeUsd,
    closeFeeUsd,
    protocolFeeUsd,
    leaderFeeBps,
  };
}

export function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  isLong: boolean
) {
  if (isLong) {
    return entryPrice * (1 - 1 / leverage);
  }
  return entryPrice * (1 + 1 / leverage);
}

export function calculatePnl(
  entryPrice: number,
  currentPrice: number,
  sizeUsd: number,
  isLong: boolean
) {
  const priceDelta = isLong
    ? currentPrice - entryPrice
    : entryPrice - currentPrice;

  return (priceDelta / entryPrice) * sizeUsd;
}
