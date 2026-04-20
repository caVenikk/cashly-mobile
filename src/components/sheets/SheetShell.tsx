import React, { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useTokens } from '@/src/lib/themeMode';

type Props = {
  open: boolean;
  onClose: () => void;
  snapPoints?: (string | number)[];
  children: ReactNode;
  enableDynamicSizing?: boolean;
};

export function SheetShell({ open, onClose, snapPoints, children, enableDynamicSizing = false }: Props) {
  const { dark } = useTokens();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (open) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [open]);

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.55} />
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={enableDynamicSizing ? undefined : (snapPoints ?? ['82%'])}
      enableDynamicSizing={enableDynamicSizing}
      onDismiss={onClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)', width: 38 }}
      backgroundStyle={{
        backgroundColor: dark ? 'rgba(24,24,30,0.95)' : 'rgba(245,245,250,0.96)',
        borderTopLeftRadius: 34,
        borderTopRightRadius: 34,
      }}
    >
      <View style={styles.root}>{children}</View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column',
  },
});
