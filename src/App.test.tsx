import { render, screen } from '@testing-library/react'
import App from './App'

test('shows app title heading', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'คุมอาหาร' })).toBeInTheDocument()
})
