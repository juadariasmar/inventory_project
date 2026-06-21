import { AppError } from '../src/lib/AppError'

test('AppError sets message and statusCode correctly', () => {
  const error = new AppError('Stock Insuficiente', 400)
  expect(error.message).toBe('Stock Insuficiente')
  expect(error.statusCode).toBe(400)
  expect(error).toBeInstanceOf(Error)
})
