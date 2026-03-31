import { Text, type TextProps } from 'react-native';

interface LoomTextProps extends TextProps {
  variant: 'heading' | 'body' | 'caption' | 'code';
  children: React.ReactNode;
}

const variantClasses: Record<LoomTextProps['variant'], string> = {
  heading: 'text-lg font-semibold text-text-primary',   // 17px, 600, primary
  body: 'text-base font-normal text-text-primary',      // 15px, 400, primary
  caption: 'text-xs font-normal text-text-muted',       // 12px, 400, muted
  code: 'text-sm font-mono text-text-primary',          // 14px, 400, JetBrains Mono
};

export function LoomText({ variant, className = '', children, ...props }: LoomTextProps) {
  return (
    <Text className={`${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </Text>
  );
}
