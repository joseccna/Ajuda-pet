import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { espaco, useTheme } from '../../theme';
import { Texto } from './Texto';

/**
 * Selo de situação: em-dia, em-breve, atrasada ou sem-previsao.
 * Sempre tem ícone e texto, para a cor não ser o único sinal.
 */
export function SituacaoBadge({ estado, texto }) {
  const { paleta } = useTheme();
  const cfg = {
    atrasada: { fundo: paleta.primarioSuave, cor: paleta.primarioTexto, icone: 'alert-circle' },
    'em-breve': { fundo: paleta.avisoSuave, cor: paleta.aviso, icone: 'time-outline' },
    'em-dia': { fundo: paleta.destaqueSuave, cor: paleta.destaque, icone: 'checkmark-circle' },
    'sem-previsao': { fundo: paleta.linha, cor: paleta.textoSuave, icone: 'remove-circle-outline' },
  }[estado];

  return (
    <View style={[styles.selo, { backgroundColor: cfg.fundo }]}>
      <Ionicons name={cfg.icone} size={16} color={cfg.cor} />
      <Texto variante="rotulo" style={{ color: cfg.cor }}>
        {texto}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    paddingHorizontal: espaco.md,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
});
