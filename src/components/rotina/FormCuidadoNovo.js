import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { CATALOGO_CUIDADOS, ICONE_PADRAO } from '../../models/regrasCuidado';
import { useConfirmarSaida } from '../../hooks/useConfirmarSaida';
import { cuidadoService, ErroValidacaoCuidado } from '../../services/CuidadoService';
import { lerDataBR, mascararDataBR } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { ChipSelector } from '../ui/ChipSelector';
import { Texto } from '../ui/Texto';

const INTERVALOS = [
  { valor: '7', rotulo: '7 dias' },
  { valor: '15', rotulo: '15 dias' },
  { valor: '30', rotulo: '30 dias' },
  { valor: '60', rotulo: '60 dias' },
  { valor: '90', rotulo: '90 dias' },
  { valor: 'nenhum', rotulo: 'Sem periodicidade' },
  { valor: 'outro', rotulo: 'Outro' },
];

/** Novo tipo de cuidado (banho, tosa...), com sugestões e o intervalo entre uma vez e outra. */
export function FormCuidadoNovo({ pet, aoSalvar }) {
  const [nome, setNome] = useState('');
  const [icone, setIcone] = useState(ICONE_PADRAO);
  const [intervalo, setIntervalo] = useState('30');
  const [diasOutro, setDiasOutro] = useState('');
  const [ultimo, setUltimo] = useState('');
  const [erros, setErros] = useState({});
  const { liberarSaida } = useConfirmarSaida(nome !== '' || ultimo !== '' || diasOutro !== '');

  function escolherSugestao(valor) {
    const s = CATALOGO_CUIDADOS.find((x) => x.nome === valor);
    if (!s) return;
    setNome(s.nome);
    setIcone(s.icone);
    const texto = String(s.intervaloDias);
    if (INTERVALOS.some((i) => i.valor === texto)) {
      setIntervalo(texto);
    } else {
      setIntervalo('outro');
      setDiasOutro(texto);
    }
    setErros((a) => ({ ...a, nome: undefined }));
  }

  function salvar() {
    const novosErros = {};
    let intervaloDias = null;
    if (intervalo === 'outro') intervaloDias = diasOutro.trim() === '' ? NaN : Number(diasOutro);
    else if (intervalo !== 'nenhum') intervaloDias = Number(intervalo);

    let dataUltimo = null;
    if (ultimo.trim() !== '') {
      const r = lerDataBR(ultimo);
      if ('erro' in r) novosErros.ultimo = r.erro;
      else dataUltimo = r.iso;
    }
    if (nome.trim() !== '' && cuidadoService.nomeDeTipoJaExiste(pet.id, nome)) {
      novosErros.nome = 'Esse cuidado já está na lista. Abra-o para registrar de novo.';
    }
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    try {
      const tipo = cuidadoService.criarTipo({ petId: pet.id, nome, icone, intervaloDias, dataUltimo });
      liberarSaida();
      aoSalvar(tipo);
    } catch (e) {
      if (e instanceof ErroValidacaoCuidado)
        setErros({ nome: e.erros.nome, intervalo: e.erros.intervaloDias });
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    }
  }

  return (
    <View>
      <ChipSelector
        rotulo="Cuidados comuns"
        valor={nome}
        aoMudar={escolherSugestao}
        opcoes={CATALOGO_CUIDADOS.map((c) => ({ valor: c.nome, rotulo: c.nome }))}
      />
      <Campo
        rotulo="Nome do cuidado"
        obrigatorio
        placeholder="Banho"
        value={nome}
        onChangeText={(t) => {
          setNome(t);
          setErros((a) => ({ ...a, nome: undefined }));
        }}
        maxLength={40}
        erro={erros.nome}
      />

      <ChipSelector rotulo="Repetir a cada" valor={intervalo} aoMudar={setIntervalo} opcoes={INTERVALOS} />
      {intervalo === 'outro' ? (
        <Campo
          rotulo="Intervalo em dias"
          placeholder="45"
          keyboardType="number-pad"
          maxLength={4}
          value={diasOutro}
          onChangeText={(t) => setDiasOutro(t.replace(/\D/g, ''))}
          erro={erros.intervalo}
        />
      ) : (
        <Texto variante="legenda" style={{ marginTop: -8, marginBottom: 16 }}>
          {intervalo === 'nenhum'
            ? 'Sem previsão: o app só guarda o histórico.'
            : 'O app calcula a próxima data a partir do último registro.'}
        </Texto>
      )}

      <Campo
        rotulo="Data da última vez"
        placeholder="10/09/2026"
        keyboardType="number-pad"
        maxLength={10}
        value={ultimo}
        onChangeText={(t) => {
          setUltimo(mascararDataBR(t));
          setErros((a) => ({ ...a, ultimo: undefined }));
        }}
        erro={erros.ultimo}
        dica="Opcional. Se souber, a próxima já é calculada."
      />

      <Button titulo="Adicionar cuidado" aoPressionar={salvar} />
    </View>
  );
}
