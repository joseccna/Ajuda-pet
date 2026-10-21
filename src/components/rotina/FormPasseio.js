import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { mascararHora, lerHora } from '../../models/regrasConsulta';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { ErroValidacaoPasseio, passeioService } from '../../services/PasseioService';
import { formatarDataBR, lerDataBR, mascararDataBR, paraISO } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { Texto } from '../ui/Texto';

function dois(n) {
  return String(n).padStart(2, '0');
}

/** "1,8" ou "1.8" em número; vazio vira null; texto inválido vira NaN. */
function lerDecimal(texto) {
  const t = texto.trim().replace(',', '.');
  if (t === '') return null;
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
}

/** Registra um passeio que já aconteceu (ou edita um da lista): data, hora, duração e distância. */
export function FormPasseio({ pet, passeio, aoSalvar, aoExcluir }) {
  const editando = Boolean(passeio);

  const inicial = useMemo(() => {
    if (passeio) {
      const d = new Date(passeio.inicio);
      return {
        data: formatarDataBR(paraISO(d)),
        hora: `${dois(d.getHours())}:${dois(d.getMinutes())}`,
        duracao: passeio.duracaoMin ? String(passeio.duracaoMin) : '',
        distancia: passeio.distanciaKm !== null ? String(passeio.distanciaKm).replace('.', ',') : '',
        observacao: passeio.observacao,
      };
    }
    return {
      data: formatarDataBR(paraISO(new Date())),
      hora: '',
      duracao: '',
      distancia: '',
      observacao: '',
    };
  }, [passeio]);

  const [e, setE] = useState(inicial);
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(JSON.stringify(e) !== JSON.stringify(inicial));

  const mudar = (campo, valor) => {
    setE((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
  };

  function salvar() {
    const novosErros = {};
    const data = lerDataBR(e.data);
    if ('erro' in data) novosErros.data = data.erro;
    const hora = lerHora(e.hora);
    if ('erro' in hora) novosErros.hora = hora.erro;
    const duracaoMin = e.duracao.trim() === '' ? NaN : Number(e.duracao);
    const distanciaKm = lerDecimal(e.distancia);
    if (Number.isNaN(distanciaKm))
      novosErros.distanciaKm = 'Informe a distância em quilômetros, por exemplo 1,8.';
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    try {
      if (editando) {
        const [a, m, d] = data.iso.split('-').map(Number);
        const [h, mi] = (
          hora.hora ||
          `${dois(new Date(passeio.inicio).getHours())}:${dois(new Date(passeio.inicio).getMinutes())}`
        )
          .split(':')
          .map(Number);
        const inicio = new Date(a, m - 1, d, h, mi, 0);
        passeio.inicio = inicio.toISOString();
        passeio.duracaoMin = duracaoMin;
        passeio.fim = new Date(
          inicio.getTime() + (Number.isFinite(duracaoMin) ? duracaoMin : 0) * 60000,
        ).toISOString();
        passeio.distanciaKm = distanciaKm;
        passeio.observacao = e.observacao;
        passeioService.salvar(passeio);
      } else {
        passeioService.registrarManual({
          petId: pet.id,
          data: data.iso,
          hora: hora.hora,
          duracaoMin,
          distanciaKm,
          observacao: e.observacao,
        });
      }
      liberarSaida();
      aoSalvar();
    } catch (erro) {
      if (erro instanceof ErroValidacaoPasseio) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  function confirmarExclusao() {
    Alert.alert('Excluir este passeio?', 'As marcações dele também serão apagadas.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          passeioService.excluir(passeio.id);
          liberarSaida();
          aoExcluir();
        },
      },
    ]);
  }

  return (
    <View>
      <Campo
        rotulo="Data"
        obrigatorio
        placeholder="02/10/2026"
        keyboardType="number-pad"
        maxLength={10}
        value={e.data}
        onChangeText={(t) => mudar('data', mascararDataBR(t))}
        erro={erros.data}
      />
      <Campo
        rotulo="Hora de início"
        placeholder="18:00"
        keyboardType="number-pad"
        maxLength={5}
        value={e.hora}
        onChangeText={(t) => mudar('hora', mascararHora(t))}
        erro={erros.hora}
        dica="Opcional."
      />
      <Campo
        rotulo="Duração (minutos)"
        obrigatorio
        placeholder="30"
        keyboardType="number-pad"
        maxLength={4}
        value={e.duracao}
        onChangeText={(t) => mudar('duracao', t.replace(/\D/g, ''))}
        erro={erros.duracaoMin}
      />
      <Campo
        rotulo="Distância (km)"
        placeholder="1,8"
        keyboardType="decimal-pad"
        value={e.distancia}
        onChangeText={(t) => mudar('distancia', t)}
        erro={erros.distanciaKm}
        dica="Opcional. O app não usa a localização: a distância é só o que você informar."
      />
      <Campo
        rotulo="Observação"
        multilinha
        placeholder="Parque, praia, brincou muito"
        value={e.observacao}
        onChangeText={(t) => mudar('observacao', t)}
      />
      <View style={{ gap: 12 }}>
        <Button titulo={editando ? 'Salvar alterações' : 'Registrar passeio'} aoPressionar={salvar} />
        {editando ? (
          <Button titulo="Excluir passeio" variante="perigo" aoPressionar={confirmarExclusao} />
        ) : null}
      </View>
      {!editando ? (
        <Texto variante="legenda" style={{ marginTop: 16 }}>
          Para medir o tempo na hora, use o botão "Iniciar passeio" na aba Rotina.
        </Texto>
      ) : null}
    </View>
  );
}
