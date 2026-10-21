import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ALVO_MINIMO, espaco, fontes, raio, useTheme } from '../../theme';
import { Texto } from './Texto';

/** Alterna entre poucas visões da mesma tela (Vacinas, Peso, Consultas). Um conteúdo por vez. */
export function SegmentedControl({ opcoes, atual, aoMudar, rotulo }) {
  const { paleta } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={rotulo}
      style={[styles.caixa, { backgroundColor: paleta.linha }]}
    >
      {opcoes.map((o) => {
        const ativo = o.chave === atual;
        return (
          <Pressable
            key={o.chave}
            onPress={() => aoMudar(o.chave)}
            accessibilityRole="tab"
            accessibilityLabel={o.rotulo}
            accessibilityState={{ selected: ativo }}
            style={[styles.item, ativo && { backgroundColor: paleta.cartao }]}
          >
            <Texto
              style={{
                fontSize: 14,
                fontFamily: ativo ? fontes.corpoNegrito : fontes.corpoMedio,
                color: ativo ? paleta.primarioTexto : paleta.textoSuave,
              }}
            >
              {o.rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { flexDirection: 'row', borderRadius: raio.md, padding: 4, gap: 4, marginBottom: espaco.lg },
  item: {
    flex: 1,
    minHeight: ALVO_MINIMO,
    borderRadius: raio.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
