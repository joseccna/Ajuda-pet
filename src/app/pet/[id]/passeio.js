import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { Campo } from '../../../components/ui/Campo';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { Texto } from '../../../components/ui/Texto';
import { usePet } from '../../../hooks/usePet';
import { usePreferencias } from '../../../hooks/usePreferencias';
import {
  MARCACOES,
  formatarCronometro,
  formatarDuracao,
  percentualMeta,
  segundosDecorridos,
} from '../../../models/regrasPasseio';
import { passeioService } from '../../../services/PasseioService';
import { ALVO_MINIMO, espaco, fontes, raio, useTheme } from '../../../theme';

function Marcacao({ rotulo, ligada, aoAlternar }) {
  const { paleta } = useTheme();
  return (
    <Pressable
      onPress={aoAlternar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ selected: ligada }}
      style={[
        styles.marcacao,
        {
          backgroundColor: ligada ? paleta.destaqueSuave : paleta.cartao,
          borderColor: ligada ? paleta.destaque : paleta.campo,
        },
      ]}
    >
      {ligada ? <Ionicons name="checkmark" size={18} color={paleta.destaque} /> : null}
      <Texto
        style={{
          fontFamily: ligada ? fontes.corpoNegrito : fontes.corpoMedio,
          color: ligada ? paleta.destaque : paleta.texto,
        }}
      >
        {rotulo}
      </Texto>
    </Pressable>
  );
}

/**
 * Passeio com cronômetro. Três momentos: pronto para começar, em andamento e resumo.
 * O tempo vem dos horários guardados no banco, então continua certo com a tela bloqueada,
 * com o app em segundo plano ou depois de fechar e abrir o app.
 */
export default function PasseioDoPet() {
  const router = useRouter();
  const { paleta } = useTheme();
  const { id, passeioId } = useLocalSearchParams();
  const { pet, carregando } = usePet(id);
  const { metaPasseioMin } = usePreferencias();

  const [passeio, setPasseio] = useState(() =>
    passeioId ? passeioService.buscar(passeioId) : passeioService.ativo(id),
  );
  const [marcacoes, setMarcacoes] = useState(() =>
    passeio ? passeioService.marcacoesDoPasseio(passeio.id) : [],
  );
  const [agora, setAgora] = useState(Date.now());
  const [distancia, setDistancia] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState();
  const minutosAntes = useMemo(() => passeioService.resumo(id).minutosHoje, [id]);

  const andamento = Boolean(passeio?.emAndamento);
  const pausado = Boolean(passeio?.pausadoDesde);

  useEffect(() => {
    if (!andamento) return undefined;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [andamento]);

  if (!pet) {
    return (
      <Screen>
        <Cabecalho titulo="Passeio" icone="fechar" aoVoltar={() => router.back()} />
        {carregando ? null : (
          <EstadoVazio
            icone="help-circle-outline"
            titulo="Pet não encontrado"
            texto="Ele pode ter sido excluído."
          />
        )}
      </Screen>
    );
  }

  const iniciar = () => {
    const p = passeioService.iniciar(pet.id);
    setPasseio(p);
    setMarcacoes([]);
    setAgora(Date.now());
  };
  const alternarPausa = () => {
    const p = pausado ? passeioService.retomar(passeio.id) : passeioService.pausar(passeio.id);
    setPasseio(p);
    setAgora(Date.now());
  };
  const alternarMarcacao = (tipo) => {
    passeioService.alternarMarcacao(passeio.id, tipo);
    setMarcacoes(passeioService.marcacoesDoPasseio(passeio.id));
  };
  const finalizar = () => setPasseio(passeioService.finalizar(passeio.id));
  const cancelar = () =>
    Alert.alert('Cancelar o passeio?', 'O tempo e as marcações deste passeio serão descartados.', [
      { text: 'Continuar passeio', style: 'cancel' },
      {
        text: 'Cancelar passeio',
        style: 'destructive',
        onPress: () => {
          passeioService.descartar(passeio.id);
          router.back();
        },
      },
    ]);

  function salvarDetalhes() {
    const texto = distancia.trim().replace(',', '.');
    const km = texto === '' ? null : /^\d+(\.\d+)?$/.test(texto) ? Number(texto) : NaN;
    if (Number.isNaN(km)) {
      setErro('Informe a distância em quilômetros, por exemplo 1,8.');
      return;
    }
    try {
      passeioService.concluirDetalhes(passeio.id, { distanciaKm: km, observacao });
      router.back();
    } catch {
      setErro('Não foi possível salvar. Confira a distância.');
    }
  }

  // ---------- Pronto para começar ----------
  if (!passeio) {
    return (
      <Screen>
        <Cabecalho titulo={`Passeio ${pet.deNome}`} icone="fechar" aoVoltar={() => router.back()} />
        <View style={styles.centro}>
          <Avatar uri={pet.fotoUri} nome={pet.nome} tamanho={96} />
          <Texto variante="subtitulo" style={{ textAlign: 'center' }}>
            Pronto para passear com {pet.nome}?
          </Texto>
          <Texto variante="legenda" style={{ textAlign: 'center' }}>
            O tempo continua contando com a tela bloqueada.
          </Texto>
        </View>
        <Button titulo="Iniciar passeio" icone="play" aoPressionar={iniciar} />
      </Screen>
    );
  }

  const segundos = segundosDecorridos(passeio, agora);

  // ---------- Resumo (depois de finalizar) ----------
  if (!andamento) {
    return (
      <Screen>
        <Cabecalho titulo="Passeio concluído" icone="fechar" aoVoltar={() => router.back()} />
        <View style={styles.centro}>
          <Avatar uri={pet.fotoUri} nome={pet.nome} tamanho={80} />
          <Texto variante="titulo" style={{ fontFamily: fontes.titulo }}>
            {formatarDuracao(passeio.duracaoMin ?? 1)}
          </Texto>
          {marcacoes.length > 0 ? (
            <Texto variante="legenda">
              {marcacoes.map((m) => MARCACOES.find((x) => x.tipo === m.tipo)?.rotulo ?? m.tipo).join(', ')}
            </Texto>
          ) : null}
        </View>
        <Campo
          rotulo="Distância (km)"
          placeholder="1,8"
          keyboardType="decimal-pad"
          value={distancia}
          onChangeText={(t) => {
            setDistancia(t);
            setErro(undefined);
          }}
          erro={erro}
          dica="Opcional. O app não usa a localização: a distância é só o que você informar."
        />
        <Campo
          rotulo="Observação"
          multilinha
          placeholder="Parque, praia, brincou muito"
          value={observacao}
          onChangeText={setObservacao}
        />
        <View style={{ gap: espaco.sm }}>
          <Button titulo="Salvar" aoPressionar={salvarDetalhes} />
          <Button
            titulo="Agora não"
            variante="texto"
            larguraTotal={false}
            aoPressionar={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  // ---------- Em andamento ----------
  const percentual = percentualMeta(minutosAntes + Math.floor(segundos / 60), metaPasseioMin);
  const horaInicio = new Date(passeio.inicio);
  const hh = `${String(horaInicio.getHours()).padStart(2, '0')}:${String(horaInicio.getMinutes()).padStart(2, '0')}`;

  return (
    <Screen>
      <Cabecalho titulo={`Passeio ${pet.deNome}`} icone="fechar" aoVoltar={() => router.back()} />
      <View style={styles.centro}>
        <Avatar uri={pet.fotoUri} nome={pet.nome} tamanho={88} />
        <Texto
          accessibilityRole="timer"
          accessibilityLabel={`Tempo de passeio: ${formatarDuracao(Math.floor(segundos / 60))}`}
          style={[styles.tempo, { color: pausado ? paleta.textoSuave : paleta.texto }]}
        >
          {formatarCronometro(segundos)}
        </Texto>
        <Texto variante="legenda">{pausado ? 'Pausado' : `Iniciado às ${hh}`}</Texto>
      </View>

      <View style={[styles.meta, { backgroundColor: paleta.cartao, borderColor: paleta.linha }]}>
        <View style={styles.metaTopo}>
          <Texto variante="legenda">Meta do dia</Texto>
          <Texto variante="rotulo">{percentual}%</Texto>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Meta do dia"
          accessibilityValue={{ min: 0, max: 100, now: percentual }}
          style={[styles.trilha, { backgroundColor: paleta.linha }]}
        >
          <View style={[styles.preenchido, { width: `${percentual}%`, backgroundColor: paleta.destaque }]} />
        </View>
      </View>

      <Texto variante="rotulo" style={{ marginBottom: espaco.sm }}>
        Marcar durante o passeio
      </Texto>
      <View style={styles.marcacoes}>
        {MARCACOES.map((m) => (
          <Marcacao
            key={m.tipo}
            rotulo={m.rotulo}
            ligada={marcacoes.some((x) => x.tipo === m.tipo)}
            aoAlternar={() => alternarMarcacao(m.tipo)}
          />
        ))}
      </View>

      <View style={styles.botoes}>
        <Button
          titulo={pausado ? 'Retomar' : 'Pausar'}
          icone={pausado ? 'play' : 'pause'}
          variante="secundario"
          larguraTotal={false}
          aoPressionar={alternarPausa}
          style={{ flex: 1, minHeight: 56 }}
        />
        <Button
          titulo="Finalizar"
          icone="stop"
          larguraTotal={false}
          aoPressionar={finalizar}
          style={{ flex: 1, minHeight: 56 }}
        />
      </View>
      <View style={{ alignItems: 'center', marginTop: espaco.md }}>
        <Button titulo="Cancelar passeio" variante="texto" larguraTotal={false} aoPressionar={cancelar} />
      </View>
      <Texto variante="legenda" style={{ textAlign: 'center' }}>
        Você pode sair desta tela: o passeio continua contando.
      </Texto>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', gap: espaco.sm, marginBottom: espaco.xl },
  tempo: { fontFamily: fontes.titulo, fontSize: 56, lineHeight: 64 },
  meta: {
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.md,
    marginBottom: espaco.xl,
    gap: espaco.sm,
  },
  metaTopo: { flexDirection: 'row', justifyContent: 'space-between' },
  trilha: { height: 10, borderRadius: 5, overflow: 'hidden' },
  preenchido: { height: 10, borderRadius: 5 },
  marcacoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm, marginBottom: espaco.xl },
  marcacao: {
    minHeight: ALVO_MINIMO,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    paddingHorizontal: espaco.lg,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  botoes: { flexDirection: 'row', gap: espaco.sm },
});
