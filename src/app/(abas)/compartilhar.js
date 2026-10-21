import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AvisoBackup } from '../../components/backup/AvisoBackup';
import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { Texto } from '../../components/ui/Texto';
import { useSituacaoBackup } from '../../hooks/useBackup';
import { espaco, useTheme } from '../../theme';

function Opcao({ icone, titulo, texto, aoPressionar, emBreve }) {
  const { paleta } = useTheme();
  return (
    <Card
      aoPressionar={emBreve ? undefined : aoPressionar}
      rotuloAcessibilidade={emBreve ? undefined : `${titulo}. ${texto}`}
      style={[styles.opcao, emBreve && { opacity: 0.6 }]}
    >
      <View style={[styles.icone, { backgroundColor: paleta.primarioSuave }]}>
        <Ionicons name={icone} size={24} color={paleta.primarioTexto} />
      </View>
      <View
        style={{ flex: 1 }}
        accessible={emBreve}
        accessibilityLabel={emBreve ? `${titulo}, em breve. ${texto}` : undefined}
      >
        <Texto variante="corpoMedio">
          {titulo}
          {emBreve ? '  (em breve)' : ''}
        </Texto>
        <Texto variante="legenda">{texto}</Texto>
      </View>
      {emBreve ? null : <Ionicons name="chevron-forward" size={22} color={paleta.textoSuave} />}
    </Card>
  );
}

/** Central de backup, ficha do pet e importação. */
export default function TelaCompartilhar() {
  const router = useRouter();
  const situacao = useSituacaoBackup();
  return (
    <Screen bordas={['top', 'left', 'right']}>
      <Texto variante="titulo" accessibilityRole="header" style={{ marginBottom: espaco.lg }}>
        Compartilhar e backup
      </Texto>
      <AvisoBackup situacao={situacao} aoFazer={() => router.push('/backup')} />

      <Opcao
        icone="save-outline"
        titulo="Fazer backup"
        texto="Guarda tudo em um arquivo, para trocar de celular ou se algo der errado."
        aoPressionar={() => router.push('/backup')}
      />
      <Opcao
        icone="document-text-outline"
        titulo="Ficha do pet"
        texto="Para o veterinário, hotel ou pet sitter. Você escolhe o que mostrar."
        aoPressionar={() => router.push('/ficha')}
      />
      <Opcao
        icone="download-outline"
        titulo="Abrir um arquivo recebido"
        texto="Restaura um backup ou adiciona a ficha de um pet. Mostra uma prévia antes."
        aoPressionar={() => router.push('/importar')}
      />
      <Opcao
        icone="people-outline"
        titulo="Cuidar junto"
        texto="Dividir os cuidados com outra pessoa, direto entre os celulares."
        emBreve
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  opcao: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  icone: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
