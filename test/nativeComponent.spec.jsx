import { test } from 'vitest'
import { render } from '@testing-library/react-native'
import Item from './src/Item'

test('native components render correctly', () => {
  const container = render(<Item />)
  expect(container).toMatchSnapshot()
})