import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { espaco } from '../../theme';
import { FotoService } from '../../services/FotoService';
import { Avatar } from './Avatar';
import { Button } from './Button';
/** Foto do pet: tirar na hora, escolher da galeria ou remover. */
export function FotoPicker({ uri, nome, aoMudar }) {
  const [ocupado, setOcupado] = useState(false);
  async function escolher(origem) {
    setOcupado(true);
    try {
      const r = await FotoService.escolher(origem);
      if (r.tipo === 'ok') aoMudar(r.uri);
      if (r.tipo === 'sem-permissao') {
        Alert.alert(
          'Precisamos da câmera',
          'Para tirar a foto, permita o uso da câmera nas configurações do celular. Você também pode escolher uma foto da galeria.',
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
  return (
    <View style={styles.caixa}>
      <Avatar uri={uri} nome={nome || 'Pet'} tamanho={104} />
      <View style={styles.botoes}>
        <Button
          titulo="Câmera"
          icone="camera-outline"
          variante="secundario"
          larguraTotal={false}
          desabilitado={ocupado}
          aoPressionar={() => escolher('camera')}
          style={styles.botao}
        />
        <Button
          titulo="Galeria"
          icone="images-outline"
          variante="secundario"
          larguraTotal={false}
          desabilitado={ocupado}
          aoPressionar={() => escolher('galeria')}
          style={styles.botao}
        />
      </View>
      {uri ? (
        <Button
          titulo="Remover foto"
          variante="texto"
          larguraTotal={false}
          aoPressionar={() => aoMudar(null)}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  caixa: { alignItems: 'center', gap: espaco.md, marginBottom: espaco.xl },
  botoes: { flexDirection: 'row', gap: espaco.sm },
  botao: { minWidth: 130 },
});
