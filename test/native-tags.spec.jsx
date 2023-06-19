import React from "react"
import { test, expect } from "vitest"
import { Image, Modal, View } from "react-native"
import { render } from "@testing-library/react-native"
import { Svg } from "react-native-svg"
// import { Divider } from "@rneui/base"

// Not working
test("Image", () => {
  const { getByTestId } = render(<Image testID="test" source={{}} />)
  expect(getByTestId("test")).not.toBeNull()
})

// Working
test("Modal", () => {
  const { getByTestId } = render(<Modal testID="test" />)
  expect(getByTestId("test")).not.toBeNull()
})

// Not working
// test("FlatList", () => {
//   const { getByTestId } = render(
//     <FlatList testID="test" data={[]} renderItem={() => <View />} />
//   )
//   expect(getByTestId("test")).not.toBeNull()
// })

// Working
test("react-native-svg", () => {
  const { getByTestId } = render(
    <View testID="test">
      <Svg />
    </View>
  )
  expect(getByTestId("test")).not.toBeNull()
})

// Not working
// test("react-native-elements", () => {
//   const { getByTestId } = render(
//     <View testID="test">
//       <Divider color={"#000"} />
//     </View>
//   )
//   expect(getByTestId("test")).not.toBeNull()
// })