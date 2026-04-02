import { Stack } from 'expo-router';

export default function StackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'rgb(38, 35, 33)' },
        headerTintColor: 'rgb(230, 222, 216)',
        headerTitleStyle: { fontWeight: '600' },
      }}
    />
  );
}
