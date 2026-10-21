import React from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CuidadoCard } from '../../../components/rotina/CuidadoCard';
import { Button } from '../../../components/ui/Button';
import { Cabecalho } from '../../../components/ui/Cabecalho';
import { EstadoVazio } from '../../../components/ui/EstadoVazio';
import { Screen } from '../../../components/ui/Screen';
import { usePet } from '../../../hooks/usePet';
import { useCuidados } from '../../../hooks/useRotina';
import { cuidadoService } from '../../../services/CuidadoService';

/** Todos os cuidados do pet, cada um com o histórico dentro. */
export default function TodosOsCuidados() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { pet } = usePet(id);
  const { cartoes, recarregar } = useCuidados(id);

  const ir = (pathname, params = {}) => router.push({ pathname, params: { id, ...params } });

  function excluirTipo(item) {
    Alert.alert(
      `Excluir ${item.tipo.nome}?`,
      'O histórico e os valores privados desse cuidado também serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            cuidadoService.excluirTipo(item.tipo.id);
            recarregar();
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <Cabecalho titulo={pet ? `Cuidados ${pet.deNome}` : 'Cuidados'} aoVoltar={() => router.back()} />
      {cartoes.length === 0 ? (
        <EstadoVazio
          icone="sparkles-outline"
          titulo="Nenhum cuidado cadastrado"
          texto="Cadastre banho, tosa, antipulgas ou o que o seu pet precisa."
        >
          <Button titulo="Adicionar cuidado" icone="add" aoPressionar={() => ir('/pet/[id]/cuidado-novo')} />
        </EstadoVazio>
      ) : (
        <>
          {cartoes.map((item, i) => (
            <CuidadoCard
              key={item.tipo.id}
              item={item}
              abertoInicialmente={i === 0}
              aoRegistrar={() => ir('/pet/[id]/cuidado-registro', { tipoId: item.tipo.id })}
              aoEditar={(r) => ir('/pet/[id]/cuidado-registro', { registroId: r.id })}
              aoExcluirTipo={() => excluirTipo(item)}
            />
          ))}
          <Button
            titulo="Adicionar cuidado"
            variante="secundario"
            icone="add"
            aoPressionar={() => ir('/pet/[id]/cuidado-novo')}
          />
        </>
      )}
    </Screen>
  );
}
