import { View, Text } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgb(44, 40, 38)', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'rgb(230, 222, 216)', fontSize: 17 }}>Loom — rebuilding</Text>
    </View>
  );
}
