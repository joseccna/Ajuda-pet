import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { espaco, raio, useTheme } from '../../theme';
/** Base visual de todos os cartões. Mudou aqui, mudou no app inteiro. */
export function Card({ children, aoPressionar, rotuloAcessibilidade, dicaAcessibilidade, style }) {
  const { paleta } = useTheme();
  const base = [styles.card, { backgroundColor: paleta.cartao, borderColor: paleta.linha }, style];
  if (!aoPressionar) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessibilidade}
      accessibilityHint={dicaAcessibilidade}
      style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}
    >
      {children}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.lg,
    marginBottom: espaco.md,
  },
});
