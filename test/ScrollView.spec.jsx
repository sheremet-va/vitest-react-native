import { test, expect } from 'vitest'
import { render } from '@testing-library/react-native'
import { ScrollView, Text } from 'react-native'

const View = () => {
  return (
    <ScrollView>
      <Text>Hello, world!</Text>
    </ScrollView>
  )
}

test('scroll view components render correctly', () => {
  const container = render(<View />)
  expect(container).toMatchSnapshot()
})