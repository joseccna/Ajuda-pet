import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { LembreteAvulso } from '../../models/LembreteAvulso';
import { ANTECEDENCIAS, REPETICOES, TIPOS_LEMBRETE } from '../../models/regrasAgenda';
import { lerHora, mascararHora } from '../../models/regrasConsulta';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { ErroValidacaoLembrete, lembreteAvulsoService } from '../../services/LembreteAvulsoService';
import { formatarDataBR, lerDataBR, mascararDataBR, paraISO } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { ChipSelector } from '../ui/ChipSelector';
import { Texto } from '../ui/Texto';

/**
 * Cria ou edita um lembrete avulso. Só pet, tipo e título são necessários: a data começa no dia
 * escolhido na agenda e o aviso com 3 dias de antecedência já vem marcado.
 */
export function FormLembrete({ pets, lembrete, petIdInicial, dataInicial, aoSalvar, aoExcluir }) {
  const editando = Boolean(lembrete);

  const inicial = useMemo(
    () => ({
      petId: lembrete?.petId ?? petIdInicial ?? pets[0]?.id ?? '',
      tipo: lembrete?.tipo ?? 'medicacao',
      titulo: lembrete?.titulo ?? '',
      data: formatarDataBR(lembrete?.data ?? dataInicial ?? paraISO(new Date())),
      hora: lembrete?.hora ?? '',
      repetir: lembrete?.repetir ?? 'nao',
      antecedencia: String(lembrete?.antecedenciaDias ?? 3),
      observacao: lembrete?.observacao ?? '',
    }),
    [lembrete, petIdInicial, dataInicial, pets],
  );
  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(JSON.stringify(e) !== JSON.stringify(inicial));

  const mudar = (campo, valor) => {
    setE((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
  };

  function escolherTipo(valor) {
    const rotulo = TIPOS_LEMBRETE.find((t) => t.valor === valor)?.rotulo ?? '';
    setE((a) => ({ ...a, tipo: valor, titulo: a.titulo.trim() === '' ? rotulo : a.titulo }));
  }

  function salvar() {
    const novosErros = {};
    const data = lerDataBR(e.data, new Date(), true);
    if ('erro' in data) novosErros.data = data.erro;
    const hora = lerHora(e.hora);
    if ('erro' in hora) novosErros.hora = hora.erro;
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const item = lembrete ?? new LembreteAvulso();
    item.petId = e.petId;
    item.tipo = e.tipo;
    item.titulo = e.titulo;
    item.data = data.iso;
    item.hora = hora.hora;
    item.repetir = e.repetir;
    item.antecedenciaDias = Number(e.antecedencia);
    item.observacao = e.observacao;

    try {
      lembreteAvulsoService.salvar(item);
      liberarSaida();
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoLembrete) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  function marcarFeito() {
    lembreteAvulsoService.concluir(lembrete.id);
    liberarSaida();
    aoSalvar();
  }

  function confirmarExclusao() {
    Alert.alert(
      'Excluir este lembrete?',
      e.repetir !== 'nao' ? 'Ele deixa de se repetir.' : 'Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            lembreteAvulsoService.excluir(lembrete.id);
            liberarSaida();
            aoExcluir();
          },
        },
      ],
    );
  }

  return (
    <View>
      {pets.length > 1 ? (
        <ChipSelector
          rotulo="Para qual pet"
          valor={e.petId}
          aoMudar={(v) => mudar('petId', v)}
          opcoes={pets.map((p) => ({ valor: p.id, rotulo: p.nome }))}
          erro={erros.petId}
        />
      ) : null}

      <ChipSelector
        rotulo="O que é"
        valor={e.tipo}
        aoMudar={escolherTipo}
        opcoes={TIPOS_LEMBRETE.map((t) => ({ valor: t.valor, rotulo: t.rotulo }))}
      />
      <Campo
        rotulo="Título"
        obrigatorio
        placeholder="Vermífugo"
        value={e.titulo}
        onChangeText={(t) => mudar('titulo', t)}
        maxLength={60}
        erro={erros.titulo}
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 3 }}>
          <Campo
            rotulo="Data"
            obrigatorio
            placeholder="18/10/2026"
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
            placeholder="09:00"
            keyboardType="number-pad"
            maxLength={5}
            value={e.hora}
            onChangeText={(t) => mudar('hora', mascararHora(t))}
            erro={erros.hora}
          />
        </View>
      </View>

      <ChipSelector
        rotulo="Repetir"
        valor={e.repetir}
        aoMudar={(v) => mudar('repetir', v)}
        opcoes={REPETICOES}
      />
      <ChipSelector
        rotulo="Avisar com antecedência"
        valor={e.antecedencia}
        aoMudar={(v) => mudar('antecedencia', v)}
        opcoes={ANTECEDENCIAS.map((a) => ({ valor: String(a.valor), rotulo: a.rotulo }))}
      />
      <Texto variante="legenda" style={{ marginTop: -8, marginBottom: 16 }}>
        Você também recebe um aviso no dia{e.hora ? ', 1 hora antes' : ', às 9h'}.
      </Texto>

      <Campo
        rotulo="Observação"
        multilinha
        placeholder="Comprar o comprimido antes"
        value={e.observacao}
        onChangeText={(t) => mudar('observacao', t)}
      />

      <View style={{ gap: 12 }}>
        <Button titulo={editando ? 'Salvar alterações' : 'Salvar lembrete'} aoPressionar={salvar} />
        {editando ? (
          <>
            <Button
              titulo={e.repetir !== 'nao' ? 'Marcar como feito e ir para a próxima' : 'Marcar como feito'}
              variante="secundario"
              icone="checkmark"
              aoPressionar={marcarFeito}
            />
            <Button titulo="Excluir lembrete" variante="perigo" aoPressionar={confirmarExclusao} />
          </>
        ) : null}
      </View>
    </View>
  );
}
