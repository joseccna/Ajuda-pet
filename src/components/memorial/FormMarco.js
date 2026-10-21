import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { MarcoMemorial } from '../../models/MarcoMemorial';
import { ErroValidacaoMemorial, memorialService } from '../../services/MemorialService';
import { formatarDataBR, lerDataBR, mascararDataBR } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';

/** Um momento da linha do tempo: o que aconteceu e, se quiser, quando. */
export function FormMarco({ pet, marco, aoSalvar, aoExcluir }) {
  const editando = Boolean(marco);
  const inicial = useMemo(
    () => ({ titulo: marco?.titulo ?? '', data: marco?.data ? formatarDataBR(marco.data) : '' }),
    [marco],
  );
  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(JSON.stringify(e) !== JSON.stringify(inicial));

  function salvar() {
    let data = null;
    if (e.data.trim() !== '') {
      const r = lerDataBR(e.data);
      if ('erro' in r) {
        setErros({ data: r.erro });
        return;
      }
      data = r.iso;
    }
    const item = marco ?? new MarcoMemorial({ petId: pet.id });
    item.titulo = e.titulo;
    item.data = data;
    try {
      memorialService.salvarMarco(item);
      liberarSaida();
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoMemorial) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir esta lembrança?', 'Ela sai da linha do tempo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          memorialService.excluirMarco(marco.id);
          liberarSaida();
          aoExcluir();
        },
      },
    ]);
  }

  return (
    <View>
      <Campo
        rotulo="O que aconteceu"
        obrigatorio
        placeholder="Primeiro passeio na praia"
        value={e.titulo}
        onChangeText={(t) => {
          setE((a) => ({ ...a, titulo: t }));
          setErros((a) => ({ ...a, titulo: undefined }));
        }}
        maxLength={80}
        erro={erros.titulo}
      />
      <Campo
        rotulo="Quando"
        placeholder="20/12/2012"
        keyboardType="number-pad"
        maxLength={10}
        value={e.data}
        onChangeText={(t) => {
          setE((a) => ({ ...a, data: mascararDataBR(t) }));
          setErros((a) => ({ ...a, data: undefined }));
        }}
        erro={erros.data}
        dica="Opcional. Sem data, a lembrança fica no fim da linha do tempo."
      />
      <View style={{ gap: 12 }}>
        <Button
          titulo={editando ? 'Salvar alterações' : 'Adicionar à linha do tempo'}
          aoPressionar={salvar}
        />
        {editando ? (
          <Button titulo="Excluir lembrança" variante="perigo" aoPressionar={confirmarExclusao} />
        ) : null}
      </View>
    </View>
  );
}
