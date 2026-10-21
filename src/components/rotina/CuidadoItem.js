import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALVO_MINIMO, espaco, useTheme } from '../../theme';
import { SituacaoBadge } from '../ui/SituacaoBadge';
import { Texto } from '../ui/Texto';

/** Uma linha de cuidado: ícone, nome, última vez, situação e o botão "feito hoje". */
export function CuidadoItem({ item, feitoHoje, aoAbrir, aoMarcarFeito, primeiro }) {
  const { paleta } = useTheme();
  const { tipo, situacao, texto, ultimo } = item;
  return (
    <View style={[styles.linha, !primeiro && { borderTopWidth: 1, borderTopColor: paleta.linha }]}>
      <Pressable
        onPress={aoAbrir}
        accessibilityRole="button"
        accessibilityLabel={`${tipo.nome}, ${texto}`}
        accessibilityHint="Abre o histórico do cuidado"
        style={styles.principal}
      >
        <View style={[styles.icone, { backgroundColor: paleta.primarioSuave }]}>
          <Ionicons name={tipo.icone} size={22} color={paleta.primarioTexto} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="corpoMedio">{tipo.nome}</Texto>
          {ultimo ? <Texto variante="legenda">{ultimo}</Texto> : null}
          <SituacaoBadge estado={situacao.estado} texto={texto} />
        </View>
      </Pressable>
      <Pressable
        onPress={aoMarcarFeito}
        disabled={feitoHoje}
        accessibilityRole="button"
        accessibilityLabel={
          feitoHoje ? `${tipo.nome} já registrado hoje` : `Marcar ${tipo.nome} como feito hoje`
        }
        accessibilityState={{ disabled: feitoHoje }}
        style={[
          styles.marcar,
          {
            borderColor: feitoHoje ? paleta.destaque : paleta.campo,
            backgroundColor: feitoHoje ? paleta.destaqueSuave : paleta.cartao,
          },
        ]}
      >
        <Ionicons name="checkmark" size={22} color={feitoHoje ? paleta.destaque : paleta.textoSuave} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, paddingVertical: espaco.md },
  principal: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espaco.md, minHeight: ALVO_MINIMO },
  icone: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  marcar: {
    width: ALVO_MINIMO,
    height: ALVO_MINIMO,
    borderRadius: ALVO_MINIMO / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
