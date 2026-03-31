import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'rgb(46, 42, 40)' }} edges={['bottom']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: 'rgb(230, 222, 216)' }}>Settings</Text>
        <Text style={{ fontSize: 15, color: 'rgb(148, 144, 141)', marginTop: 8 }}>Server and model configuration -- Phase 70</Text>
      </View>
    </SafeAreaView>
  );
}
