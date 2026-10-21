import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AvisoNotificacoes } from '../../components/agenda/AvisoNotificacoes';
import { CalendarioMes } from '../../components/agenda/CalendarioMes';
import { EventoCard } from '../../components/agenda/EventoCard';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { Texto } from '../../components/ui/Texto';
import { useAgenda, useNotificacoes } from '../../hooks/useAgenda';
import { usePets } from '../../hooks/usePets';
import { agruparPorDia, filtrarPorPet, mudarMes } from '../../models/regrasAgenda';
import { ALVO_MINIMO, espaco, fontes, useTheme } from '../../theme';
import { paraISO, tituloDoDia } from '../../utils/datas';

/** Filtro por pet: "Todos" e a foto de cada pet. */
function FiltroPets({ pets, valor, aoMudar }) {
  const { paleta } = useTheme();
  const opcoes = [{ id: 'todos', nome: 'Todos' }, ...pets];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Filtrar por pet" style={styles.filtro}>
      {opcoes.map((o) => {
        const marcado = o.id === valor;
        return (
          <Pressable
            key={o.id}
            onPress={() => aoMudar(o.id)}
            accessibilityRole="radio"
            accessibilityLabel={o.nome}
            accessibilityState={{ checked: marcado }}
            style={[
              styles.chip,
              {
                backgroundColor: marcado ? paleta.primarioSuave : paleta.cartao,
                borderColor: marcado ? paleta.primario : paleta.campo,
              },
            ]}
          >
            {o.id !== 'todos' ? <Avatar uri={o.fotoUri} nome={o.nome} tamanho={26} /> : null}
            <Texto
              style={{
                fontFamily: marcado ? fontes.corpoNegrito : fontes.corpoMedio,
                color: marcado ? paleta.primarioTexto : paleta.texto,
              }}
            >
              {o.nome}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Agenda: calendário do mês com tudo que tem data, lista do dia e o botão de novo lembrete. */
export default function Agenda() {
  const router = useRouter();
  const { paleta } = useTheme();
  const hojeISO = paraISO(new Date());
  const hoje = new Date();

  const [mes, setMes] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const [dia, setDia] = useState(hojeISO);
  const [filtro, setFiltro] = useState('todos');

  const { pets } = usePets();
  const { grade, eventos } = useAgenda(mes.ano, mes.mes);
  const { estado, pedir } = useNotificacoes();

  const porDia = useMemo(() => agruparPorDia(filtrarPorPet(eventos, filtro)), [eventos, filtro]);
  const doDia = porDia[dia] ?? [];
  const petFiltrado = pets.find((p) => p.id === filtro);

  function mudarDeMes(delta) {
    const novo = mudarMes(mes, delta);
    setMes(novo);
    const mesDeHoje = novo.ano === hoje.getFullYear() && novo.mes === hoje.getMonth();
    setDia(mesDeHoje ? hojeISO : paraISO(new Date(novo.ano, novo.mes, 1, 12)));
  }

  function irParaHoje() {
    setMes({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
    setDia(hojeISO);
  }

  return (
    <Screen bordas={['top', 'left', 'right']}>
      <View style={styles.topo}>
        <Texto variante="titulo" accessibilityRole="header">
          Agenda
        </Texto>
        <Button
          titulo="Hoje"
          icone="calendar-outline"
          variante="secundario"
          larguraTotal={false}
          aoPressionar={irParaHoje}
        />
      </View>

      <AvisoNotificacoes estado={estado} aoPedir={pedir} />

      {pets.length > 1 ? <FiltroPets pets={pets} valor={filtro} aoMudar={setFiltro} /> : null}

      <CalendarioMes
        ano={mes.ano}
        mes={mes.mes}
        grade={grade}
        eventosPorDia={porDia}
        selecionado={dia}
        hojeISO={hojeISO}
        aoSelecionar={setDia}
        aoMudarMes={mudarDeMes}
      />

      <Texto variante="subtitulo" accessibilityRole="header" style={{ marginBottom: espaco.sm }}>
        {`${tituloDoDia(dia)}${dia === hojeISO ? ', hoje' : ''}`}
      </Texto>

      {doDia.length === 0 ? (
        <View style={[styles.livre, { backgroundColor: paleta.destaqueSuave }]}>
          <Texto variante="corpoMedio" cor="destaque">
            Dia livre
          </Texto>
          <Texto variante="legenda" cor="destaque">
            {petFiltrado
              ? `Nenhum lembrete para ${petFiltrado.nome} neste dia.`
              : 'Nenhum lembrete neste dia.'}
          </Texto>
        </View>
      ) : (
        doDia.map((e) => (
          <EventoCard key={`${e.chave}-${e.data}`} evento={e} aoPressionar={() => router.push(e.rota)} />
        ))
      )}

      <View style={{ marginTop: espaco.lg }}>
        <Button
          titulo="Novo lembrete"
          icone="add"
          aoPressionar={() =>
            router.push({
              pathname: '/lembrete',
              params: { data: dia, ...(petFiltrado ? { petId: petFiltrado.id } : {}) },
            })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espaco.lg,
  },
  filtro: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm, marginBottom: espaco.lg },
  chip: {
    minHeight: ALVO_MINIMO,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.md,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  livre: { padding: espaco.lg, borderRadius: 14, gap: 2 },
});
