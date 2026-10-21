import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALVO_MINIMO, espaco, raio, useTheme } from '../../theme';
import { Texto } from './Texto';
/** Bloco que abre e fecha, para guardar o que é opcional sem poluir a tela. */
export function SecaoRecolhivel({ titulo, subtitulo, abertaInicialmente = false, children }) {
  const { paleta } = useTheme();
  const [aberta, setAberta] = useState(abertaInicialmente);
  return (
    <View style={[styles.caixa, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}>
      <Pressable
        onPress={() => setAberta((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={titulo}
        accessibilityState={{ expanded: aberta }}
        style={styles.cabecalho}
      >
        <View style={{ flex: 1 }}>
          <Texto variante="corpoMedio">{titulo}</Texto>
          {subtitulo ? <Texto variante="legenda">{subtitulo}</Texto> : null}
        </View>
        <Texto variante="legenda">Opcional</Texto>
        <Ionicons name={aberta ? 'chevron-up' : 'chevron-down'} size={20} color={paleta.textoSuave} />
      </Pressable>
      {aberta ? <View style={styles.corpo}>{children}</View> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  caixa: { borderWidth: 1, borderRadius: raio.lg, marginBottom: espaco.lg, overflow: 'hidden' },
  cabecalho: {
    minHeight: ALVO_MINIMO + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.md,
  },
  corpo: { padding: espaco.md, paddingTop: espaco.sm },
});
