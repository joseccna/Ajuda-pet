import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALVO_MINIMO, espaco, useTheme } from '../../theme';
import { Texto } from '../ui/Texto';

/** Uma refeição do dia. Toque para marcar como feita ou desmarcar. */
export function RefeicaoItem({ refeicao, feitaPorVoce, aoAlternar }) {
  const { paleta } = useTheme();
  const { horario, feita, passou } = refeicao;
  const estado = feita
    ? feitaPorVoce
      ? 'Feita por você'
      : 'Feita por outra pessoa'
    : passou
      ? 'Ainda não marcada'
      : 'Pendente';

  return (
    <Pressable
      onPress={aoAlternar}
      accessibilityRole="checkbox"
      accessibilityLabel={`Refeição das ${horario}`}
      accessibilityState={{ checked: feita }}
      accessibilityHint={feita ? 'Toque para desmarcar' : 'Toque para marcar como feita'}
      style={styles.linha}
    >
      <Ionicons
        name={feita ? 'checkmark-circle' : 'ellipse-outline'}
        size={30}
        color={feita ? paleta.destaque : paleta.campo}
      />
      <View style={{ flex: 1 }}>
        <Texto variante="corpoMedio">{horario}</Texto>
        <Texto variante="legenda">{estado}</Texto>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    minHeight: ALVO_MINIMO + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingVertical: espaco.xs,
  },
});
