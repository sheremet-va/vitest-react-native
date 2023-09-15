import { Platform } from './src/Platform';
import { test, expect } from 'vitest'
import { render } from '@testing-library/react-native'

test('platform specific renders correctly', () => {
  const app = render(<Platform />)
  expect(app).toMatchSnapshot()
})
