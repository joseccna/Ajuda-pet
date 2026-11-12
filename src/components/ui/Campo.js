import React, { useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { useMostrarNaTela } from './Screen';
import { Texto } from './Texto';
/**
 * Campo de texto com rótulo sempre visível, dica e mensagem de erro.
 * Quando aparece um erro, a tela rola até o campo: num formulário longo, quem tocou em
 * "Salvar" lá embaixo vê o que precisa corrigir.
 * O placeholder é mostrado como exemplo ("Ex.: Thor"), para não parecer um valor já preenchido.
 * Use guia quando o texto cinza não é um exemplo (uma instrução ou um valor calculado).
 */
export function Campo({ rotulo, obrigatorio, dica, erro, multilinha, placeholder, guia, ...resto }) {
  const { paleta } = useTheme();
  const grupo = useRef(null);
  const mostrarNaTela = useMostrarNaTela();
  useEffect(() => {
    if (erro && mostrarNaTela) mostrarNaTela(grupo);
  }, [erro, mostrarNaTela]);
  return (
    <View ref={grupo} collapsable={false} style={styles.grupo}>
      <Texto variante="rotulo">
        {rotulo}
        {obrigatorio ? <Texto variante="legenda"> (obrigatório)</Texto> : null}
      </Texto>
      <TextInput
        {...resto}
        placeholder={placeholder && !guia ? `Ex.: ${placeholder}` : placeholder}
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
