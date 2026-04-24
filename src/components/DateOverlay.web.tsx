import React from 'react';

type Props = {
  value: string;
  onChange: (iso: string) => void;
};

// Transparent <input type="date"> positioned over the parent trigger. The
// picker is opened by calling showPicker() from the input's own onClick —
// synchronously with the click, so user activation is still fresh. Routing
// through setState → render → useEffect drops activation on iOS Safari/PWA
// and fails silently, which is why the previous approach worked on desktop
// only. react-native-web's View defaults to position:relative, so the
// absolute child fills its Pressable parent.
export function DateOverlay({ value, onChange }: Props) {
  return (
    <input
      type="date"
      value={value || ''}
      onChange={(e) => {
        const v = e.currentTarget.value;
        if (v) onChange(v);
      }}
      onClick={(e) => {
        const input = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
        try {
          input.showPicker?.();
        } catch {
          // Fall back to the browser's default input-tap behaviour.
        }
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer',
        border: 'none',
        padding: 0,
        margin: 0,
        background: 'transparent',
        WebkitAppearance: 'none',
        fontSize: 16,
      }}
    />
  );
}
