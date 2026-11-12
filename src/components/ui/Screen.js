import React, { createContext, useCallback, useContext, useRef } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { espaco, useTheme } from '../../theme';

const RolagemContext = createContext(null);

/**
 * Pede à tela que role até um elemento (por exemplo, um campo que acabou de ganhar uma mensagem
 * de erro). Fora de uma tela rolável devolve null.
 */
export function useMostrarNaTela() {
  return useContext(RolagemContext);
}

/**
 * Base de toda tela: fundo do tema, área segura, rolagem e teclado.
 * No Android o app é edge-to-edge e a janela não encolhe com o teclado, então o
 * KeyboardAvoidingView precisa de behavior "padding" também ali (guia de teclado do Expo).
 * rolagemRef (opcional) dá acesso à rolagem, por exemplo para voltar ao topo e mostrar um aviso.
 */
export function Screen({ children, rolavel = true, bordas = ['top', 'left', 'right', 'bottom'], rolagemRef }) {
  const { paleta } = useTheme();
  const rolagem = useRef(null);
  const conteudo = useRef(null);
  const pedido = useRef({ y: null, agendado: false });

  const ligarRolagem = useCallback(
    (no) => {
      rolagem.current = no;
      if (rolagemRef) rolagemRef.current = no;
    },
    [rolagemRef],
  );

  // Vários campos podem pedir ao mesmo tempo (vários erros num salvar): a tela vai até o mais acima.
  const mostrar = useCallback((alvo) => {
    if (!alvo?.current || !conteudo.current) return;
    alvo.current.measureLayout(
      conteudo.current,
      (_x, y) => {
        const p = pedido.current;
        if (p.y === null || y < p.y) p.y = y;
        if (p.agendado) return;
        p.agendado = true;
        setTimeout(() => {
          rolagem.current?.scrollTo({ y: Math.max(0, p.y - espaco.xl), animated: true });
          pedido.current = { y: null, agendado: false };
        }, 50);
      },
      () => {},
    );
  }, []);

  return (
    <SafeAreaView edges={bordas} style={[styles.raiz, { backgroundColor: paleta.fundo }]}>
      <KeyboardAvoidingView style={styles.raiz} behavior="padding">
        {rolavel ? (
          <ScrollView
            ref={ligarRolagem}
            contentContainerStyle={styles.conteudo}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <RolagemContext.Provider value={mostrar}>
              <View ref={conteudo} collapsable={false} style={styles.cresce}>
                {children}
              </View>
            </RolagemContext.Provider>
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
  cresce: { flexGrow: 1 },
  conteudo: { padding: espaco.lg, paddingBottom: espaco.xxl, flexGrow: 1 },
});
