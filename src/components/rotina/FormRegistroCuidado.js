import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { RegistroCuidado } from '../../models/RegistroCuidado';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { cuidadoService, ErroValidacaoCuidado } from '../../services/CuidadoService';
import { formatarDataBR, lerDataBR, mascararDataBR, paraISO } from '../../utils/datas';
import { centavosParaCampo, lerReais } from '../../utils/dinheiro';
import { BlocoPrivado } from '../ui/BlocoPrivado';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { ChipSelector } from '../ui/ChipSelector';
import { Texto } from '../ui/Texto';

/**
 * Registra um cuidado feito ou agenda um futuro (data depois de hoje).
 * O valor pago fica no bloco privado e nunca sai deste aparelho.
 */
export function FormRegistroCuidado({ tipos, tipoIdInicial, detalhe, aoSalvar, aoExcluir }) {
  const editando = Boolean(detalhe);
  const [tipoId, setTipoId] = useState(detalhe?.registro.tipoId ?? tipoIdInicial ?? tipos[0]?.id ?? '');

  const inicial = useMemo(
    () => ({
      data: detalhe ? formatarDataBR(detalhe.registro.data) : formatarDataBR(paraISO(new Date())),
      local: detalhe?.registro.local ?? '',
      observacao: detalhe?.registro.observacao ?? '',
      valor: centavosParaCampo(detalhe?.privado?.valorCentavos ?? null),
    }),
    [detalhe],
  );
  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(JSON.stringify(e) !== JSON.stringify(inicial));

  const mudar = (campo, valor) => {
    setE((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
  };

  const dataLida = lerDataBR(e.data, new Date(), true);
  const agendando = 'iso' in dataLida && dataLida.iso > paraISO(new Date());

  function salvar() {
    const novosErros = {};
    if ('erro' in dataLida) novosErros.data = dataLida.erro;
    const valor = lerReais(e.valor);
    if ('erro' in valor) novosErros.valor = valor.erro;
    if (!tipoId) novosErros.tipo = 'Escolha o cuidado.';
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const registro = detalhe?.registro ?? new RegistroCuidado();
    registro.tipoId = tipoId;
    registro.data = dataLida.iso;
    registro.local = e.local;
    registro.observacao = e.observacao;

    try {
      cuidadoService.salvarRegistro({ registro, valorCentavos: valor.centavos });
      liberarSaida();
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoCuidado) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir este registro?', 'A próxima data será recalculada com o registro anterior.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          cuidadoService.excluirRegistro(detalhe.registro.id);
          liberarSaida();
          aoExcluir();
        },
      },
    ]);
  }

  const tipo = tipos.find((t) => t.id === tipoId);

  return (
    <View>
      {editando || tipos.length === 1 ? (
        <Texto variante="subtitulo" style={{ marginBottom: 16 }}>
          {tipo?.nome}
        </Texto>
      ) : (
        <ChipSelector
          rotulo="Cuidado"
          valor={tipoId}
          aoMudar={setTipoId}
          opcoes={tipos.map((t) => ({ valor: t.id, rotulo: t.nome }))}
          erro={erros.tipo}
        />
      )}

      <Campo
        rotulo="Data"
        obrigatorio
        placeholder="04/10/2026"
        keyboardType="number-pad"
        maxLength={10}
        value={e.data}
        onChangeText={(t) => mudar('data', mascararDataBR(t))}
        erro={erros.data}
        dica={
          agendando
            ? 'Data futura: vira um agendamento, com lembrete no painel.'
            : 'Use uma data futura para agendar.'
        }
      />
      <Campo
        rotulo="Local"
        placeholder="Banho e Cia"
        value={e.local}
        onChangeText={(t) => mudar('local', t)}
      />
      <Campo
        rotulo="Observações"
        multilinha
        value={e.observacao}
        onChangeText={(t) => mudar('observacao', t)}
      />

      <BlocoPrivado nota="Fica só neste aparelho. Nunca é enviado a outras pessoas, nem entra na ficha do pet.">
        <Campo
          rotulo="Valor"
          placeholder="80,00"
          keyboardType="decimal-pad"
          value={e.valor}
          onChangeText={(t) => mudar('valor', t)}
          maxLength={12}
          erro={erros.valor}
          dica="Em reais (R$)."
        />
      </BlocoPrivado>

      <View style={{ gap: 12 }}>
        <Button
          titulo={editando ? 'Salvar alterações' : agendando ? 'Agendar' : 'Registrar'}
          aoPressionar={salvar}
        />
        {editando ? (
          <Button titulo="Excluir registro" variante="perigo" aoPressionar={confirmarExclusao} />
        ) : null}
      </View>
    </View>
  );
}
