import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlanoAlimentar } from '../../models/PlanoAlimentar';
import { lerHorario, normalizarHorarios } from '../../models/regrasAlimentacao';
import { mascararHora } from '../../models/regrasConsulta';
import { lerPeso } from '../../models/regrasPeso';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { alimentacaoService, ErroValidacaoPlano } from '../../services/AlimentacaoService';
import { ALVO_MINIMO, espaco, raio, useTheme } from '../../theme';
import { formatarDataBR, lerDataBR, mascararDataBR, paraISO } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { ChipSelector } from '../ui/ChipSelector';
import { SecaoRecolhivel } from '../ui/SecaoRecolhivel';
import { Texto } from '../ui/Texto';

const MODOS = [
  { valor: 'corrigir', rotulo: 'Corrigir este plano' },
  { valor: 'novo', rotulo: 'Novo plano' },
];

/**
 * Plano alimentar: ração, quantidade por refeição, horários, lembretes e estoque.
 * Ao editar, escolha entre corrigir o plano atual (um erro de digitação) ou criar um novo,
 * que guarda o anterior no histórico (troca de ração ou de quantidade).
 */
export function FormPlano({ pet, plano, aoSalvar }) {
  const { paleta } = useTheme();
  const editando = Boolean(plano);

  const inicial = useMemo(
    () => ({
      tipoRacao: plano?.tipoRacao ?? '',
      quantidade: plano ? String(plano.quantidadeG) : '',
      horarios: plano?.horarios ?? ['08:00', '19:00'],
      novoHorario: '',
      lembretes: plano?.lembretes ?? true,
      saco: plano?.sacoG ? String(plano.sacoG / 1000).replace('.', ',') : '',
      aberto: plano?.sacoAbertoEm ? formatarDataBR(plano.sacoAbertoEm) : '',
      observacoes: plano?.observacoes ?? '',
      modo: 'corrigir',
    }),
    [plano],
  );
  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(JSON.stringify(e) !== JSON.stringify(inicial));

  const mudar = (campo, valor) => {
    setE((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
  };

  function adicionarHorario() {
    const r = lerHorario(e.novoHorario);
    if ('erro' in r) {
      setErros((a) => ({ ...a, novoHorario: r.erro }));
      return;
    }
    setE((a) => ({ ...a, horarios: normalizarHorarios([...a.horarios, r.horario]), novoHorario: '' }));
    setErros((a) => ({ ...a, horarios: undefined, novoHorario: undefined }));
  }

  const removerHorario = (h) =>
    mudar(
      'horarios',
      e.horarios.filter((x) => x !== h),
    );

  const quantidade = Number(e.quantidade);
  const porDia = Number.isInteger(quantidade) && quantidade > 0 ? quantidade * e.horarios.length : null;

  function salvar() {
    const novosErros = {};
    let sacoG = null;
    let sacoAbertoEm = null;
    if (e.saco.trim() !== '') {
      const s = lerPeso(e.saco, 'kg');
      if ('erro' in s) novosErros.sacoG = 'Informe o tamanho do saco em quilos, por exemplo 15.';
      else sacoG = s.gramas;
      if (e.aberto.trim() === '') {
        sacoAbertoEm = paraISO(new Date());
      } else {
        const d = lerDataBR(e.aberto);
        if ('erro' in d) novosErros.aberto = d.erro;
        else sacoAbertoEm = d.iso;
      }
    }
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const dados = {
      tipoRacao: e.tipoRacao,
      quantidadeG: Number.isInteger(quantidade) ? quantidade : 0,
      horarios: e.horarios,
      lembretes: e.lembretes,
      sacoG,
      sacoAbertoEm,
      observacoes: e.observacoes,
    };

    try {
      if (editando && e.modo === 'corrigir') {
        Object.assign(plano, dados, { horarios: normalizarHorarios(dados.horarios) });
        alimentacaoService.corrigirPlano(plano);
      } else {
        alimentacaoService.criarPlano(new PlanoAlimentar({ petId: pet.id, ...dados }));
      }
      liberarSaida();
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoPlano) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  return (
    <View>
      {editando ? (
        <ChipSelector rotulo="Ao salvar" valor={e.modo} aoMudar={(v) => mudar('modo', v)} opcoes={MODOS} />
      ) : null}
      {editando && e.modo === 'novo' ? (
        <Texto variante="legenda" style={{ marginTop: -8, marginBottom: 16 }}>
          O plano atual vai para o histórico, encerrado ontem, e este começa hoje.
        </Texto>
      ) : null}

      <Campo
        rotulo="Ração"
        obrigatorio
        placeholder="Ração Premium Adulto"
        value={e.tipoRacao}
        onChangeText={(t) => mudar('tipoRacao', t)}
        erro={erros.tipoRacao}
      />
      <Campo
        rotulo="Quantidade por refeição (g)"
        obrigatorio
        placeholder="150"
        keyboardType="number-pad"
        maxLength={4}
        value={e.quantidade}
        onChangeText={(t) => mudar('quantidade', t.replace(/\D/g, ''))}
        erro={erros.quantidadeG}
        dica={porDia ? `Ração por dia: ${porDia} g.` : undefined}
      />

      <Texto variante="rotulo" style={{ marginBottom: 8 }}>
        Horários das refeições
      </Texto>
      <View style={styles.horarios}>
        {e.horarios.map((h) => (
          <Pressable
            key={h}
            onPress={() => removerHorario(h)}
            accessibilityRole="button"
            accessibilityLabel={`Remover horário ${h}`}
            style={[styles.horario, { backgroundColor: paleta.primarioSuave, borderColor: paleta.primario }]}
          >
            <Texto variante="corpoMedio" style={{ color: paleta.primarioTexto }}>
              {h}
            </Texto>
            <Ionicons name="close" size={18} color={paleta.primarioTexto} />
          </Pressable>
        ))}
      </View>
      {erros.horarios ? (
        <Texto variante="legenda" cor="erro" accessibilityLiveRegion="polite" style={{ marginBottom: 8 }}>
          {erros.horarios}
        </Texto>
      ) : null}
      <View style={styles.adicionar}>
        <View style={{ flex: 1 }}>
          <Campo
            rotulo="Novo horário"
            placeholder="13:00"
            keyboardType="number-pad"
            maxLength={5}
            value={e.novoHorario}
            onChangeText={(t) => mudar('novoHorario', mascararHora(t))}
            erro={erros.novoHorario}
          />
        </View>
        <View style={{ marginTop: 26 }}>
          <Button
            titulo="Adicionar"
            variante="secundario"
            larguraTotal={false}
            aoPressionar={adicionarHorario}
          />
        </View>
      </View>

      <View style={[styles.linhaSwitch, { borderColor: paleta.linha, backgroundColor: paleta.cartao }]}>
        <View style={{ flex: 1 }}>
          <Texto variante="corpoMedio">Lembretes de refeição</Texto>
          <Texto variante="legenda">Mostra no painel as refeições que ainda não foram marcadas.</Texto>
        </View>
        <Switch
          value={e.lembretes}
          onValueChange={(v) => mudar('lembretes', v)}
          accessibilityLabel="Lembretes de refeição"
          trackColor={{ false: paleta.campo, true: paleta.primario }}
          thumbColor={paleta.cartao}
        />
      </View>

      <SecaoRecolhivel
        titulo="Estoque de ração"
        subtitulo="Estima quantos dias o saco ainda dura"
        abertaInicialmente={Boolean(e.saco)}
      >
        <Campo
          rotulo="Tamanho do saco (kg)"
          placeholder="15"
          keyboardType="decimal-pad"
          value={e.saco}
          onChangeText={(t) => mudar('saco', t)}
          erro={erros.sacoG}
        />
        <Campo
          rotulo="Aberto em"
          placeholder="20/09/2026"
          keyboardType="number-pad"
          maxLength={10}
          value={e.aberto}
          onChangeText={(t) => mudar('aberto', mascararDataBR(t))}
          erro={erros.aberto}
          dica="Se deixar em branco, usamos hoje."
        />
      </SecaoRecolhivel>

      <Campo
        rotulo="Observações"
        multilinha
        placeholder="Petiscos, restrições, alergias"
        value={e.observacoes}
        onChangeText={(t) => mudar('observacoes', t)}
      />

      <Button titulo={editando ? 'Salvar plano' : 'Criar plano'} aoPressionar={salvar} />
    </View>
  );
}

const styles = StyleSheet.create({
  horarios: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm, marginBottom: espaco.md },
  horario: {
    minHeight: ALVO_MINIMO,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    paddingHorizontal: espaco.lg,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  adicionar: { flexDirection: 'row', gap: espaco.md, alignItems: 'flex-start' },
  linhaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    borderWidth: 1,
    borderRadius: raio.lg,
    padding: espaco.md,
    marginBottom: espaco.lg,
  },
});
