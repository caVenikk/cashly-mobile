import React, { forwardRef, useImperativeHandle, useRef } from 'react';

type Props = {
  value: string;
  onChange: (iso: string) => void;
};

export type DatePickerHandle = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

// Web DatePicker: an invisible <input type="date"> whose browser-owned picker
// is opened imperatively via showPicker(). showPicker() requires user
// activation, so the parent must call ref.current.open() synchronously inside
// the onPress handler — routing through state + useEffect loses the gesture
// and the browser silently refuses.
export const DatePicker = forwardRef<DatePickerHandle, Props>(function DatePicker({ value, onChange }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => {
    const open = () => {
      const input = inputRef.current;
      if (!input) return;
      input.value = value;
      const maybeShow = (input as HTMLInputElement & { showPicker?: () => void }).showPicker;
      try {
        if (typeof maybeShow === 'function') maybeShow.call(input);
        else input.click();
      } catch {
        input.focus();
      }
    };
    return { open, close: () => {}, toggle: open };
  }, [value]);

  return (
    <input
      ref={inputRef}
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
});
