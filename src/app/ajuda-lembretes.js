import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Cabecalho } from '../components/ui/Cabecalho';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { Texto } from '../components/ui/Texto';
import { espaco } from '../theme';

const PASSOS = [
  {
    titulo: '1. Confira as notificações do app',
    texto:
      'Nas configurações do celular, abra Apps, Ajuda Pet, Notificações e deixe tudo ligado. Em Preferências, o app mostra se as notificações estão ativadas.',
  },
  {
    titulo: '2. Libere o app da economia de bateria',
    texto:
      'Muitos celulares, como vivo, Samsung, Xiaomi e Motorola, seguram os avisos até você abrir o app, para economizar bateria. Em Apps, Ajuda Pet, Bateria (na vivo, Energia), escolha "Sem restrições" (na vivo, "Nenhuma restrição").',
  },
  {
    titulo: '3. Não feche o app pela lista de recentes',
    texto:
      'Arrastar o Ajuda Pet para fora da lista de apps recentes, ou usar "Forçar parada", pode cancelar os avisos até você abrir o app de novo.',
  },
  {
    titulo: '4. Confira os modos de foco',
    texto:
      'O "Não perturbe" e os modos de foco silenciam os avisos. Libere o Ajuda Pet nessas listas ou desligue o modo.',
  },
  {
    titulo: '5. Abra o app de vez em quando',
    texto:
      'Toda vez que você abre, o app agenda os avisos dos próximos dias (as refeições, para 7 dias). Se ficar muito tempo sem abrir, os avisos podem acabar.',
  },
];

/** Ajuda curta para quando os lembretes não chegam. */
export default function AjudaLembretes() {
  const router = useRouter();
  return (
    <Screen>
      <Cabecalho titulo="Lembretes não chegam?" aoVoltar={() => router.back()} />
      <Texto variante="legenda" style={{ marginBottom: espaco.lg }}>
        Siga os passos na ordem. Quase sempre o problema é uma configuração do celular.
      </Texto>
      {PASSOS.map((p) => (
        <Card key={p.titulo}>
          <Texto variante="corpoMedio" accessibilityRole="header" style={styles.titulo}>
            {p.titulo}
          </Texto>
          <Texto variante="corpo">{p.texto}</Texto>
        </Card>
      ))}
      <View style={{ marginTop: espaco.sm }}>
        <Button
          titulo="Abrir configurações do celular"
          icone="settings-outline"
          aoPressionar={() => Linking.openSettings()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ titulo: { marginBottom: espaco.xs } });
