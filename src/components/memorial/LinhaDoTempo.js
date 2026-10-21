import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { espaco, useTheme } from '../../theme';
import { formatarDataCurta } from '../../utils/datas';
import { Texto } from '../ui/Texto';

/** Linha do tempo do memorial. Toque em um momento para editar. */
export function LinhaDoTempo({ marcos, aoAbrir }) {
  const { paleta } = useTheme();
  return (
    <View>
      {marcos.map((m, i) => (
        <Pressable
          key={m.id}
          onPress={() => aoAbrir(m)}
          accessibilityRole="button"
          accessibilityLabel={`${m.titulo}, ${m.data ? formatarDataCurta(m.data) : 'sem data'}`}
          accessibilityHint="Abre a lembrança para editar"
          style={styles.item}
        >
          <View style={styles.trilho}>
            <View style={[styles.ponto, { backgroundColor: paleta.primario }]} />
            {i < marcos.length - 1 ? (
              <View style={[styles.linha, { backgroundColor: paleta.linha }]} />
            ) : null}
          </View>
          <View style={{ flex: 1, paddingBottom: espaco.md }}>
            <Texto variante="corpoMedio">{m.titulo}</Texto>
            <Texto variante="legenda">{m.data ? formatarDataCurta(m.data) : 'Sem data'}</Texto>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: espaco.md, minHeight: 56 },
  trilho: { alignItems: 'center', width: 14, paddingTop: 6 },
  ponto: { width: 12, height: 12, borderRadius: 6 },
  linha: { width: 2, flex: 1, marginTop: 4 },
});
