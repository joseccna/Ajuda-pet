import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { Pet } from '../../models/Pet';
import { ErroValidacao, petService } from '../../services/PetService';
import { espaco } from '../../theme';
import { nascimentoVazio, resolverNascimento } from '../../utils/nascimento';
import { formatarDataBR } from '../../utils/datas';
import { Button } from '../ui/Button';
import { Campo } from '../ui/Campo';
import { ChipSelector } from '../ui/ChipSelector';
import { FotoPicker } from '../ui/FotoPicker';
import { SecaoRecolhivel } from '../ui/SecaoRecolhivel';
import { DataNascimentoInput } from './DataNascimentoInput';
function estadoDe(pet) {
  if (!pet) {
    return {
      fotoUri: null,
      nome: '',
      especie: 'cachorro',
      especieOutra: '',
      raca: '',
      sexo: 'desconhecido',
      nascimento: nascimentoVazio,
      cor: '',
      microchip: '',
      castrado: 'desconhecido',
      observacoes: '',
    };
  }
  return {
    fotoUri: pet.fotoUri,
    nome: pet.nome,
    especie: pet.especie,
    especieOutra: pet.especieOutra,
    raca: pet.raca,
    sexo: pet.sexo,
    nascimento: pet.nascimento
      ? { modo: 'exata', texto: formatarDataBR(pet.nascimento), anos: '', meses: '' }
      : nascimentoVazio,
    cor: pet.cor,
    microchip: pet.microchip,
    castrado: pet.castrado,
    observacoes: pet.observacoes,
  };
}
/**
 * Formulário de pet, usado para cadastrar e para editar.
 * Só nome e espécie são obrigatórios; o resto pode ser completado depois.
 */
export function FormPet({ petInicial, aoSalvar }) {
  const navigation = useNavigation();
  const inicial = useMemo(() => JSON.stringify(estadoDe(petInicial)), [petInicial]);
  const [e, setE] = useState(() => estadoDe(petInicial));
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const saindo = useRef(false);
  const mudou = JSON.stringify(e) !== inicial;
  const mudouRef = useRef(mudou);
  mudouRef.current = mudou;
  function mudar(campo, valor) {
    setE((atual) => ({ ...atual, [campo]: valor }));
    if (campo in erros) setErros((atual) => ({ ...atual, [campo]: undefined }));
  }
  // Pede confirmação ao sair (botão fechar ou botão voltar do celular) com dados não salvos.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (evento) => {
      if (saindo.current || !mudouRef.current) return;
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
  function montarPet() {
    const nasc = resolverNascimento(e.nascimento);
    const pet = petInicial ?? new Pet();
    pet.nome = e.nome;
    pet.especie = e.especie;
    pet.especieOutra = e.especie === 'outro' ? e.especieOutra : '';
    pet.raca = e.raca;
    pet.sexo = e.sexo;
    pet.nascimento = nasc.iso;
    pet.nascimentoAproximado = nasc.aproximada;
    pet.fotoUri = e.fotoUri;
    pet.cor = e.cor;
    pet.microchip = e.microchip;
    pet.castrado = e.castrado;
    pet.observacoes = e.observacoes;
    return { pet, nascimentoErro: nasc.erro };
  }
  function gravar(pet) {
    setSalvando(true);
    try {
      const salvo = petService.salvar(pet);
      saindo.current = true;
      aoSalvar(salvo);
    } catch (erro) {
      if (erro instanceof ErroValidacao) setErros(erro.erros);
      else Alert.alert('Não foi possível salvar', 'Tente de novo. Se o problema continuar, reinicie o app.');
    } finally {
      setSalvando(false);
    }
  }
  function aoPressionarSalvar() {
    const { pet, nascimentoErro } = montarPet();
    const errosPet = pet.validar();
    if (Object.keys(errosPet).length > 0 || nascimentoErro) {
      setErros({ ...errosPet, nascimento: nascimentoErro });
      return;
    }
    if (petService.nomeJaExiste(pet.nome, petInicial?.id)) {
      Alert.alert(
        'Já existe um pet com esse nome',
        `Você já cadastrou ${pet.nome.trim()}. Deseja salvar mesmo assim?`,
        [
          { text: 'Voltar', style: 'cancel' },
          { text: 'Salvar mesmo assim', onPress: () => gravar(pet) },
        ],
      );
      return;
    }
    gravar(pet);
  }
  return (
    <View>
      <FotoPicker uri={e.fotoUri} nome={e.nome} aoMudar={(u) => mudar('fotoUri', u)} />

      <Campo
        rotulo="Nome"
        obrigatorio
        placeholder="Thor"
        value={e.nome}
        onChangeText={(t) => mudar('nome', t)}
        autoCapitalize="words"
        maxLength={60}
        erro={erros.nome}
      />

      <ChipSelector
        rotulo="Espécie"
        valor={e.especie}
        aoMudar={(v) => mudar('especie', v)}
        opcoes={[
          { valor: 'cachorro', rotulo: 'Cachorro' },
          { valor: 'gato', rotulo: 'Gato' },
          { valor: 'outro', rotulo: 'Outro' },
        ]}
        erro={e.especie === 'outro' ? undefined : erros.especie}
      />
      {e.especie === 'outro' ? (
        <Campo
          rotulo="Qual espécie?"
          placeholder="Coelho"
          value={e.especieOutra}
          onChangeText={(t) => mudar('especieOutra', t)}
          erro={erros.especie}
        />
      ) : null}

      <Campo
        rotulo="Raça"
        placeholder="Labrador"
        value={e.raca}
        onChangeText={(t) => mudar('raca', t)}
        autoCapitalize="words"
        dica="Sem raça definida? Deixe em branco."
      />

      <ChipSelector
        rotulo="Sexo"
        valor={e.sexo}
        aoMudar={(v) => mudar('sexo', v)}
        opcoes={[
          { valor: 'macho', rotulo: 'Macho' },
          { valor: 'femea', rotulo: 'Fêmea' },
          { valor: 'desconhecido', rotulo: 'Não sei' },
        ]}
      />

      <DataNascimentoInput
        valor={e.nascimento}
        aoMudar={(v) => {
          setE((atual) => ({ ...atual, nascimento: v }));
          if (erros.nascimento) setErros((atual) => ({ ...atual, nascimento: undefined }));
        }}
        erro={erros.nascimento}
      />

      <SecaoRecolhivel titulo="Mais detalhes" subtitulo="Cor, microchip, castração e observações">
        <Campo
          rotulo="Cor ou pelagem"
          placeholder="Caramelo"
          value={e.cor}
          onChangeText={(t) => mudar('cor', t)}
        />
        <Campo
          rotulo="Microchip"
          placeholder="985 112 004 567 890"
          keyboardType="number-pad"
          value={e.microchip}
          onChangeText={(t) => mudar('microchip', t)}
        />
        <ChipSelector
          rotulo="Castrado"
          valor={e.castrado}
          aoMudar={(v) => mudar('castrado', v)}
          opcoes={[
            { valor: 'sim', rotulo: 'Sim' },
            { valor: 'nao', rotulo: 'Não' },
            { valor: 'desconhecido', rotulo: 'Não sei' },
          ]}
        />
        <Campo
          rotulo="Observações"
          multilinha
          placeholder="Alergias, manias, cuidados"
          value={e.observacoes}
          onChangeText={(t) => mudar('observacoes', t)}
        />
      </SecaoRecolhivel>

      <View style={{ gap: espaco.sm }}>
        <Button
          titulo={petInicial ? 'Salvar alterações' : 'Salvar pet'}
          aoPressionar={aoPressionarSalvar}
          carregando={salvando}
        />
      </View>
    </View>
  );
}
