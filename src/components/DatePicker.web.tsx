import React, { useEffect, useRef } from 'react';

type Props = {
  value: string;
  visible: boolean;
  onChange: (iso: string) => void;
  onDismiss?: () => void;
};

// Web version of DatePicker — the @react-native-community/datetimepicker
// package has no usable web implementation, so we drop down to a native
// <input type="date"> and trigger its browser-owned picker via showPicker().
// The input itself is visually hidden; the Pressable trigger in the parent
// sheet sets visible=true to pop the picker.
export function DatePicker({ value, visible, onChange, onDismiss }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const wasVisible = useRef(false);

  useEffect(() => {
    // Only react on the false → true transition so re-renders don't re-open
    // the picker after the user has already dismissed/selected.
    if (visible && !wasVisible.current) {
      const input = ref.current;
      if (input) {
        input.value = value;
        const maybeShow = (input as HTMLInputElement & { showPicker?: () => void }).showPicker;
        try {
          if (typeof maybeShow === 'function') maybeShow.call(input);
          else input.click();
        } catch {
          input.focus();
        }
      }
      onDismiss?.();
    }
    wasVisible.current = visible;
  }, [visible, value, onDismiss]);

  return (
    <input
      ref={ref}
      type="date"
      defaultValue={value}
      style={{
        position: 'absolute',
        opacity: 0,
        pointerEvents: 'none',
        width: 1,
        height: 1,
        border: 'none',
        padding: 0,
        margin: 0,
      }}
      onChange={(e) => {
        const v = e.currentTarget.value;
        if (v) onChange(v);
      }}
    />
  );
}
