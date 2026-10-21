import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { espaco, raio, useTheme } from '../../theme';
import { Texto } from '../ui/Texto';

/** Atalho rápido do painel: ícone e uma ação curta. */
export function AtalhoTile({ rotulo, icone, aoPressionar }) {
  const { paleta } = useTheme();
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: paleta.cartao, borderColor: paleta.linha },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.icone, { backgroundColor: paleta.primarioSuave }]}>
        <Ionicons name={icone} size={22} color={paleta.primarioTexto} />
      </View>
      <Texto variante="corpoMedio" style={{ flex: 1, fontSize: 15, lineHeight: 20 }}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.sm,
    borderWidth: 1,
    borderRadius: raio.md,
  },
  icone: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
