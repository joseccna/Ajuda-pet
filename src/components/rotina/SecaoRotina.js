import React from 'react';
import { CartaoAlimentacao } from './CartaoAlimentacao';
import { CartaoCuidados } from './CartaoCuidados';
import { CartaoPasseios } from './CartaoPasseios';

/** Aba Rotina do pet: alimentação, passeios e cuidados, um cartão para cada. */
export function SecaoRotina({ pet, irPara }) {
  return (
    <>
      <CartaoAlimentacao pet={pet} irPara={irPara} />
      <CartaoPasseios pet={pet} irPara={irPara} />
      <CartaoCuidados pet={pet} irPara={irPara} />
    </>
  );
}
