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
    titulo: '2. Libere o app da economia de bateria (Android)',
    texto:
      'Alguns celulares, como Samsung, Xiaomi e Motorola, fecham apps para economizar bateria e atrasam os avisos. Em Apps, Ajuda Pet, Bateria, escolha "Sem restrições".',
  },
  {
    titulo: '3. Confira os modos de foco (iPhone e Android)',
    texto:
      'O "Não perturbe" e os modos de foco silenciam os avisos. Libere o Ajuda Pet nessas listas ou desligue o modo.',
  },
  {
    titulo: '4. Abra o app de vez em quando',
    texto:
      'O app agenda os avisos dos próximos 90 dias toda vez que você abre. Se ficar muito tempo sem abrir, os avisos podem acabar.',
  },
  {
    titulo: '5. Testando pelo Expo Go?',
    texto:
      'Em algumas versões do Expo Go no Android as notificações são limitadas. Para testar de verdade, instale uma versão de teste do app (development build).',
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
