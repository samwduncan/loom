import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: 'rgb(38, 35, 33)' },
        headerTintColor: 'rgb(230, 222, 216)',
        drawerStyle: { backgroundColor: 'rgb(38, 35, 33)' },
        drawerActiveTintColor: 'rgb(196, 108, 88)',
        drawerInactiveTintColor: 'rgb(191, 186, 182)',
      }}
    >
      <Drawer.Screen name="index" options={{ title: 'Loom' }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
    </Drawer>
  );
}
