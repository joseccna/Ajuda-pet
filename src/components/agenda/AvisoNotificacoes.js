import React from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { espaco, raio, useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Texto } from '../ui/Texto';

/**
 * Convite para ativar as notificações. Só aparece se o recurso existe e ainda não foi permitido.
 * A permissão é pedida aqui, depois de explicar para que serve, e nunca ao abrir o app.
 */
export function AvisoNotificacoes({ estado, aoPedir }) {
  const { paleta } = useTheme();
  if (!estado.disponivel || estado.permitido) return null;

  async function ativar() {
    if (!estado.podePedir) {
      Alert.alert(
        'Ative nas configurações',
        'As notificações estão desligadas para o Ajuda Pet. Ligue nas configurações do celular para receber os lembretes.',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    await aoPedir();
  }

  return (
    <View style={[styles.caixa, { backgroundColor: paleta.destaqueSuave }]}>
      <View style={styles.topo}>
        <Ionicons name="notifications-outline" size={24} color={paleta.destaque} />
        <View style={{ flex: 1 }}>
          <Texto variante="corpoMedio" cor="destaque">
            Receba os lembretes no celular
          </Texto>
          <Texto variante="legenda" cor="destaque">
            O app avisa de vacinas, cuidados e consultas, mesmo sem estar aberto.
          </Texto>
        </View>
      </View>
      <Button titulo="Ativar notificações" variante="secundario" aoPressionar={ativar} />
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { borderRadius: raio.lg, padding: espaco.lg, gap: espaco.md, marginBottom: espaco.lg },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.md },
});
