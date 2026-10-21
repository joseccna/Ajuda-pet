import React, { useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGaleria } from '../../hooks/useGaleria';
import { agruparPorMes, contarFotos, contarSelecionadas, tamanhoDoQuadrado } from '../../models/regrasFotos';
import { FotoService } from '../../services/FotoService';
import { galeriaService } from '../../services/GaleriaService';
import { espaco, fontes, raio, useTheme } from '../../theme';
import { tituloDoDia } from '../../utils/datas';
import { Button } from '../ui/Button';
import { EstadoVazio } from '../ui/EstadoVazio';
import { Texto } from '../ui/Texto';

const ESPACO_GRADE = 4;

function Quadrado({ foto, tamanho, ehCapa, selecao, selecionada, nomePet, aoPressionar, aoPressionarLongo }) {
  const { paleta } = useTheme();
  const rotulo = `Foto ${nomePet}, ${tituloDoDia(foto.data)}${foto.legenda ? `, ${foto.legenda}` : ''}${ehCapa ? ', foto de capa' : ''}`;
  return (
    <Pressable
      onPress={aoPressionar}
      onLongPress={aoPressionarLongo}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={selecao ? { selected: selecionada } : undefined}
      accessibilityHint={selecao ? 'Toque para marcar ou desmarcar' : 'Abre a foto. Segure para selecionar'}
      style={[
        styles.quadrado,
        { width: tamanho, height: tamanho, backgroundColor: paleta.linha },
        selecionada && { borderWidth: 3, borderColor: paleta.primario },
      ]}
    >
      <Image source={{ uri: foto.miniatura }} style={styles.imagem} resizeMode="cover" />
      {ehCapa ? (
        <View style={[styles.capa, { backgroundColor: paleta.cartao }]}>
          <Ionicons name="star" size={12} color={paleta.primarioTexto} />
          <Texto style={{ fontSize: 12, lineHeight: 16, fontFamily: fontes.corpoNegrito }}>Capa</Texto>
        </View>
      ) : null}
      {selecao ? (
        <View
          style={[
            styles.marca,
            {
              backgroundColor: selecionada ? paleta.primario : paleta.cartao,
              borderColor: selecionada ? paleta.primario : paleta.campo,
            },
          ]}
        >
          {selecionada ? <Ionicons name="checkmark" size={16} color={paleta.sobrePrimario} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/** Aba Fotos: galeria em grade por mês, adicionar pela câmera ou galeria, selecionar para excluir ou definir a capa. */
export function SecaoFotos({ pet, irPara, recarregarPet }) {
  const { fotos, capaUri, recarregar } = useGaleria(pet.id);
  const [selecao, setSelecao] = useState(false);
  const [marcadas, setMarcadas] = useState(() => new Set());
  const [largura, setLargura] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  const tamanho = tamanhoDoQuadrado(largura, 3, ESPACO_GRADE);
  const grupos = agruparPorMes(fotos);

  async function adicionar(origem) {
    setOcupado(true);
    try {
      const r = await FotoService.escolherParaGaleria(origem);
      if (r.tipo === 'ok') {
        galeriaService.adicionar(pet.id, r.itens);
        recarregar();
      }
      if (r.tipo === 'sem-permissao') {
        Alert.alert(
          'Precisamos da câmera',
          'Para tirar a foto, permita o uso da câmera nas configurações do celular. Você também pode escolher da galeria.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ],
        );
      }
    } catch {
      Alert.alert('Não foi possível adicionar a foto', 'Tente de novo ou escolha outra imagem.');
    } finally {
      setOcupado(false);
    }
  }

  const sair = () => {
    setSelecao(false);
    setMarcadas(new Set());
  };
  const alternar = (id) =>
    setMarcadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  function tocar(foto) {
    if (selecao) alternar(foto.id);
    else irPara('/pet/[id]/foto', { fotoId: foto.id });
  }
  function segurar(foto) {
    setSelecao(true);
    setMarcadas(new Set([foto.id]));
  }

  function definirCapa() {
    const [id] = [...marcadas];
    galeriaService.definirCapa(id);
    sair();
    recarregar();
    recarregarPet?.();
  }

  function excluir() {
    const ids = [...marcadas];
    const incluiCapa = fotos.some((f) => ids.includes(f.id) && f.uri === capaUri);
    Alert.alert(
      ids.length === 1 ? 'Excluir esta foto?' : `Excluir ${ids.length} fotos?`,
      incluiCapa
        ? `A foto de capa está entre elas: ${pet.nome} ficará sem foto. Não dá para desfazer.`
        : 'Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            galeriaService.excluir(ids);
            sair();
            recarregar();
            recarregarPet?.();
          },
        },
      ],
    );
  }

  const botoesAdicionar = (
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
  );

  if (fotos.length === 0) {
    return (
      <EstadoVazio
        icone="images-outline"
        titulo="Nenhuma foto ainda"
        texto={`Guarde as lembranças ${pet.deNome}: tire uma foto agora ou escolha da galeria.`}
      >
        {botoesAdicionar}
      </EstadoVazio>
    );
  }

  return (
    <View>
      <View style={styles.topo}>
        <Texto variante="subtitulo" accessibilityRole="header">
          {selecao ? contarSelecionadas(marcadas.size) : contarFotos(fotos.length)}
        </Texto>
        <Button
          titulo={selecao ? 'Cancelar' : 'Selecionar'}
          variante="secundario"
          larguraTotal={false}
          aoPressionar={selecao ? sair : () => setSelecao(true)}
        />
      </View>

      {selecao ? (
        <View style={styles.botoes}>
          <Button
            titulo="Definir capa"
            icone="star-outline"
            variante="secundario"
            larguraTotal={false}
            desabilitado={marcadas.size !== 1}
            aoPressionar={definirCapa}
            style={{ flex: 1 }}
          />
          <Button
            titulo="Excluir"
            icone="trash-outline"
            variante="perigo"
            larguraTotal={false}
            desabilitado={marcadas.size === 0}
            aoPressionar={excluir}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        botoesAdicionar
      )}

      <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)} style={{ marginTop: espaco.lg }}>
        {grupos.map((g) => (
          <View key={g.chave} style={{ marginBottom: espaco.lg }}>
            <Texto variante="rotulo" style={{ marginBottom: espaco.sm }}>
              {g.titulo}
            </Texto>
            {tamanho > 0 ? (
              <View style={styles.grade}>
                {g.fotos.map((f) => (
                  <Quadrado
                    key={f.id}
                    foto={f}
                    tamanho={tamanho}
                    ehCapa={f.uri === capaUri}
                    selecao={selecao}
                    selecionada={marcadas.has(f.id)}
                    nomePet={pet.deNome}
                    aoPressionar={() => tocar(f)}
                    aoPressionarLongo={() => segurar(f)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espaco.md,
  },
  botoes: { flexDirection: 'row', gap: espaco.sm },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO_GRADE },
  quadrado: { borderRadius: raio.sm, overflow: 'hidden' },
  imagem: { width: '100%', height: '100%' },
  capa: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  marca: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
