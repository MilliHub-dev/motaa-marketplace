import { describe, expect, it } from 'vitest';
import { dealerPayout } from './payouts';

describe('dealer payout', () => {
  it("uses the server's dealer_amount and commission", () => {
    expect(dealerPayout({ sub_total: '10000000.00', commission: '300000.00', dealer_amount: '9700000.00' }))
      .toEqual({ amount: 9700000, commission: 300000 });
    expect(dealerPayout({ sub_total: '10000000.00', commission: '0.00', dealer_amount: '10000000.00' }))
      .toEqual({ amount: 10000000, commission: 0 });
  });

  it('falls back to the car amount (never the customer total) on an older server', () => {
    expect(dealerPayout({ sub_total: '90000.00', total: '96750.00' })).toEqual({ amount: 90000, commission: 0 });
    expect(dealerPayout({ order_item: { price: '45000.00' } })).toEqual({ amount: 45000, commission: 0 });
    expect(dealerPayout({ sub_total: '90000.00', commission: '2700.00' })).toEqual({ amount: 87300, commission: 2700 });
    expect(dealerPayout(null)).toEqual({ amount: 0, commission: 0 });
  });
});
