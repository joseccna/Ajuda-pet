import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SecaoFotos } from '../../../components/fotos/SecaoFotos';
import { LembreteCard } from '../../../components/painel/LembreteCard';
import { ResumoCard } from '../../../components/pet/ResumoCard';
import { TabsPet } from '../../../components/pet/TabsPet';
import { SecaoRotina } from '../../../components/rotina/SecaoRotina';
import { SecaoConsultas } from '../../../components/saude/SecaoConsultas';
import { SecaoPeso } from '../../../components/saude/SecaoPeso';
import { SecaoVacinas } from '../../../components/saude/SecaoVacinas';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { Card } from '../../../components/ui/Card';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { SituacaoBadge } from '../../../components/ui/SituacaoBadge';
import { Texto } from '../../../components/ui/Texto';
import { useCarteirinha } from '../../../hooks/useCarteirinha';
import { useConsultas } from '../../../hooks/useConsultas';
import { usePainel } from '../../../hooks/usePainel';
import { usePet } from '../../../hooks/usePet';
import { usePeso } from '../../../hooks/usePeso';
import { usePreferencias } from '../../../hooks/usePreferencias';
import { textoQuando } from '../../../models/regrasConsulta';
import { formatarDiferenca, formatarPeso } from '../../../models/regrasPeso';
import { espaco, fontes, useTheme } from '../../../theme';
import { paraISO } from '../../../utils/datas';

const CASTRADO = { sim: 'Sim', nao: 'Não', desconhecido: 'Não sei' };
const ABAS = [
  { chave: 'resumo', rotulo: 'Resumo' },
  { chave: 'saude', rotulo: 'Saúde' },
  { chave: 'rotina', rotulo: 'Rotina' },
  { chave: 'fotos', rotulo: 'Fotos' },
];
const SECOES = [
  { chave: 'vacinas', rotulo: 'Vacinas' },
  { chave: 'peso', rotulo: 'Peso' },
  { chave: 'consultas', rotulo: 'Consultas' },
];

function Linha({ rotulo, valor }) {
  if (!valor) return null;
  return (
    <View style={styles.linha}>
      <Texto variante="legenda">{rotulo}</Texto>
      <Texto variante="corpoMedio">{valor}</Texto>
    </View>
  );
}

/** Perfil do pet: o que precisa de atenção no topo, depois resumo, saúde, rotina e fotos. */
export default function PerfilPet() {
  const router = useRouter();
  const { paleta } = useTheme();
  const { id, aba: abaInicial, secao: secaoInicial } = useLocalSearchParams();
  const { pet, carregando, recarregar: recarregarPet } = usePet(id);
  const { painel } = usePainel();
  const { cartoes } = useCarteirinha(id);
  const { resumo: peso } = usePeso(id, '6m');
  const { unidadePeso } = usePreferencias();
  const { resumo: consultas } = useConsultas(id);
  const [aba, setAba] = useState(['saude', 'rotina', 'fotos'].includes(abaInicial) ? abaInicial : 'resumo');
  const [secao, setSecao] = useState(SECOES.some((s) => s.chave === secaoInicial) ? secaoInicial : 'vacinas');

  if (!pet) {
    return (
      <Screen>
        <Cabecalho titulo="Perfil do pet" aoVoltar={() => router.back()} />
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

  const nascimento = pet.textoNascimento;

  const irPara = (pathname, params = {}) => router.push({ pathname, params: { id: pet.id, ...params } });
  const abrirSaude = (s) => {
    setSecao(s);
    setAba('saude');
  };

  // Os mesmos lembretes do painel (o número em cima do pet na Home), só os deste pet.
  const lembretes = pet.falecido ? [] : [...painel.hoje, ...painel.proximos].filter((l) => l.petId === pet.id);
  const temUrgente = lembretes.some((l) => l.dias <= 0);
  // Lembrete que leva para uma aba deste mesmo perfil só troca a aba, sem abrir o perfil de novo.
  function abrirLembrete({ rota }) {
    if (rota?.pathname === '/pet/[id]' && rota.params?.id === pet.id) {
      setAba(rota.params.aba ?? 'resumo');
      if (rota.params.secao) setSecao(rota.params.secao);
    } else if (rota) {
      router.push(rota);
    }
  }

  const maisUrgente = cartoes.find((c) => c.situacao.estado !== 'sem-previsao');
  const hojeISO = paraISO(new Date());

  return (
    <Screen>
      <Cabecalho
        titulo="Perfil do pet"
        aoVoltar={() => router.back()}
        direita={{
          icone: 'create-outline',
          rotulo: 'Editar pet',
          aoPressionar: () => irPara('/pet/[id]/editar'),
        }}
      />

      <View style={styles.identidade}>
        <Avatar uri={pet.fotoUri} nome={pet.nome} tamanho={80} />
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="titulo" style={{ fontFamily: fontes.titulo }} accessibilityRole="header">
            {pet.nome}
          </Texto>
          <Texto variante="corpoMedio">{pet.resumo}</Texto>
          {nascimento ? <Texto variante="legenda">{nascimento}</Texto> : null}
        </View>
      </View>

      {pet.falecido ? (
        <View style={[styles.memoria, { backgroundColor: paleta.primarioSuave }]}>
          <Texto variante="corpoMedio" cor="primarioTexto">
            Em memória
          </Texto>
          <Texto variante="legenda" cor="primarioTexto" style={{ marginBottom: espaco.sm }}>
            Os lembretes {pet.deNome} estão pausados. Esta é a ficha arquivada.
          </Texto>
          <Button
            titulo="Abrir memorial"
            icone="heart-outline"
            variante="secundario"
            aoPressionar={() => router.replace({ pathname: '/pet/[id]/memorial', params: { id: pet.id } })}
          />
        </View>
      ) : null}

      <TabsPet abas={ABAS} atual={aba} aoMudar={setAba} />

      {aba === 'resumo' ? (
        <View>
          {lembretes.length > 0 ? (
            <View style={{ marginBottom: espaco.md }}>
              <Texto variante="subtitulo" accessibilityRole="header" style={{ marginBottom: espaco.sm }}>
                {temUrgente ? 'Precisa de atenção' : 'Próximos lembretes'}
              </Texto>
              {lembretes.map((l) => (
                <LembreteCard key={l.chave} lembrete={l} aoPressionar={() => abrirLembrete(l)} />
              ))}
            </View>
          ) : null}
          <ResumoCard
            icone="shield-checkmark-outline"
            titulo="Próxima vacina"
            valor={maisUrgente ? maisUrgente.tipo.nome : 'Nenhuma cadastrada'}
            detalhe={
              maisUrgente ? (
                <SituacaoBadge estado={maisUrgente.situacao.estado} texto={maisUrgente.texto} />
              ) : null
            }
            aoPressionar={() => abrirSaude('vacinas')}
          />
          <ResumoCard
            icone="scale-outline"
            titulo="Peso atual"
            valor={peso.atual ? formatarPeso(peso.atual.pesoG, unidadePeso) : 'Sem pesagem'}
            detalhe={
              peso.variacao !== null ? (
                <Texto variante="legenda">{formatarDiferenca(peso.variacao, unidadePeso)} em 6 meses</Texto>
              ) : null
            }
            aoPressionar={() => abrirSaude('peso')}
          />
          <ResumoCard
            icone="medkit-outline"
            titulo="Próxima consulta"
            valor={consultas.proxima ? consultas.proxima.motivo : 'Nenhuma agendada'}
            detalhe={
              consultas.proxima ? (
                <Texto variante="legenda">{textoQuando(consultas.proxima, hojeISO)}</Texto>
              ) : null
            }
            aoPressionar={() => abrirSaude('consultas')}
          />

          <View style={{ marginTop: espaco.sm, marginBottom: espaco.md }}>
            <Button
              titulo="Cartão de emergência"
              icone="warning-outline"
              variante="secundario"
              aoPressionar={() => irPara('/pet/[id]/emergencia')}
              dicaAcessibilidade="Abre os dados essenciais e os telefones para ligar"
            />
          </View>

          <Texto variante="rotulo" style={styles.titulo}>
            Dados
          </Texto>
          <Card>
            <Linha rotulo="Raça" valor={pet.raca} />
            <Linha rotulo="Cor ou pelagem" valor={pet.cor} />
            <Linha rotulo="Castrado" valor={pet.castrado === 'desconhecido' ? '' : CASTRADO[pet.castrado]} />
            <Linha rotulo="Microchip" valor={pet.microchip} />
            <Linha rotulo="Observações" valor={pet.observacoes} />
            {!pet.raca &&
            !pet.cor &&
            !pet.microchip &&
            !pet.observacoes &&
            pet.castrado === 'desconhecido' ? (
              <Texto variante="legenda">Toque em editar para completar os dados {pet.deNome}.</Texto>
            ) : null}
          </Card>
        </View>
      ) : aba === 'saude' ? (
        <View>
          <SegmentedControl rotulo="Saúde" opcoes={SECOES} atual={secao} aoMudar={setSecao} />
          {secao === 'vacinas' ? <SecaoVacinas pet={pet} irPara={irPara} /> : null}
          {secao === 'peso' ? <SecaoPeso pet={pet} irPara={irPara} /> : null}
          {secao === 'consultas' ? <SecaoConsultas pet={pet} irPara={irPara} /> : null}
        </View>
      ) : aba === 'rotina' ? (
        <View>
          <SecaoRotina pet={pet} irPara={irPara} />
        </View>
      ) : (
        <View>
          <SecaoFotos pet={pet} irPara={irPara} recarregarPet={recarregarPet} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  identidade: { flexDirection: 'row', alignItems: 'center', gap: espaco.lg, marginBottom: espaco.lg },
  titulo: { marginTop: espaco.md, marginBottom: espaco.sm },
  linha: { paddingVertical: espaco.sm },
  memoria: { padding: espaco.lg, borderRadius: 14, marginBottom: espaco.lg },
});
