import { Pressable, View, Text, type PressableProps } from 'react-native';

interface ListItemProps extends Omit<PressableProps, 'children'> {
  title: string;
  subtitle?: string;
  showChevron?: boolean;
}

export function ListItem({ title, subtitle, showChevron = true, className = '', ...props }: ListItemProps) {
  return (
    <Pressable
      className={`min-h-[56px] px-4 py-4 bg-surface-base border-b border-border-subtle flex-row items-center ${className}`}
      style={({ pressed }) => ({
        backgroundColor: pressed ? 'rgb(54, 50, 48)' : 'rgb(46, 42, 40)',
      })}
      {...props}
    >
      <View className="flex-1">
        <Text className="text-base font-semibold text-text-primary">{title}</Text>
        {subtitle && (
          <Text className="text-xs text-text-secondary mt-1">{subtitle}</Text>
        )}
      </View>
      {showChevron && (
        <Text className="text-text-muted text-base ml-2">{'>'}</Text>
      )}
    </Pressable>
  );
}
