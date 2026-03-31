import { View, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassSurfaceProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export function GlassSurface({ children, intensity = 40, className = '', ...props }: GlassSurfaceProps) {
  return (
    <View className={`overflow-hidden rounded-2xl border border-border-subtle ${className}`} {...props}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.35)' }}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}
