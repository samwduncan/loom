import { Pressable, Text, type PressableProps } from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ title, variant = 'primary', disabled = false, className = '', ...props }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      className={`min-h-[44px] px-6 py-4 rounded-xl items-center justify-center ${
        isPrimary ? 'bg-accent' : 'bg-surface-raised'
      } ${disabled ? 'opacity-40' : ''} ${className}`}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: pressed && !disabled ? 0.7 : disabled ? 0.4 : 1,
      })}
      {...props}
    >
      <Text
        className={`font-semibold ${
          isPrimary ? 'text-accent-fg' : 'text-text-primary'
        }`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
