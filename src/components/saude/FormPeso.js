import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { RegistroPeso } from '../../models/RegistroPeso';
import { formatarPeso, lerPeso } from '../../models/regrasPeso';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { preferenciasService } from '../../services/PreferenciasService';
import { ErroValidacaoPeso, pesoService } from '../../services/PesoService';
import { formatarDataBR, lerDataBR, mascararDataBR, paraISO } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { ChipSelector } from '../ui/ChipSelector';
import { Texto } from '../ui/Texto';

/** Número para o campo de edição, na unidade certa: 28400 em "28,4" (kg) e 350 em "350" (g). */
function pesoParaCampo(gramas, preferida = 'automatica') {
  if (preferida === 'g' || (preferida === 'automatica' && gramas < 1000))
    return { texto: String(gramas), unidade: 'g' };
  return { texto: String(Math.round(gramas) / 1000).replace('.', ','), unidade: 'kg' };
}

/** Registra (ou edita) uma pesagem. Pergunta "Confere?" se o valor mudou demais. */
export function FormPeso({ pet, registro, aoSalvar, aoExcluir }) {
  const editando = Boolean(registro);
  const ultimo = useMemo(
    () => pesoService.listar(pet.id).find((r) => r.id !== registro?.id) ?? null,
    [pet.id, registro],
  );

  const inicial = useMemo(() => {
    const preferida = preferenciasService.obter().unidadePeso;
    const unidadeInicial =
      preferida === 'automatica' ? (ultimo && ultimo.pesoG < 1000 ? 'g' : 'kg') : preferida;
    const base = registro ? pesoParaCampo(registro.pesoG, preferida) : { texto: '', unidade: unidadeInicial };
    return {
      peso: base.texto,
      unidade: base.unidade,
      data: registro ? formatarDataBR(registro.data) : formatarDataBR(paraISO(new Date())),
      observacao: registro?.observacao ?? '',
    };
  }, [registro, ultimo]);

  const unidadePreferida = preferenciasService.obter().unidadePeso;
  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(JSON.stringify(e) !== JSON.stringify(inicial));

  const mudar = (campo, valor) => {
    setE((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
  };

  function gravar(gramas, dataISO) {
    const item = registro ?? new RegistroPeso({ petId: pet.id });
    item.pesoG = gramas;
    item.data = dataISO;
    item.observacao = e.observacao;
    try {
      pesoService.salvar(item);
      liberarSaida();
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoPeso) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  function salvar() {
    const novosErros = {};
    const peso = lerPeso(e.peso, e.unidade);
    if ('erro' in peso) novosErros.peso = peso.erro;
    const data = lerDataBR(e.data);
    if ('erro' in data) novosErros.data = data.erro;
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const anterior = pesoService.conferirSalto(pet.id, peso.gramas, registro?.id);
    if (anterior) {
      Alert.alert(
        'Confere?',
        `O último peso ${pet.deNome} foi ${formatarPeso(anterior.pesoG, unidadePreferida)} e você digitou ${formatarPeso(peso.gramas, unidadePreferida)}.`,
        [
          { text: 'Corrigir', style: 'cancel' },
          { text: 'Está certo', onPress: () => gravar(peso.gramas, data.iso) },
        ],
      );
      return;
    }
    gravar(peso.gramas, data.iso);
  }

  function confirmarExclusao() {
    Alert.alert('Excluir esta pesagem?', 'O peso atual será recalculado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          pesoService.excluir(registro.id);
          liberarSaida();
          aoExcluir();
        },
      },
    ]);
  }

  return (
    <View>
      <ChipSelector
        rotulo="Unidade"
        valor={e.unidade}
        aoMudar={(v) => mudar('unidade', v)}
        opcoes={[
          { valor: 'kg', rotulo: 'Quilos (kg)' },
          { valor: 'g', rotulo: 'Gramas (g)' },
        ]}
      />
      <Campo
        rotulo="Peso"
        obrigatorio
        placeholder={e.unidade === 'kg' ? '28,4' : '350'}
        keyboardType="decimal-pad"
        value={e.peso}
        onChangeText={(t) => mudar('peso', t)}
        maxLength={8}
        erro={erros.peso}
        dica={ultimo ? `Última pesagem: ${formatarPeso(ultimo.pesoG, unidadePreferida)}.` : undefined}
      />
      <Campo
        rotulo="Data"
        obrigatorio
        placeholder="01/10/2026"
        keyboardType="number-pad"
        maxLength={10}
        value={e.data}
        onChangeText={(t) => mudar('data', mascararDataBR(t))}
        erro={erros.data}
      />
      <Campo
        rotulo="Observação"
        placeholder="Na balança da clínica"
        value={e.observacao}
        onChangeText={(t) => mudar('observacao', t)}
        maxLength={80}
      />
      <View style={{ gap: 12 }}>
        <Button titulo={editando ? 'Salvar alterações' : 'Registrar peso'} aoPressionar={salvar} />
        {editando ? (
          <Button titulo="Excluir pesagem" variante="perigo" aoPressionar={confirmarExclusao} />
        ) : null}
      </View>
      {!editando ? (
        <Texto variante="legenda" style={{ marginTop: 16 }}>
          Pese sempre nas mesmas condições (por exemplo, antes da refeição) para comparar melhor.
        </Texto>
      ) : null}
    </View>
  );
}
