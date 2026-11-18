// Downloading the dealer's orders as a CSV file (used by Overview and Orders).

/** Download the period's orders as CSV (the request needs the dealer's login, so it goes through the API client). */
export async function exportOrders(api, range, notifyError) {
  try {
    const response = await api.http.get('/admin/dealership/orders/export/', { params: { range }, responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `motaa-orders-${range}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    notifyError?.(error, "Couldn't export your orders");
  }
}
