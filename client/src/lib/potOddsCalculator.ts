/**
 * Calculates the pot odds, which is the ratio of the amount of money in the pot to the amount of money required to call.
 * @param amountToCall The amount required to call the current bet.
 * @param potSize The total size of the pot.
 * @returns The pot odds as a percentage.
 */
export function calculatePotOdds(amountToCall: number, potSize: number): number {
  if (amountToCall <= 0) {
    return 0;
  }
  const totalPot = potSize + amountToCall;
  const odds = (amountToCall / totalPot) * 100;
  return Math.round(odds);
}
