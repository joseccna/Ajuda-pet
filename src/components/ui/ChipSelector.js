import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ALVO_MINIMO, espaco, fontes, useTheme } from '../../theme';
import { Texto } from './Texto';
/** Escolha de uma opção entre poucas (espécie, sexo...). Anunciado como grupo de opções. */
export function ChipSelector({ rotulo, opcoes, valor, aoMudar, erro }) {
  const { paleta } = useTheme();
  return (
    <View style={styles.grupo}>
      <Texto variante="rotulo">{rotulo}</Texto>
      <View accessibilityRole="radiogroup" accessibilityLabel={rotulo} style={styles.linha}>
        {opcoes.map((o) => {
          const marcado = o.valor === valor;
          return (
            <Pressable
              key={o.valor}
              onPress={() => aoMudar(o.valor)}
              accessibilityRole="radio"
              accessibilityLabel={o.rotulo}
              accessibilityState={{ checked: marcado }}
              style={[
                styles.chip,
                {
                  backgroundColor: marcado ? paleta.primarioSuave : paleta.cartao,
                  borderColor: marcado ? paleta.primario : paleta.campo,
                },
              ]}
            >
              <Texto
                style={{
                  fontFamily: marcado ? fontes.corpoNegrito : fontes.corpoMedio,
                  color: marcado ? paleta.primarioTexto : paleta.texto,
                }}
              >
                {o.rotulo}
              </Texto>
            </Pressable>
          );
        })}
      </View>
      {erro ? (
        <Texto variante="legenda" cor="erro" accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  grupo: { marginBottom: espaco.lg, gap: espaco.sm },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  chip: {
    minHeight: ALVO_MINIMO,
    paddingHorizontal: espaco.lg,
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
});
