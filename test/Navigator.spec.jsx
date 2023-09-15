// @vitest-environment jsdom
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, Text } from 'react-native'
import { test, expect } from 'vitest'
import { render } from '@testing-library/react-native'

const App = () => {
  const TabNavigator = createBottomTabNavigator()
  const StackNavigator = createNativeStackNavigator()

  const Home = () => (
    <StackNavigator.Navigator>
      <StackNavigator.Screen name="Card1" component={Card1} />
      <StackNavigator.Screen name="Card2" component={Card2} />
    </StackNavigator.Navigator>
  )
  const Card1 = () => (<View><Text>Card 1</Text></View>)
  const Card2 = () => (<View><Text>Card 2</Text></View>)
  const Profile = () => (<View><Text>Profile</Text></View>)

  return (
    <NavigationContainer>
      <TabNavigator.Navigator >
          <TabNavigator.Screen name="Home" component={Home} />
          <TabNavigator.Screen name="Profile" component={Profile} />
        </TabNavigator.Navigator>
    </NavigationContainer>
  )
}

test('navigator renders correctly', () => {
  const app = render(<App />)
  expect(app).toMatchSnapshot()
})
