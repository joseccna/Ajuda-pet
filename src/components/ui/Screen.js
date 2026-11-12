import React from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { espaco, useTheme } from '../../theme';
/**
 * Base de toda tela: fundo do tema, área segura, rolagem e teclado.
 * No Android o app é edge-to-edge e a janela não encolhe com o teclado, então o
 * KeyboardAvoidingView precisa de behavior "padding" também ali (guia de teclado do Expo).
 * rolagemRef (opcional) dá acesso à rolagem, por exemplo para voltar ao topo e mostrar um aviso.
 */
export function Screen({ children, rolavel = true, bordas = ['top', 'left', 'right', 'bottom'], rolagemRef }) {
  const { paleta } = useTheme();
  return (
    <SafeAreaView edges={bordas} style={[styles.raiz, { backgroundColor: paleta.fundo }]}>
      <KeyboardAvoidingView style={styles.raiz} behavior="padding">
        {rolavel ? (
          <ScrollView
            ref={rolagemRef}
            contentContainerStyle={styles.conteudo}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.conteudo}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: espaco.lg, paddingBottom: espaco.xxl, flexGrow: 1 },
});
