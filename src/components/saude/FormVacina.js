import React, { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { descreverIntervalo, sugestoesPara } from '../../models/catalogoVacinas';
import { ErroValidacaoVacina, vacinaService } from '../../services/VacinaService';
import { lerDataBR, mascararDataBR } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { ChipSelector } from '../ui/ChipSelector';
import { Texto } from '../ui/Texto';

const INTERVALOS = [
  { valor: '180', rotulo: '6 meses' },
  { valor: '365', rotulo: '1 ano' },
  { valor: '730', rotulo: '2 anos' },
  { valor: 'nenhum', rotulo: 'Sem reforço' },
  { valor: 'outro', rotulo: 'Outro' },
];

/** Cadastra um novo cartão na carteirinha, com sugestões de vacinas comuns para a espécie. */
export function FormVacina({ pet, aoSalvar }) {
  const navigation = useNavigation();
  const sugestoes = sugestoesPara(pet.especie);
  const [nome, setNome] = useState('');
  const [intervalo, setIntervalo] = useState('365');
  const [diasOutro, setDiasOutro] = useState('');
  const [ultima, setUltima] = useState('');
  const [erros, setErros] = useState({});
  const saindo = useRef(false);
  const mudou = useRef(false);
  mudou.current = nome !== '' || ultima !== '' || diasOutro !== '';

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

  function escolherSugestao(valor) {
    const s = sugestoes.find((x) => x.nome === valor);
    if (!s) return;
    setNome(s.nome);
    setErros((e) => ({ ...e, nome: undefined }));
    const dias = s.intervaloDias;
    setIntervalo(
      dias === null ? 'nenhum' : INTERVALOS.some((i) => i.valor === String(dias)) ? String(dias) : 'outro',
    );
    if (dias !== null && !INTERVALOS.some((i) => i.valor === String(dias))) setDiasOutro(String(dias));
  }

  function salvar() {
    const novosErros = {};
    let intervaloDias = null;
    if (intervalo === 'outro') {
      intervaloDias = diasOutro.trim() === '' ? NaN : Number(diasOutro);
    } else if (intervalo !== 'nenhum') {
      intervaloDias = Number(intervalo);
    }

    let dataUltimaDose = null;
    if (ultima.trim() !== '') {
      const r = lerDataBR(ultima);
      if ('erro' in r) novosErros.ultima = r.erro;
      else dataUltimaDose = r.iso;
    }
    if (nome.trim() !== '' && vacinaService.nomeDeTipoJaExiste(pet.id, nome)) {
      novosErros.nome = 'Essa vacina já está na carteirinha. Abra o cartão e registre a dose.';
    }
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    try {
      const tipo = vacinaService.criarTipo({ petId: pet.id, nome, intervaloDias, dataUltimaDose });
      saindo.current = true;
      aoSalvar(tipo);
    } catch (e) {
      if (e instanceof ErroValidacaoVacina) {
        setErros({ nome: e.erros.nome, intervalo: e.erros.intervaloDias });
      } else {
        Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
      }
    }
  }

  return (
    <View>
      <ChipSelector
        rotulo="Vacinas comuns"
        valor={nome}
        aoMudar={escolherSugestao}
        opcoes={sugestoes.map((s) => ({ valor: s.nome, rotulo: s.nome }))}
      />
      <Campo
        rotulo="Nome da vacina"
        obrigatorio
        placeholder="V10"
        value={nome}
        onChangeText={(t) => {
          setNome(t);
          setErros((e) => ({ ...e, nome: undefined }));
        }}
        maxLength={60}
        erro={erros.nome}
      />

      <ChipSelector rotulo="Reforço a cada" valor={intervalo} aoMudar={setIntervalo} opcoes={INTERVALOS} />
      {intervalo === 'outro' ? (
        <Campo
          rotulo="Intervalo em dias"
          placeholder="365"
          keyboardType="number-pad"
          maxLength={4}
          value={diasOutro}
          onChangeText={(t) => setDiasOutro(t.replace(/\D/g, ''))}
          erro={erros.intervalo}
        />
      ) : (
        <Texto variante="legenda" style={{ marginTop: -8, marginBottom: 16 }}>
          {descreverIntervalo(intervalo === 'nenhum' ? null : Number(intervalo))}. Confira o intervalo com o
          veterinário.
        </Texto>
      )}

      <Campo
        rotulo="Data da última dose"
        placeholder="18/10/2025"
        keyboardType="number-pad"
        maxLength={10}
        value={ultima}
        onChangeText={(t) => {
          setUltima(mascararDataBR(t));
          setErros((e) => ({ ...e, ultima: undefined }));
        }}
        erro={erros.ultima}
        dica="Opcional. Se souber, a próxima dose já é calculada."
      />

      <Button titulo="Adicionar vacina" aoPressionar={salvar} />
    </View>
  );
}
