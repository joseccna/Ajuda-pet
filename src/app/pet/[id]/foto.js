import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { Campo } from '../../../components/ui/Campo';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { Texto } from '../../../components/ui/Texto';
import { usePet } from '../../../hooks/usePet';
import { galeriaService } from '../../../services/GaleriaService';
import { espaco, raio, useTheme } from '../../../theme';
import { tituloDoDia } from '../../../utils/datas';

/** Uma foto da galeria, em tamanho grande, com legenda, capa, compartilhar e excluir. */
export default function FotoDoPet() {
  const router = useRouter();
  const { paleta } = useTheme();
  const { id, fotoId } = useLocalSearchParams();
  const { pet } = usePet(id);
  const [foto, setFoto] = useState(() => galeriaService.buscar(fotoId));
  const [legenda, setLegenda] = useState(foto?.legenda ?? '');
  const [capa, setCapa] = useState(() => (foto ? galeriaService.ehCapa(foto) : false));
  const [podeCompartilhar, setPodeCompartilhar] = useState(false);

  useEffect(() => {
    let ativo = true;
    try {
      const Sharing = require('expo-sharing');
      Sharing.isAvailableAsync().then((ok) => ativo && setPodeCompartilhar(Boolean(ok)));
    } catch {
      // Sem compartilhamento neste ambiente: o botão não aparece.
    }
    return () => {
      ativo = false;
    };
  }, []);

  if (!foto) {
    return (
      <Screen>
        <Cabecalho titulo="Foto" aoVoltar={() => router.back()} />
        <EstadoVazio
          icone="help-circle-outline"
          titulo="Foto não encontrada"
          texto="Ela pode ter sido excluída."
        />
      </Screen>
    );
  }

  const salvarLegenda = () => {
    if (legenda.trim() !== foto.legenda) setFoto(galeriaService.atualizarLegenda(foto.id, legenda));
  };

  function definirCapa() {
    galeriaService.definirCapa(foto.id);
    setCapa(true);
  }

  async function compartilhar() {
    try {
      await require('expo-sharing').shareAsync(foto.uri);
    } catch {
      Alert.alert('Não foi possível compartilhar', 'Tente de novo.');
    }
  }

  function excluir() {
    Alert.alert(
      'Excluir esta foto?',
      capa
        ? `Ela é a foto de capa: ${pet?.nome ?? 'o pet'} ficará sem foto. Não dá para desfazer.`
        : 'Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            galeriaService.excluir([foto.id]);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Cabecalho titulo={pet ? `Foto ${pet.deNome}` : 'Foto'} aoVoltar={() => router.back()} />
      <View style={[styles.moldura, { backgroundColor: paleta.linha }]}>
        <Image
          source={{ uri: foto.uri }}
          resizeMode="contain"
          style={styles.imagem}
          accessibilityRole="image"
          accessibilityLabel={`Foto ${pet?.deNome ?? ''}, ${tituloDoDia(foto.data)}${foto.legenda ? `, ${foto.legenda}` : ''}`}
        />
      </View>
      <Texto variante="legenda" style={{ marginBottom: espaco.lg }}>
        {tituloDoDia(foto.data)}
        {capa ? ', foto de capa' : ''}
      </Texto>

      <Campo
        rotulo="Legenda"
        placeholder="Primeiro dia na praia"
        value={legenda}
        onChangeText={setLegenda}
        onBlur={salvarLegenda}
        maxLength={120}
        dica="Opcional. Salva ao sair do campo."
      />

      <View style={{ gap: espaco.sm }}>
        {!capa ? (
          <Button
            titulo="Definir como capa"
            icone="star-outline"
            variante="secundario"
            aoPressionar={definirCapa}
          />
        ) : null}
        {podeCompartilhar ? (
          <Button
            titulo="Compartilhar"
            icone="share-social-outline"
            variante="secundario"
            aoPressionar={compartilhar}
          />
        ) : null}
        <Button titulo="Excluir foto" variante="perigo" aoPressionar={excluir} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  moldura: { borderRadius: raio.lg, overflow: 'hidden', marginBottom: espaco.md },
  imagem: { width: '100%', height: 360 },
});
