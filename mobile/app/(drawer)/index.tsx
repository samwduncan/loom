import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function SessionListScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'rgb(46, 42, 40)' }} edges={['bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: 'rgb(230, 222, 216)' }}>Loom</Text>
        <Text style={{ fontSize: 15, color: 'rgb(148, 144, 141)', marginTop: 8 }}>No sessions yet</Text>
        <Pressable
          style={({ pressed }) => ({
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: pressed ? 'rgb(62, 59, 56)' : 'rgb(54, 50, 48)',
            borderRadius: 12,
          })}
          onPress={() => router.push('/(stack)/design-primitives')}
        >
          <Text style={{ color: 'rgb(230, 222, 216)', fontSize: 15, textAlign: 'center' }}>
            View Design Primitives
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
