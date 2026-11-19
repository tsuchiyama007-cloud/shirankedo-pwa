/** 金額を「1,234円」の形にする（端末の言語設定に左右されないよう自前で区切る） */
export function formatYen(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const digits = String(Math.floor(Math.abs(amount)));
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}円`;
}

/** 増減の表示（+100円 / -100円） */
export function formatYenDelta(amount: number): string {
  return amount >= 0 ? `+${formatYen(amount)}` : formatYen(amount);
}
