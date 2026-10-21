import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { DoseVacina } from '../../models/DoseVacina';
import { ErroValidacaoVacina, vacinaService } from '../../services/VacinaService';
import { formatarDataBR, lerDataBR, mascararDataBR, paraISO, somarDias } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { ChipSelector } from '../ui/ChipSelector';
import { SecaoRecolhivel } from '../ui/SecaoRecolhivel';
import { Texto } from '../ui/Texto';

/**
 * Registra (ou edita) uma dose de vacina.
 * A próxima dose é calculada pelo intervalo do tipo, mas pode ser ajustada à mão.
 */
export function FormDose({ tipos, tipoIdInicial, dose, aoSalvar, aoExcluir }) {
  const navigation = useNavigation();
  const editando = Boolean(dose);
  const [tipoId, setTipoId] = useState(dose?.tipoId ?? tipoIdInicial ?? tipos[0]?.id ?? '');
  const tipo = tipos.find((t) => t.id === tipoId);

  const inicial = useMemo(
    () => ({
      data: dose ? formatarDataBR(dose.dataAplicacao) : formatarDataBR(paraISO(new Date())),
      rotulo: dose ? dose.rotulo : tipoId ? vacinaService.rotuloParaProximaDose(tipoId) : '1ª dose',
      proxima: dose?.proximaDoseManual ? formatarDataBR(dose.proximaDoseManual) : '',
      lote: dose?.lote ?? '',
      veterinario: dose?.veterinario ?? '',
      clinica: dose?.clinica ?? '',
      observacao: dose?.observacao ?? '',
    }),
    // O valor inicial é calculado uma vez, quando a tela abre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const saindo = useRef(false);
  const mudou = useRef(false);
  mudou.current = JSON.stringify(e) !== JSON.stringify(inicial);

  function mudar(campo, valor) {
    setE((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo === 'data' ? 'dataAplicacao' : campo]: undefined }));
  }

  useEffect(() => {
    return navigation.addListener('beforeRemove', (evento) => {
      if (saindo.current || !mudou.current) return;
      evento.preventDefault();
      Alert.alert('Descartar alterações?', 'O que você preencheu não será salvo.', [
        { text: 'Continuar editando', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            saindo.current = true;
            navigation.dispatch(evento.data.action);
          },
        },
      ]);
    });
  }, [navigation]);

  // Próxima dose calculada, mostrada como dica enquanto o campo manual está vazio.
  const dataLida = lerDataBR(e.data);
  const calculada =
    'iso' in dataLida && tipo?.intervaloDias
      ? formatarDataBR(somarDias(dataLida.iso, tipo.intervaloDias))
      : null;

  function salvar() {
    const novosErros = {};
    const aplicacao = lerDataBR(e.data);
    if ('erro' in aplicacao) novosErros.dataAplicacao = aplicacao.erro;

    let proximaManual = null;
    if (e.proxima.trim() !== '') {
      const p = lerDataBR(e.proxima, new Date(), true);
      if ('erro' in p) novosErros.proximaDoseManual = p.erro;
      else proximaManual = p.iso;
    }
    if (!tipoId) novosErros.tipo = 'Escolha a vacina.';
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const registro = dose ?? new DoseVacina();
    registro.tipoId = tipoId;
    registro.rotulo = e.rotulo;
    registro.dataAplicacao = aplicacao.iso;
    registro.proximaDoseManual = proximaManual;
    registro.lote = e.lote;
    registro.veterinario = e.veterinario;
    registro.clinica = e.clinica;
    registro.observacao = e.observacao;

    try {
      vacinaService.salvarDose(registro);
      saindo.current = true;
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoVacina) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir esta dose?', 'A próxima dose será recalculada com a dose anterior.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          vacinaService.excluirDose(dose.id);
          saindo.current = true;
          aoExcluir();
        },
      },
    ]);
  }

  return (
    <View>
      {editando || tipos.length === 1 ? (
        <Texto variante="subtitulo" style={{ marginBottom: 16 }}>
          {tipo?.nome}
        </Texto>
      ) : (
        <ChipSelector
          rotulo="Vacina"
          valor={tipoId}
          aoMudar={(v) => {
            setTipoId(v);
            setE((a) => ({ ...a, rotulo: vacinaService.rotuloParaProximaDose(v) }));
          }}
          opcoes={tipos.map((t) => ({ valor: t.id, rotulo: t.nome }))}
          erro={erros.tipo}
        />
      )}

      <Campo
        rotulo="Data da aplicação"
        obrigatorio
        placeholder="18/10/2026"
        keyboardType="number-pad"
        maxLength={10}
        value={e.data}
        onChangeText={(t) => mudar('data', mascararDataBR(t))}
        erro={erros.dataAplicacao}
      />
      <Campo
        rotulo="Nome da dose"
        obrigatorio
        placeholder="Reforço"
        value={e.rotulo}
        onChangeText={(t) => mudar('rotulo', t)}
        maxLength={40}
        erro={erros.rotulo}
        dica="Sugerimos 1ª, 2ª e 3ª dose, e depois Reforço."
      />
      <Campo
        rotulo="Próxima dose"
        placeholder={calculada ?? 'Sem previsão'}
        keyboardType="number-pad"
        maxLength={10}
        value={e.proxima}
        onChangeText={(t) => mudar('proxima', mascararDataBR(t))}
        erro={erros.proximaDoseManual}
        dica={
          e.proxima
            ? 'Data ajustada por você.'
            : calculada
              ? `Calculada pelo intervalo: ${calculada}. Preencha só se o veterinário indicar outra data.`
              : 'Sem reforço previsto. Preencha se o veterinário indicar uma data.'
        }
      />

      <SecaoRecolhivel titulo="Mais detalhes" subtitulo="Lote, veterinário, clínica e observações">
        <Campo rotulo="Lote" value={e.lote} onChangeText={(t) => mudar('lote', t)} />
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
        <Campo
          rotulo="Observações"
          multilinha
          value={e.observacao}
          onChangeText={(t) => mudar('observacao', t)}
        />
      </SecaoRecolhivel>

      <View style={{ gap: 12 }}>
        <Button titulo={editando ? 'Salvar alterações' : 'Registrar dose'} aoPressionar={salvar} />
        {editando ? (
          <Button titulo="Excluir dose" variante="perigo" aoPressionar={confirmarExclusao} />
        ) : null}
      </View>
    </View>
  );
}
