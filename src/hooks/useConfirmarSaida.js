import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';

/**
 * Pergunta antes de sair de um formulário com dados não salvos (botão fechar ou voltar do celular).
 * Chame liberarSaida() logo antes de navegar depois de salvar, para não perguntar à toa.
 */
export function useConfirmarSaida(temAlteracoes) {
  const navigation = useNavigation();
  const saindo = useRef(false);
  const mudou = useRef(temAlteracoes);
  mudou.current = temAlteracoes;

  useEffect(() => {
    return navigation.addListener('beforeRemove', (evento) => {
      if (saindo.current || !mudou.current) return;
      evento.preventDefault();
      Alert.alert('Descartar alterações?', 'O que você preencheu não será salvo.', [
        { text: 'Continuar editando', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            saindo.current = true;
            navigation.dispatch(evento.data.action);
          },
        },
      ]);
    });
  }, [navigation]);

  return {
    liberarSaida: () => {
      saindo.current = true;
    },
  };
}
