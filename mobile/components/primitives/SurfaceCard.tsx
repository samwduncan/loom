import { View, type ViewProps } from 'react-native';

interface SurfaceCardProps extends ViewProps {
  children: React.ReactNode;
}

export function SurfaceCard({ children, className = '', ...props }: SurfaceCardProps) {
  return (
    <View
      className={`bg-surface-raised border border-border-subtle rounded-xl p-4 shadow-md ${className}`}
      style={{
        // iOS shadow (NativeWind shadow-md may not map perfectly on RN)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
      {...props}
    >
      {children}
    </View>
  );
}
