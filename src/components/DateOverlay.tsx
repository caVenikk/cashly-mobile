import React from 'react';

type Props = {
  value: string;
  onChange: (iso: string) => void;
};

// Native no-op. The .web.tsx counterpart renders a transparent
// <input type="date"> that overlays the parent trigger — iOS Safari opens
// its native date picker from a direct tap on the input, which is more
// reliable than showPicker() whose user-activation check fails on iOS PWA.
export function DateOverlay(_: Props): React.ReactElement | null {
  return null;
}
