import { descreverPendencias, organizarPainel } from './painelRegras';
import { estadoDoLembrete } from '../models/Lembrete';

const l = (petId, titulo, dias) => ({ chave: `${petId}-${titulo}`, petId, petNome: petId, titulo, dias });

describe('organizarPainel', () => {
  const lembretes = [
    l('mel', 'Antipulgas da Mel', 5),
    l('luna', 'V8 da Luna', 16),
    l('mel', 'Antirrábica da Mel', -5),
    l('thor', 'Passeio do Thor', 0),
    l('luna', 'Vermífugo da Luna', 0),
    l('luna', 'Gripe da Luna', 40),
  ];
  const painel = organizarPainel(lembretes);

  it('hoje traz os atrasados primeiro e depois os de hoje', () => {
    expect(painel.hoje.map((x) => x.titulo)).toEqual([
      'Antirrábica da Mel',
      'Passeio do Thor',
      'Vermífugo da Luna',
    ]);
  });
  it('próximos traz só os dos próximos 14 dias, em ordem', () => {
    expect(painel.proximos.map((x) => x.titulo)).toEqual(['Antipulgas da Mel']);
  });
  it('conta pendentes e atrasados por pet', () => {
    expect(painel.porPet.mel).toEqual({ pendentes: 2, atrasados: 1 });
    expect(painel.porPet.thor).toEqual({ pendentes: 1, atrasados: 0 });
    expect(painel.porPet.luna).toEqual({ pendentes: 1, atrasados: 0 });
  });
});

describe('descreverPendencias', () => {
  it('descreve em português', () => {
    expect(descreverPendencias({ pendentes: 2, atrasados: 0 })).toBe('2 lembretes pendentes');
    expect(descreverPendencias({ pendentes: 1, atrasados: 0 })).toBe('1 lembrete pendente');
    expect(descreverPendencias({ pendentes: 3, atrasados: 1 })).toBe('3 lembretes, 1 atrasado');
    expect(descreverPendencias({ pendentes: 3, atrasados: 2 })).toBe('3 lembretes, 2 atrasados');
    expect(descreverPendencias(undefined)).toBe('');
  });
  it('estado do lembrete define a cor', () => {
    expect(estadoDoLembrete({ dias: -1 })).toBe('atrasado');
    expect(estadoDoLembrete({ dias: 0 })).toBe('hoje');
    expect(estadoDoLembrete({ dias: 3 })).toBe('em-breve');
  });
});
