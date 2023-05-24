import { test, expect } from 'vitest'
import { render } from '@testing-library/react-native'
import { Modal, Text } from 'react-native'

const View = () => {
  return (
    <Modal>
      <Text>Hello, world!</Text>
    </Modal>
  )
}

test('scroll view components render correctly', () => {
  const container = render(<View />)
  expect(container).toMatchSnapshot()
})