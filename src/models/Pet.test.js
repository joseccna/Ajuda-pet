import { Pet } from './Pet';
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `uuid-${++n}` };
});
describe('Pet', () => {
  it('gera id e carimbos de data ao criar', () => {
    const pet = new Pet({ nome: 'Thor' });
    expect(pet.id).toMatch(/^uuid-/);
    expect(pet.criadoEm).toBe(pet.atualizadoEm);
    expect(pet.excluidoEm).toBeNull();
  });
  it('só exige nome e, para "outro", a espécie', () => {
    expect(new Pet({ nome: '' }).validar().nome).toBeDefined();
    expect(new Pet({ nome: '   ' }).validar().nome).toBeDefined();
    expect(new Pet({ nome: 'Thor' }).validar()).toEqual({});
    expect(new Pet({ nome: 'Pipoca', especie: 'outro' }).validar().especie).toBeDefined();
    expect(new Pet({ nome: 'Pipoca', especie: 'outro', especieOutra: 'Coelho' }).validar()).toEqual({});
  });
  it('flexiona a espécie pelo sexo', () => {
    expect(new Pet({ nome: 'A', especie: 'cachorro', sexo: 'femea' }).rotuloEspecie).toBe('Cachorra');
    expect(new Pet({ nome: 'A', especie: 'cachorro', sexo: 'macho' }).rotuloEspecie).toBe('Cachorro');
    expect(new Pet({ nome: 'A', especie: 'gato', sexo: 'femea' }).rotuloEspecie).toBe('Gata');
    expect(new Pet({ nome: 'A', especie: 'gato', sexo: 'desconhecido' }).rotuloEspecie).toBe('Gato');
    expect(new Pet({ nome: 'A', especie: 'outro', especieOutra: ' Coelho ' }).rotuloEspecie).toBe('Coelho');
  });
  it('monta "da Luna", "do Thor" e "de Pipoca"', () => {
    expect(new Pet({ nome: 'Luna', sexo: 'femea' }).deNome).toBe('da Luna');
    expect(new Pet({ nome: 'Thor', sexo: 'macho' }).deNome).toBe('do Thor');
    expect(new Pet({ nome: 'Pipoca' }).deNome).toBe('de Pipoca');
  });

  it('mostra "Idade desconhecida" sem nascimento', () => {
    expect(new Pet({ nome: 'A' }).resumo).toBe('Cachorro • Idade desconhecida');
  });
  it('ida e volta entre o model e a linha do banco', () => {
    const original = new Pet({
      nome: ' Luna ',
      especie: 'cachorro',
      sexo: 'femea',
      raca: 'Golden Retriever',
      nascimento: '2022-03-12',
      nascimentoAproximado: true,
      castrado: 'sim',
      fotoUri: 'file:///fotos/luna.jpg',
    });
    const linha = {
      ...original.toRow(),
      id: original.id,
      criado_em: original.criadoEm,
      atualizado_em: original.atualizadoEm,
      excluido_em: null,
      autor_dispositivo_id: 'aparelho-1',
    };
    const copia = Pet.fromRow(linha);
    expect(copia.id).toBe(original.id);
    expect(copia.nome).toBe('Luna');
    expect(copia.nascimentoAproximado).toBe(true);
    expect(copia.castrado).toBe('sim');
    expect(copia.falecido).toBe(false);
    expect(copia.autorDispositivoId).toBe('aparelho-1');
    expect(copia.fotoUri).toBe('file:///fotos/luna.jpg');
  });
  it('desfaz o falecimento', () => {
    const pet = new Pet({ nome: 'Bidu' });
    pet.marcarComoFalecido('2025-03-14');
    pet.desfazerFalecimento();
    expect(pet.falecido).toBe(false);
    expect(pet.dataFalecimento).toBeNull();
    expect(pet.toRow()).toMatchObject({ falecido: 0, data_falecimento: null });
  });

  it('marca como falecido', () => {
    const pet = new Pet({ nome: 'Bidu' });
    pet.marcarComoFalecido('2025-03-14');
    expect(pet.falecido).toBe(true);
    expect(pet.dataFalecimento).toBe('2025-03-14');
    expect(pet.toRow().falecido).toBe(1);
  });
});
