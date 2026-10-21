import React, { useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FotoService } from '../../services/FotoService';
import { espaco, raio, useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Texto } from '../ui/Texto';

/**
 * Fotos de receitas, exames e laudos de uma consulta.
 * anexos: lista de { id?, uri, privado }. Cada foto pode ser marcada como privada.
 */
export function AnexosPicker({ anexos, aoMudar }) {
  const { paleta } = useTheme();
  const [ocupado, setOcupado] = useState(false);

  async function adicionar(origem) {
    setOcupado(true);
    try {
      const r = await FotoService.escolherAnexo(origem);
      if (r.tipo === 'ok') aoMudar([...anexos, { uri: r.uri, privado: false }]);
      if (r.tipo === 'sem-permissao') {
        Alert.alert(
          'Precisamos da câmera',
          'Para fotografar o documento, permita o uso da câmera nas configurações do celular. Você também pode escolher da galeria.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ],
        );
      }
    } catch {
      Alert.alert('Não foi possível usar a foto', 'Tente de novo ou escolha outra imagem.');
    } finally {
      setOcupado(false);
    }
  }

  const alterar = (indice, mudanca) =>
    aoMudar(anexos.map((a, i) => (i === indice ? { ...a, ...mudanca } : a)));
  const remover = (indice) => aoMudar(anexos.filter((_, i) => i !== indice));

  return (
    <View style={{ gap: espaco.md }}>
      {anexos.map((a, i) => (
        <View
          key={a.id ?? `${a.uri}-${i}`}
          style={[styles.item, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}
        >
          <Image
            source={{ uri: a.uri }}
            accessibilityRole="image"
            accessibilityLabel={`Anexo ${i + 1}`}
            style={[styles.miniatura, { backgroundColor: paleta.linha }]}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.linhaPrivado}>
              <Texto variante="rotulo" style={{ flex: 1 }}>
                Privado
              </Texto>
              <Switch
                value={a.privado}
                onValueChange={(v) => alterar(i, { privado: v })}
                accessibilityLabel={`Anexo ${i + 1} privado`}
                trackColor={{ false: paleta.campo, true: paleta.primario }}
                thumbColor={paleta.cartao}
              />
            </View>
            <Texto variante="legenda">{a.privado ? 'Só neste aparelho.' : 'Pode ser compartilhado.'}</Texto>
          </View>
          <Pressable
            onPress={() => remover(i)}
            accessibilityRole="button"
            accessibilityLabel={`Remover anexo ${i + 1}`}
            style={styles.remover}
          >
            <Ionicons name="close-circle" size={26} color={paleta.textoSuave} />
          </Pressable>
        </View>
      ))}
      <View style={styles.botoes}>
        <Button
          titulo="Câmera"
          icone="camera-outline"
          variante="secundario"
          larguraTotal={false}
          desabilitado={ocupado}
          aoPressionar={() => adicionar('camera')}
          style={{ flex: 1 }}
        />
        <Button
          titulo="Galeria"
          icone="images-outline"
          variante="secundario"
          larguraTotal={false}
          desabilitado={ocupado}
          aoPressionar={() => adicionar('galeria')}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    borderWidth: 1,
    borderRadius: raio.md,
    padding: espaco.sm,
  },
  miniatura: { width: 72, height: 72, borderRadius: raio.sm },
  linhaPrivado: { flexDirection: 'row', alignItems: 'center' },
  remover: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  botoes: { flexDirection: 'row', gap: espaco.sm },
});
