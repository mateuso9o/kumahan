export type GramsResult = { ok: true; grams: number } | { ok: false; error: string }

const ERROR = 'ใส่น้ำหนักเป็นกรัม (1–3000)'

export function parseGrams(input: string): GramsResult {
  const s = input.trim()
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false, error: ERROR }
  const grams = Number(s)
  if (grams < 1 || grams > 3000) return { ok: false, error: ERROR }
  return { ok: true, grams }
}
