import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinhaDoTempo } from '../../../components/memorial/LinhaDoTempo';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { Card } from '../../../components/ui/Card';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { SecaoRecolhivel } from '../../../components/ui/SecaoRecolhivel';
import { Texto } from '../../../components/ui/Texto';
import { useMemorial } from '../../../hooks/useMemorial';
import { tamanhoDoQuadrado, contarFotos } from '../../../models/regrasFotos';
import { descreverVida, textoParaCompartilhar } from '../../../models/regrasMemorial';
import { memorialService } from '../../../services/MemorialService';
import { petService } from '../../../services/PetService';
import { espaco, fontes, raio, TemaMemorial, useTheme } from '../../../theme';

const FOTOS_VISIVEIS = 4;

function Pagina() {
  const router = useRouter();
  const { paleta } = useTheme();
  const { id } = useLocalSearchParams();
  const { dados } = useMemorial(id);
  const [largura, setLargura] = useState(0);

  // Se a despedida foi desfeita, o pet volta ao perfil normal.
  const voltouParaLista = dados && !dados.pet.falecido;
  useEffect(() => {
    if (voltouParaLista) router.replace({ pathname: '/pet/[id]', params: { id } });
  }, [voltouParaLista, router, id]);

  if (!dados || voltouParaLista) {
    return (
      <Screen>
        <Cabecalho titulo="Memorial" aoVoltar={() => router.back()} />
        {dados ? null : (
          <EstadoVazio
            icone="help-circle-outline"
            titulo="Pet não encontrado"
            texto="Ele pode ter sido excluído."
          />
        )}
      </Screen>
    );
  }

  const { pet, homenagem, marcos, fotos } = dados;
  const vida = descreverVida(pet);
  const tamanho = tamanhoDoQuadrado(largura, 2, 8);
  const irPara = (pathname, params = {}) => router.push({ pathname, params: { id: pet.id, ...params } });

  const compartilhar = async () => {
    try {
      await Share.share({ message: textoParaCompartilhar(pet, homenagem) });
    } catch {
      Alert.alert('Não foi possível compartilhar', 'Tente de novo.');
    }
  };

  function desfazer() {
    Alert.alert(
      `Desfazer a despedida ${pet.deNome}?`,
      'Ele(a) volta para a lista de pets e os lembretes voltam a valer. A homenagem e a linha do tempo continuam guardadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desfazer despedida',
          onPress: () => {
            memorialService.desfazerDespedida(pet.id);
            router.replace({ pathname: '/pet/[id]', params: { id: pet.id } });
          },
        },
      ],
    );
  }

  function excluirDefinitivamente() {
    Alert.alert(
      `Excluir ${pet.nome} definitivamente?`,
      'O cadastro, a homenagem e a linha do tempo somem do app. Não dá para desfazer. Considere fazer um backup antes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Tem certeza?', `Isso apaga o memorial ${pet.deNome} para sempre.`, [
              { text: 'Voltar', style: 'cancel' },
              {
                text: 'Excluir para sempre',
                style: 'destructive',
                onPress: () => {
                  petService.excluir(pet.id);
                  router.replace('/pets');
                },
              },
            ]),
        },
      ],
    );
  }

  return (
    <Screen>
      <Cabecalho titulo="Memorial" aoVoltar={() => router.back()} />

      <View style={[styles.hero, { backgroundColor: paleta.primarioSuave }]}>
        <Avatar uri={pet.fotoUri} nome={pet.nome} tamanho={104} />
        <Texto variante="titulo" style={{ fontFamily: fontes.titulo }} accessibilityRole="header">
          {pet.nome}
        </Texto>
        {vida ? <Texto style={{ textAlign: 'center' }}>{vida}</Texto> : null}
        <View style={[styles.selo, { backgroundColor: paleta.cartao }]}>
          <Ionicons name="heart" size={14} color={paleta.primario} />
          <Texto variante="rotulo" cor="primarioTexto">
            Em memória
          </Texto>
        </View>
      </View>

      {homenagem ? (
        <Card>
          <Texto style={styles.homenagem}>{homenagem}</Texto>
        </Card>
      ) : (
        <Card>
          <Texto variante="legenda" style={{ marginBottom: espaco.md }}>
            Que tal escrever algumas palavras sobre {pet.nome}? Fica guardado aqui, só para você.
          </Texto>
          <Button
            titulo="Escrever homenagem"
            variante="secundario"
            icone="create-outline"
            aoPressionar={() => irPara('/pet/[id]/despedida')}
          />
        </Card>
      )}

      <View style={styles.titulo}>
        <Texto variante="subtitulo" accessibilityRole="header">
          Fotos
        </Texto>
        <Button
          titulo={
            fotos.length > 0 ? `Ver todas, ${contarFotos(fotos.length).toLowerCase()}` : 'Adicionar fotos'
          }
          variante="texto"
          larguraTotal={false}
          aoPressionar={() => irPara('/pet/[id]', { aba: 'fotos' })}
        />
      </View>
      {fotos.length === 0 ? (
        <Texto variante="legenda" style={{ marginBottom: espaco.lg }}>
          Ainda não há fotos.
        </Texto>
      ) : (
        <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)} style={styles.grade}>
          {tamanho > 0
            ? fotos.slice(0, FOTOS_VISIVEIS).map((f, i) => {
                const ultima = i === FOTOS_VISIVEIS - 1 && fotos.length > FOTOS_VISIVEIS;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => irPara('/pet/[id]/foto', { fotoId: f.id })}
                    accessibilityRole="button"
                    accessibilityLabel={
                      ultima
                        ? `Ver mais ${fotos.length - FOTOS_VISIVEIS} fotos`
                        : `Foto ${pet.deNome}${f.legenda ? `, ${f.legenda}` : ''}`
                    }
                    style={[styles.foto, { width: tamanho, height: tamanho, backgroundColor: paleta.linha }]}
                  >
                    <Image source={{ uri: f.miniatura }} style={styles.imagem} resizeMode="cover" />
                    {ultima ? (
                      <View style={[styles.mais, { backgroundColor: paleta.primarioSuave }]}>
                        <Texto variante="subtitulo" cor="primarioTexto">
                          +{fotos.length - FOTOS_VISIVEIS + 1}
                        </Texto>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            : null}
        </View>
      )}

      <View style={[styles.titulo, { marginTop: espaco.lg }]}>
        <Texto variante="subtitulo" accessibilityRole="header">
          Linha do tempo
        </Texto>
      </View>
      {marcos.length > 0 ? (
        <LinhaDoTempo marcos={marcos} aoAbrir={(m) => irPara('/pet/[id]/marco', { marcoId: m.id })} />
      ) : null}
      <View style={{ gap: espaco.sm, marginBottom: espaco.xl }}>
        <Button
          titulo="Adicionar lembrança"
          icone="add"
          variante="secundario"
          aoPressionar={() => irPara('/pet/[id]/marco')}
        />
        <Button
          titulo="Ver ficha de saúde arquivada"
          icone="folder-open-outline"
          variante="secundario"
          aoPressionar={() => irPara('/pet/[id]', { aba: 'saude' })}
        />
      </View>

      <SecaoRecolhivel titulo="Mais opções" subtitulo="Editar, compartilhar ou desfazer">
        <View style={{ gap: espaco.sm }}>
          <Button
            titulo="Editar despedida e homenagem"
            icone="create-outline"
            variante="secundario"
            aoPressionar={() => irPara('/pet/[id]/despedida')}
          />
          <Button
            titulo="Compartilhar homenagem"
            icone="share-social-outline"
            variante="secundario"
            aoPressionar={compartilhar}
          />
          <Button
            titulo="Desfazer despedida"
            icone="arrow-undo-outline"
            variante="secundario"
            aoPressionar={desfazer}
          />
          <Button titulo="Excluir definitivamente" variante="perigo" aoPressionar={excluirDefinitivamente} />
        </View>
      </SecaoRecolhivel>
    </Screen>
  );
}

/** Página do memorial de um pet: foto, homenagem, fotos, linha do tempo e opções, no tema lilás. */
export default function Memorial() {
  return (
    <TemaMemorial>
      <Pagina />
    </TemaMemorial>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: raio.lg,
    padding: espaco.xl,
    alignItems: 'center',
    gap: espaco.sm,
    marginBottom: espaco.lg,
  },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: espaco.md,
    paddingVertical: 4,
    borderRadius: 999,
  },
  homenagem: { fontFamily: fontes.serifa, fontSize: 18, lineHeight: 28 },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espaco.sm,
  },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: espaco.lg },
  foto: { borderRadius: raio.md, overflow: 'hidden' },
  imagem: { width: '100%', height: '100%' },
  mais: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', opacity: 0.92 },
});
