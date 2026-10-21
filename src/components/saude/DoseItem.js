import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { espaco, useTheme } from '../../theme';
import { formatarDataCurta } from '../../utils/datas';
import { Texto } from '../ui/Texto';

/** Uma dose dentro do cartão: rótulo e data. Toque para editar. */
export function DoseItem({ dose, aoPressionar }) {
  const { paleta } = useTheme();
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={`${dose.rotulo}, ${formatarDataCurta(dose.dataAplicacao)}`}
      accessibilityHint="Abre a dose para editar"
      style={[styles.linha, { borderTopColor: paleta.linha }]}
    >
      <View style={{ flex: 1 }}>
        <Texto variante="corpoMedio">{dose.rotulo}</Texto>
        {dose.lote ? <Texto variante="legenda">Lote {dose.lote}</Texto> : null}
      </View>
      <Texto variante="legenda">{formatarDataCurta(dose.dataAplicacao)}</Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingHorizontal: espaco.lg,
    paddingVertical: espaco.sm,
    borderTopWidth: 1,
  },
});
