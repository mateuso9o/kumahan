import { driFor } from './dri'

test('adult female 19-30', () =>
  expect(driFor('female', 25)).toEqual({ calciumMg: 800, ironMg: 20, magnesiumMg: 250, potassiumMg: 2050, vitaminDUg: 15 }))
test('adult male 31-50', () =>
  expect(driFor('male', 35)).toEqual({ calciumMg: 800, ironMg: 11.5, magnesiumMg: 320, potassiumMg: 2450, vitaminDUg: 15 }))
test('female 51+ needs less iron, more calcium', () => {
  const d = driFor('female', 55)
  expect(d.ironMg).toBe(10)
  expect(d.calciumMg).toBe(1000)
})
test('under 19 falls back to 19-30 values', () => expect(driFor('male', 17)).toEqual(driFor('male', 25)))
