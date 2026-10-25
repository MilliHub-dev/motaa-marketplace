// What a dealer is paid for an order (dealer dashboard only; customers never see the commission).

/**
 * { amount, commission }: `dealer_amount` from the server (the car amount − Motaa's commission), else the car
 * amount (`sub_total`, never the customer's total with VAT/fees) from an older server.
 */
export function dealerPayout(order) {
  const commission = Number(order?.commission) || 0;
  const server = Number(order?.dealer_amount);
  if (order?.dealer_amount !== null && order?.dealer_amount !== undefined && order?.dealer_amount !== '' && Number.isFinite(server)) {
    return { amount: server, commission };
  }
  const carAmount = Number(order?.sub_total ?? order?.order_item?.price) || 0;
  return { amount: Math.max(0, carAmount - commission), commission };
}
