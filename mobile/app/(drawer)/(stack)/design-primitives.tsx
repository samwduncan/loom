import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { SurfaceCard } from '../../../components/primitives/SurfaceCard';
import { LoomText } from '../../../components/primitives/TextHierarchy';
import { Button } from '../../../components/primitives/Button';
import { ListItem } from '../../../components/primitives/ListItem';
import { GlassSurface } from '../../../components/primitives/GlassSurface';

export default function DesignPrimitivesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface-base" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Design Primitives' }} />
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 24 }}>
        {/* Heading */}
        <LoomText variant="heading" className="mb-2">Design Primitives</LoomText>
        <LoomText variant="body" className="mb-6 text-text-muted">
          Validating typography, color, spacing, depth, and blur
        </LoomText>

        {/* Section: Typography */}
        <LoomText variant="caption" className="mb-2 uppercase tracking-wider">Typography</LoomText>
        <SurfaceCard className="mb-4">
          <LoomText variant="heading" className="mb-2">Heading (17px/600)</LoomText>
          <LoomText variant="body" className="mb-2">Body text at 15px with regular weight. This demonstrates the primary reading size for chat messages and content.</LoomText>
          <LoomText variant="caption" className="mb-2">Caption at 12px -- timestamps, metadata, labels</LoomText>
          <LoomText variant="code">const code = 'JetBrains Mono 14px';</LoomText>
        </SurfaceCard>

        {/* Section: Buttons */}
        <LoomText variant="caption" className="mb-2 uppercase tracking-wider">Buttons</LoomText>
        <SurfaceCard className="mb-4 gap-3">
          <Button title="Primary Action" variant="primary" />
          <Button title="Secondary Action" variant="secondary" />
          <Button title="Disabled" variant="primary" disabled />
        </SurfaceCard>

        {/* Section: List Items */}
        <LoomText variant="caption" className="mb-2 uppercase tracking-wider">List Items</LoomText>
        <View className="mb-4 rounded-xl overflow-hidden border border-border-subtle">
          <ListItem title="Session: API Refactor" subtitle="2 minutes ago" />
          <ListItem title="Session: Bug Fix #42" subtitle="1 hour ago" />
          <ListItem title="Session: Design Review" subtitle="Yesterday" showChevron={false} />
        </View>

        {/* Section: Glass Surface */}
        <LoomText variant="caption" className="mb-2 uppercase tracking-wider">Glass / Blur</LoomText>
        <GlassSurface className="mb-4 p-4">
          <LoomText variant="heading" className="mb-1">Glass Surface</LoomText>
          <LoomText variant="body">Content behind a blur layer with dark tint overlay. Used for navigation headers, modal backdrops, and floating composer.</LoomText>
        </GlassSurface>

        {/* Section: Color Palette */}
        <LoomText variant="caption" className="mb-2 uppercase tracking-wider">Surfaces</LoomText>
        <View className="gap-2 mb-4">
          <View className="bg-surface-sunken p-3 rounded-lg">
            <LoomText variant="caption">surface-sunken</LoomText>
          </View>
          <View className="bg-surface-base p-3 rounded-lg border border-border-subtle">
            <LoomText variant="caption">surface-base</LoomText>
          </View>
          <View className="bg-surface-raised p-3 rounded-lg">
            <LoomText variant="caption">surface-raised</LoomText>
          </View>
          <View className="bg-surface-overlay p-3 rounded-lg">
            <LoomText variant="caption">surface-overlay</LoomText>
          </View>
        </View>

        {/* Spacing bottom */}
        <View className="h-12" />
      </ScrollView>
    </SafeAreaView>
  );
}
