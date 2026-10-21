import React from 'react';
import { useCarteirinha } from '../../hooks/useCarteirinha';
import { Button } from '../ui/Button';
import { EstadoVazio } from '../ui/EstadoVazio';
import { VacinaCard } from './VacinaCard';

/** Carteirinha de vacinas do pet: um cartão por vacina, com o histórico de doses. */
export function SecaoVacinas({ pet, irPara }) {
  const { cartoes } = useCarteirinha(pet.id);

  if (cartoes.length === 0) {
    return (
      <EstadoVazio
        icone="shield-checkmark-outline"
        titulo="Nenhuma vacina cadastrada"
        texto="Adicione as vacinas à carteirinha e registre as doses para ver quando é a próxima."
      >
        <Button titulo="Adicionar vacina" icone="add" aoPressionar={() => irPara('/pet/[id]/vacina-nova')} />
      </EstadoVazio>
    );
  }

  return (
    <>
      {cartoes.map((item, i) => (
        <VacinaCard
          key={item.tipo.id}
          item={item}
          abertoInicialmente={i === 0}
          aoRegistrarDose={() => irPara('/pet/[id]/dose', { tipoId: item.tipo.id })}
          aoEditarDose={(dose) => irPara('/pet/[id]/dose', { doseId: dose.id })}
        />
      ))}
      <Button
        titulo="Adicionar vacina"
        variante="secundario"
        icone="add"
        aoPressionar={() => irPara('/pet/[id]/vacina-nova')}
      />
    </>
  );
}
