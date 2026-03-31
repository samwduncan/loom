import '../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'rgb(46, 42, 40)' }}>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: 'rgb(38, 35, 33)',
            width: 280,
          },
          sceneStyle: {
            backgroundColor: 'rgb(46, 42, 40)',
          },
        }}
      >
        <Drawer.Screen name="(drawer)" options={{ headerShown: false }} />
        <Drawer.Screen
          name="(stack)"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
