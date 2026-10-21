import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { Texto } from './Texto';
/** Campo de texto com rótulo sempre visível, dica e mensagem de erro. */
export function Campo({ rotulo, obrigatorio, dica, erro, multilinha, ...resto }) {
  const { paleta } = useTheme();
  return (
    <View style={styles.grupo}>
      <Texto variante="rotulo">
        {rotulo}
        {obrigatorio ? <Texto variante="legenda"> (obrigatório)</Texto> : null}
      </Texto>
      <TextInput
        {...resto}
        multiline={multilinha}
        accessibilityLabel={rotulo}
        placeholderTextColor={paleta.textoSuave}
        style={[
          styles.entrada,
          {
            color: paleta.texto,
            backgroundColor: paleta.cartao,
            borderColor: erro ? paleta.erro : paleta.campo,
          },
          multilinha && styles.multilinha,
        ]}
      />
      {erro ? (
        <Texto variante="legenda" cor="erro" accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : dica ? (
        <Texto variante="legenda">{dica}</Texto>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  grupo: { marginBottom: espaco.lg, gap: espaco.xs },
  entrada: {
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
    fontFamily: fontes.corpo,
    fontSize: 16,
  },
  multilinha: { minHeight: 96, textAlignVertical: 'top' },
});
