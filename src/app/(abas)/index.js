import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AvisoBackup } from '../../components/backup/AvisoBackup';
import { AtalhoTile } from '../../components/painel/AtalhoTile';
import { LembreteCard } from '../../components/painel/LembreteCard';
import { PetAvatarRow } from '../../components/painel/PetAvatarRow';
import { Button } from '../../components/ui/Button';
import { EstadoVazio } from '../../components/ui/EstadoVazio';
import { Screen } from '../../components/ui/Screen';
import { Texto } from '../../components/ui/Texto';
import { useSituacaoBackup } from '../../hooks/useBackup';
import { usePainel } from '../../hooks/usePainel';
import { usePets } from '../../hooks/usePets';
import { usePreferencias } from '../../hooks/usePreferencias';
import { ATALHOS_INFO } from '../../models/regrasPreferencias';
import { useTutor } from '../../hooks/useTutor';
import { saudacaoComNome } from '../../models/regrasTutor';
import { espaco, useTheme } from '../../theme';
import { saudacao } from '../../utils/datas';

const MAX_VISIVEIS = 3;

function Secao({ titulo, children, acao }) {
  return (
    <View style={styles.secao}>
      <View style={styles.secaoTopo}>
        <Texto variante="subtitulo" accessibilityRole="header">
          {titulo}
        </Texto>
        {acao}
      </View>
      {children}
    </View>
  );
}

/** Painel do dia: lembretes de hoje, próximos, atalhos e os pets. */
export default function Painel() {
  const router = useRouter();
  const { paleta } = useTheme();
  const { pets, carregando } = usePets();
  const { painel } = usePainel();
  const { tutor } = useTutor();
  const { atalhos } = usePreferencias();
  const situacaoBackup = useSituacaoBackup();
  const [verTodosHoje, setVerTodosHoje] = useState(false);

  const abrir = (rota) => router.push(rota);
  const novoPet = () => router.push('/pet/novo');

  // Atalhos que dependem de um pet: com um só pet vai direto, com vários pergunta qual.
  const ROTAS = {
    dose: '/pet/[id]/dose',
    vacina: '/pet/[id]/vacina-nova',
    peso: '/pet/[id]/peso',
    consulta: '/pet/[id]/consulta',
    passeio: '/pet/[id]/passeio',
    cuidado: '/pet/[id]/cuidado-registro',
  };
  function irParaPet(destino) {
    if (pets.length === 1) {
      router.push({ pathname: ROTAS[destino], params: { id: pets[0].id } });
    } else {
      router.push({ pathname: '/escolher-pet', params: { destino } });
    }
  }

  const visiveis = verTodosHoje ? painel.hoje : painel.hoje.slice(0, MAX_VISIVEIS);
  const proximos = painel.proximos.slice(0, MAX_VISIVEIS);

  return (
    <Screen bordas={['top', 'left', 'right']}>
      <View style={styles.saudacao}>
        <Texto variante="titulo" accessibilityRole="header">
          {saudacaoComNome(saudacao(new Date().getHours()), tutor)}
        </Texto>
        <Texto variante="corpo" cor="textoSuave">
          Como estão seus pets hoje?
        </Texto>
      </View>

      {pets.length === 0 ? (
        carregando ? null : (
          <EstadoVazio
            icone="paw"
            titulo="Bem-vindo ao Ajuda Pet"
            texto="Cadastre seu primeiro pet para acompanhar vacinas, peso, consultas e rotina."
          >
            <Button titulo="Cadastrar primeiro pet" icone="add" aoPressionar={novoPet} />
          </EstadoVazio>
        )
      ) : (
        <>
          {situacaoBackup.devido ? (
            <AvisoBackup situacao={situacaoBackup} compacto aoFazer={() => router.push('/backup')} />
          ) : null}
          <Secao titulo="Hoje">
            {visiveis.length === 0 ? (
              <View style={[styles.calmo, { backgroundColor: paleta.destaqueSuave }]}>
                <Texto variante="corpoMedio" cor="destaque">
                  Dia tranquilo
                </Texto>
                <Texto variante="legenda" cor="destaque">
                  Nenhum lembrete para hoje.
                </Texto>
              </View>
            ) : (
              visiveis.map((l) => (
                <LembreteCard key={l.chave} lembrete={l} aoPressionar={() => abrir(l.rota)} />
              ))
            )}
            {painel.hoje.length > MAX_VISIVEIS ? (
              <Button
                titulo={verTodosHoje ? 'Ver menos' : `Ver mais ${painel.hoje.length - MAX_VISIVEIS}`}
                variante="texto"
                larguraTotal={false}
                aoPressionar={() => setVerTodosHoje((v) => !v)}
              />
            ) : null}
          </Secao>

          {proximos.length > 0 ? (
            <Secao titulo="Próximos">
              {proximos.map((l) => (
                <LembreteCard key={l.chave} lembrete={l} aoPressionar={() => abrir(l.rota)} />
              ))}
            </Secao>
          ) : null}

          <Secao titulo="Atalhos">
            <View style={styles.atalhos}>
              {atalhos.map((chave) => (
                <AtalhoTile
                  key={chave}
                  rotulo={ATALHOS_INFO[chave].rotulo}
                  icone={ATALHOS_INFO[chave].icone}
                  aoPressionar={chave === 'novoPet' ? novoPet : () => irParaPet(chave)}
                />
              ))}
            </View>
          </Secao>

          <Secao
            titulo="Meus pets"
            acao={
              <Button
                titulo="Ver todos"
                variante="texto"
                larguraTotal={false}
                aoPressionar={() => router.push('/pets')}
              />
            }
          >
            <PetAvatarRow
              pets={pets}
              porPet={painel.porPet}
              aoAbrirPet={(p) => router.push({ pathname: '/pet/[id]', params: { id: p.id } })}
              aoAdicionar={novoPet}
            />
          </Secao>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  saudacao: { marginBottom: espaco.xl, gap: 2 },
  secao: { marginBottom: espaco.xl },
  secaoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espaco.sm,
  },
  atalhos: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  calmo: { padding: espaco.lg, borderRadius: 14, gap: 2 },
});
