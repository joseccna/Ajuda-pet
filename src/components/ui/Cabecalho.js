import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALVO_MINIMO, espaco, useTheme } from '../../theme';
import { Texto } from './Texto';
/** Barra de topo das telas: botão de voltar ou fechar, título e uma ação opcional. */
export function Cabecalho({ titulo, aoVoltar, icone = 'voltar', direita }) {
  const { paleta } = useTheme();
  return (
    <View style={styles.barra}>
      {aoVoltar ? (
        <Pressable
          onPress={aoVoltar}
          accessibilityRole="button"
          accessibilityLabel={icone === 'fechar' ? 'Fechar' : 'Voltar'}
          style={[styles.botao, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}
        >
          <Ionicons name={icone === 'fechar' ? 'close' : 'chevron-back'} size={24} color={paleta.texto} />
        </Pressable>
      ) : (
        <View style={styles.botao} />
      )}
      <Texto variante="subtitulo" style={styles.titulo} accessibilityRole="header" numberOfLines={1}>
        {titulo}
      </Texto>
      {direita ? (
        <Pressable
          onPress={direita.aoPressionar}
          accessibilityRole="button"
          accessibilityLabel={direita.rotulo}
          style={[styles.botao, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}
        >
          <Ionicons name={direita.icone} size={22} color={paleta.texto} />
        </Pressable>
      ) : (
        <View style={styles.botao} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espaco.lg,
    minHeight: ALVO_MINIMO,
  },
  botao: {
    width: ALVO_MINIMO,
    height: ALVO_MINIMO,
    borderRadius: ALVO_MINIMO / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  titulo: { flex: 1, textAlign: 'center', marginHorizontal: espaco.sm },
});
