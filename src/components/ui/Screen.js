import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { espaco, useTheme } from '../../theme';
/** Base de toda tela: fundo do tema, área segura, rolagem e teclado. */
export function Screen({ children, rolavel = true, bordas = ['top', 'left', 'right', 'bottom'] }) {
  const { paleta } = useTheme();
  return (
    <SafeAreaView edges={bordas} style={[styles.raiz, { backgroundColor: paleta.fundo }]}>
      <KeyboardAvoidingView style={styles.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {rolavel ? (
          <ScrollView
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
