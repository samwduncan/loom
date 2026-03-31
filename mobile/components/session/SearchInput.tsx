/**
 * Session search input -- glass expanding search per Soul doc.
 *
 * Collapsed: magnifying glass icon + "Search" text (12px, muted).
 * Expanded: full-width input with glass background (GlassSurface),
 * rounded-2xl, magnifying glass left, "Cancel" button right.
 * Expand/collapse with Standard spring.
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Search } from 'lucide-react-native';
import { GlassSurface } from '../primitives/GlassSurface';
import { SPRING } from '../../lib/springs';
import { ACCENT } from '../../lib/colors';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchInput({ value, onChangeText }: SearchInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animated height for expand/collapse
  const expandProgress = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    height: 36 + expandProgress.value * 8, // 36px collapsed, 44px expanded
    opacity: 0.6 + expandProgress.value * 0.4,
  }));

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    expandProgress.value = withSpring(1, SPRING.standard);
    // Focus input after layout
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [expandProgress]);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    expandProgress.value = withSpring(0, SPRING.standard);
    onChangeText('');
    inputRef.current?.blur();
  }, [expandProgress, onChangeText]);

  if (!isExpanded) {
    return (
      <Pressable
        onPress={handleExpand}
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
          height: 36,
          paddingHorizontal: 12,
          borderRadius: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <Search size={16} color="rgb(148, 144, 141)" />
        <Text
          style={{
            fontSize: 12,
            color: 'rgb(148, 144, 141)',
            marginLeft: 8,
          }}
        >
          Search
        </Text>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[{ marginHorizontal: 16, marginTop: 12 }, containerStyle]}>
      <GlassSurface
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          borderRadius: 16,
          flex: 1,
        }}
      >
        <Search size={16} color="rgb(148, 144, 141)" />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder="Search sessions"
          placeholderTextColor="rgb(148, 144, 141)"
          style={{
            flex: 1,
            fontSize: 15,
            color: 'rgb(230, 222, 216)',
            marginLeft: 8,
            paddingVertical: 8,
          }}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          onPress={handleCollapse}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 8 }}
        >
          <Text style={{ fontSize: 12, color: ACCENT }}>Cancel</Text>
        </Pressable>
      </GlassSurface>
    </Animated.View>
  );
}
