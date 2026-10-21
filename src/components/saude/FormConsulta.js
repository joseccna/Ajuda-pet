import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { Consulta } from '../../models/Consulta';
import { MOTIVOS_COMUNS, lerHora, mascararHora } from '../../models/regrasConsulta';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { ErroValidacaoConsulta, consultaService } from '../../services/ConsultaService';
import { formatarDataBR, lerDataBR, mascararDataBR, paraISO } from '../../utils/datas';
import { centavosParaCampo, lerReais } from '../../utils/dinheiro';
import { BlocoPrivado } from '../ui/BlocoPrivado';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { ChipSelector } from '../ui/ChipSelector';
import { SecaoRecolhivel } from '../ui/SecaoRecolhivel';
import { Texto } from '../ui/Texto';
import { AnexosPicker } from './AnexosPicker';

/**
 * Registra, agenda ou edita uma consulta. A mesma tela serve para a consulta que já
 * aconteceu e para a que vai acontecer: o que muda é só a data.
 * Valor e anotações pessoais ficam no bloco privado e nunca saem deste aparelho.
 */
export function FormConsulta({ pet, detalhe, aoSalvar, aoExcluir }) {
  const editando = Boolean(detalhe);
  const sugerido = useMemo(
    () => (editando ? null : consultaService.profissionalSugerido(pet.id)),
    [editando, pet.id],
  );

  const inicial = useMemo(() => {
    const c = detalhe?.consulta;
    return {
      motivo: c?.motivo ?? '',
      data: c ? formatarDataBR(c.data) : formatarDataBR(paraISO(new Date())),
      hora: c?.hora ?? '',
      veterinario: c?.veterinario ?? sugerido?.veterinario ?? '',
      clinica: c?.clinica ?? sugerido?.clinica ?? '',
      diagnostico: c?.diagnostico ?? '',
      prescricao: c?.prescricao ?? '',
      retorno: c?.retornoEm ? formatarDataBR(c.retornoEm) : '',
      valor: centavosParaCampo(detalhe?.privada?.valorCentavos ?? null),
      anotacoes: detalhe?.privada?.anotacoes ?? '',
      anexos: (detalhe?.anexos ?? []).map((a) => ({ id: a.id, uri: a.uri, privado: a.privado })),
    };
  }, [detalhe, sugerido]);

  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(JSON.stringify(e) !== JSON.stringify(inicial));

  const mudar = (campo, valor) => {
    setE((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
  };

  function salvar() {
    const novosErros = {};
    const data = lerDataBR(e.data, new Date(), true);
    if ('erro' in data) novosErros.data = data.erro;
    const hora = lerHora(e.hora);
    if ('erro' in hora) novosErros.hora = hora.erro;
    let retornoEm = null;
    if (e.retorno.trim() !== '') {
      const r = lerDataBR(e.retorno, new Date(), true);
      if ('erro' in r) novosErros.retornoEm = r.erro;
      else retornoEm = r.iso;
    }
    const valor = lerReais(e.valor);
    if ('erro' in valor) novosErros.valor = valor.erro;
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const consulta = detalhe?.consulta ?? new Consulta({ petId: pet.id });
    consulta.data = data.iso;
    consulta.hora = hora.hora;
    consulta.motivo = e.motivo;
    consulta.veterinario = e.veterinario;
    consulta.clinica = e.clinica;
    consulta.diagnostico = e.diagnostico;
    consulta.prescricao = e.prescricao;
    consulta.retornoEm = retornoEm;

    try {
      consultaService.salvar({
        consulta,
        valorCentavos: valor.centavos,
        anotacoes: e.anotacoes,
        anexos: e.anexos,
      });
      liberarSaida();
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoConsulta) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir esta consulta?', 'Os anexos e os dados privados dela também serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          consultaService.excluir(detalhe.consulta.id);
          liberarSaida();
          aoExcluir();
        },
      },
    ]);
  }

  const temDetalhes = Boolean(e.diagnostico || e.prescricao || e.retorno);

  return (
    <View>
      <ChipSelector
        rotulo="Motivo"
        valor={MOTIVOS_COMUNS.includes(e.motivo) ? e.motivo : ''}
        aoMudar={(v) => mudar('motivo', v)}
        opcoes={MOTIVOS_COMUNS.map((m) => ({ valor: m, rotulo: m }))}
      />
      <Campo
        rotulo="Motivo da consulta"
        obrigatorio
        placeholder="Alergia de pele"
        value={e.motivo}
        onChangeText={(t) => mudar('motivo', t)}
        maxLength={80}
        erro={erros.motivo}
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 3 }}>
          <Campo
            rotulo="Data"
            obrigatorio
            placeholder="15/10/2026"
            keyboardType="number-pad"
            maxLength={10}
            value={e.data}
            onChangeText={(t) => mudar('data', mascararDataBR(t))}
            erro={erros.data}
          />
        </View>
        <View style={{ flex: 2 }}>
          <Campo
            rotulo="Hora"
            placeholder="14:30"
            keyboardType="number-pad"
            maxLength={5}
            value={e.hora}
            onChangeText={(t) => mudar('hora', mascararHora(t))}
            erro={erros.hora}
          />
        </View>
      </View>
      <Texto variante="legenda" style={{ marginTop: -8, marginBottom: 16 }}>
        Data futura vira um agendamento, com lembrete no painel.
      </Texto>

      <Campo
        rotulo="Veterinário"
        placeholder="Dra. Paula Reis"
        value={e.veterinario}
        onChangeText={(t) => mudar('veterinario', t)}
      />
      <Campo
        rotulo="Clínica"
        placeholder="VetCare"
        value={e.clinica}
        onChangeText={(t) => mudar('clinica', t)}
      />

      <SecaoRecolhivel
        titulo="Detalhes da consulta"
        subtitulo="Diagnóstico, prescrição e retorno"
        abertaInicialmente={editando && temDetalhes}
      >
        <Campo
          rotulo="Diagnóstico"
          multilinha
          value={e.diagnostico}
          onChangeText={(t) => mudar('diagnostico', t)}
        />
        <Campo
          rotulo="Prescrição"
          multilinha
          value={e.prescricao}
          onChangeText={(t) => mudar('prescricao', t)}
        />
        <Campo
          rotulo="Retorno"
          placeholder="10/11/2026"
          keyboardType="number-pad"
          maxLength={10}
          value={e.retorno}
          onChangeText={(t) => mudar('retorno', mascararDataBR(t))}
          erro={erros.retornoEm}
          dica="Se preencher, o retorno vira um lembrete."
        />
      </SecaoRecolhivel>

      <Texto variante="rotulo" style={{ marginBottom: 8 }}>
        Anexos
      </Texto>
      <View style={{ marginBottom: 16 }}>
        <AnexosPicker anexos={e.anexos} aoMudar={(v) => setE((a) => ({ ...a, anexos: v }))} />
      </View>

      <BlocoPrivado nota="Ficam só neste aparelho. Nunca são enviados a outras pessoas, nem entram na ficha do pet.">
        <Campo
          rotulo="Valor"
          placeholder="280,00"
          keyboardType="decimal-pad"
          value={e.valor}
          onChangeText={(t) => mudar('valor', t)}
          maxLength={12}
          erro={erros.valor}
          dica="Em reais (R$)."
        />
        <Campo
          rotulo="Anotações pessoais"
          multilinha
          value={e.anotacoes}
          onChangeText={(t) => mudar('anotacoes', t)}
        />
      </BlocoPrivado>

      <View style={{ gap: 12 }}>
        <Button titulo={editando ? 'Salvar alterações' : 'Salvar consulta'} aoPressionar={salvar} />
        {editando ? (
          <Button titulo="Excluir consulta" variante="perigo" aoPressionar={confirmarExclusao} />
        ) : null}
      </View>
    </View>
  );
}
