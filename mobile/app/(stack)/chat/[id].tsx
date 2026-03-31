import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'rgb(46, 42, 40)' }} edges={['bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: 'rgb(230, 222, 216)' }}>Chat</Text>
        <Text style={{ fontSize: 15, color: 'rgb(148, 144, 141)', marginTop: 8 }}>Select a session or start a new one</Text>
      </View>
    </SafeAreaView>
  );
}
