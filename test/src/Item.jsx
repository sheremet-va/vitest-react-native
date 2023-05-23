import { View, Pressable } from 'react-native';
import { styles } from './itemStyles';
import TrashIcon from '../assets/trashIcon.svg';

const Item = (props) => {
  return (
    <View style={styles.itemContainer}>
      <Pressable
        style={[
          styles.trashButton,
          props.state === 'done' && styles.trashButtonDone,
        ]}
        onPress={() => props.trashTodo(props.id)}
        hitSlop={10}
      >
        <TrashIcon height={20} />
      </Pressable>
    </View>
  );
};

export default Item