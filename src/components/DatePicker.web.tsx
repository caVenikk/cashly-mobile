import { forwardRef, useImperativeHandle } from 'react';

type Props = {
  value: string;
  onChange: (iso: string) => void;
};

export type DatePickerHandle = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

// Web no-op. The actual picker is a transparent <input type="date"> overlaid
// on the trigger (DateOverlay). The ref handle stays for API parity with the
// native version; open/close/toggle do nothing on web — the browser's native
// picker opens from a direct tap on the overlaid input.
export const DatePicker = forwardRef<DatePickerHandle, Props>(function DatePicker(_props, ref) {
  useImperativeHandle(
    ref,
    () => ({
      open: () => {},
      close: () => {},
      toggle: () => {},
    }),
    [],
  );
  return null;
});
