import { StockService } from '../src/services/StockService'
import { AppError } from '../src/lib/AppError'

test('validarDisponibilidad throws AppError if stock is insufficient', () => {
  expect(() => {
    StockService.validarDisponibilidad({ id: 1, cantidad: 5, nombre: 'A', precio: 10, codigo: '123' }, 10, 0)
  }).toThrow(AppError)
})
