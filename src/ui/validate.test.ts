import { parseGrams } from './validate'

const ERR = 'ใส่น้ำหนักเป็นกรัม (1–3000)'
test('accepts plain grams', () => expect(parseGrams('200')).toEqual({ ok: true, grams: 200 }))
test('accepts decimals and spaces', () => expect(parseGrams(' 12.5 ')).toEqual({ ok: true, grams: 12.5 }))
test('rejects kilograms typed by mistake', () => expect(parseGrams('0.2')).toEqual({ ok: false, error: ERR }))
test('rejects too large', () => expect(parseGrams('20000')).toEqual({ ok: false, error: ERR }))
test('rejects text', () => expect(parseGrams('abc')).toEqual({ ok: false, error: ERR }))
test('rejects empty', () => expect(parseGrams('')).toEqual({ ok: false, error: ERR }))
