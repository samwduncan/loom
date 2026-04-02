/**
 * EmptyChat -- empty state with avatar, greeting, and suggestion chips.
 *
 * Matches ChatGPT/Claude iOS pattern: centered greeting area with
 * tappable suggestion cards below. Suggestions reduce friction to
 * first message — users tap instead of thinking what to type.
 *
 * Layout:
 *   [avatar 48px]
 *   [model name — 17px semibold secondary]
 *   [greeting — 15px primary]
 *   [project — 12px muted]
 *   [suggestion grid — 2 columns, tappable cards]
 */

import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MessageSquare, Code, Lightbulb, FileText } from 'lucide-react-native';
import { ProviderAvatar } from '../chat/ProviderAvatar';
import { LoomText } from '../primitives/TextHierarchy';
import { SURFACE, ACCENT } from '../../lib/colors';

interface EmptyChatProps {
  modelName?: string;
  projectName?: string;
  onSuggestion?: (text: string) => void;
}

const SUGGESTIONS = [
  { icon: Lightbulb, text: 'Explain a concept', prompt: 'Explain ' },
  { icon: Code, text: 'Help me write code', prompt: 'Write a function that ' },
  { icon: MessageSquare, text: 'Brainstorm ideas', prompt: 'Help me brainstorm ideas for ' },
  { icon: FileText, text: 'Summarize something', prompt: 'Summarize ' },
];

export function EmptyChat({ modelName = 'Claude', projectName, onSuggestion }: EmptyChatProps) {
  return (
    <View style={styles.container}>
      {/* Greeting section — vertically centered in upper portion */}
      <View style={styles.greetingArea}>
        <Animated.View
          entering={FadeInDown.springify().damping(20).stiffness(150).mass(1.0)}
          style={styles.greeting}
        >
          <ProviderAvatar provider="claude" size={48} />
          <LoomText variant="body" style={styles.modelName}>
            {modelName}
          </LoomText>
          <LoomText variant="body" style={styles.helpText}>
            How can I help?
          </LoomText>
          {projectName ? (
            <LoomText variant="caption" style={styles.projectName}>
              {projectName}
            </LoomText>
          ) : null}
        </Animated.View>
      </View>

      {/* Suggestion chips — 2-column grid */}
      <View style={styles.suggestionsArea}>
        <View style={styles.suggestionsGrid}>
          {SUGGESTIONS.map((suggestion, i) => {
            const Icon = suggestion.icon;
            return (
              <Animated.View
                key={suggestion.text}
                entering={FadeInUp
                  .springify()
                  .damping(18)
                  .stiffness(120)
                  .delay(80 + i * 60)}
                style={styles.chipWrapper}
              >
                <Pressable
                  onPress={() => onSuggestion?.(suggestion.prompt)}
                  style={({ pressed }) => [
                    styles.chip,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Icon size={16} color={ACCENT} strokeWidth={2} />
                  <LoomText variant="caption" style={styles.chipText}>
                    {suggestion.text}
                  </LoomText>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greetingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  greeting: {
    alignItems: 'center',
  },
  modelName: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '600',
    color: 'rgb(191, 186, 182)',
  },
  helpText: {
    marginTop: 6,
    fontSize: 15,
    color: 'rgb(230, 222, 216)',
  },
  projectName: {
    marginTop: 12,
    color: 'rgb(148, 144, 141)',
  },
  suggestionsArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipWrapper: {
    width: '48%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SURFACE.raised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  chipPressed: {
    backgroundColor: SURFACE.overlay,
  },
  chipText: {
    flex: 1,
    fontSize: 13,
    color: 'rgb(200, 195, 190)',
  },
});
