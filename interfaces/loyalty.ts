export interface LoyaltyTier {
  name: string;
  minSpend: number;
  multiplier: number;
}

export interface LoyaltyConfig {
  active: boolean;
  /** Spend (DA) required for 1 base point. */
  spendPerPoint: number;
  /** DA value of 1 point when redeemed. */
  valuePerPoint: number;
  tiers: LoyaltyTier[];
}

export const DEFAULT_LOYALTY: LoyaltyConfig = {
  active: true,
  spendPerPoint: 100,
  valuePerPoint: 5,
  tiers: [
    { name: 'Bronze', minSpend: 0, multiplier: 1 },
    { name: 'Silver', minSpend: 50000, multiplier: 1.5 },
    { name: 'Gold', minSpend: 150000, multiplier: 2 },
  ],
};

export function tierForSpend(totalSpend: number, tiers: LoyaltyTier[]): LoyaltyTier {
  const sorted = [...tiers].sort((a, b) => a.minSpend - b.minSpend);
  let current = sorted[0] || DEFAULT_LOYALTY.tiers[0];
  for (const t of sorted) {
    if (totalSpend >= t.minSpend) current = t;
  }
  return current;
}

export function pointsForOrder(total: number, cfg: LoyaltyConfig, multiplier: number): number {
  if (!cfg.active || cfg.spendPerPoint <= 0) return 0;
  return Math.floor((total / cfg.spendPerPoint) * multiplier);
}
