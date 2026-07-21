export function saleEstimate(lines: Array<{ price: string | number; quantity: number }>) {
  return lines.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0)
}

export function purchaseEstimate(lines: Array<{ purchase_price: string | number; quantity: number }>) {
  return lines.reduce((sum, line) => sum + Number(line.purchase_price) * line.quantity, 0)
}

