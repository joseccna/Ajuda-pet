import { LembreteAvulsoRepository } from '../database/repositories/LembreteAvulsoRepository';
import { PetRepository } from '../database/repositories/PetRepository';
import { criarLembrete, DIAS_PROXIMOS } from '../models/Lembrete';
import {
  criarEvento,
  estadoPorData,
  iconeDoTipo,
  ocorrenciasNoIntervalo,
  textoDias,
} from '../models/regrasAgenda';
import { diferencaEmDias, paraISO } from '../utils/datas';

export class ErroValidacaoLembrete extends Error {
  constructor(erros) {
    super('Dados do lembrete inválidos');
    this.name = 'ErroValidacaoLembrete';
    this.erros = erros;
  }
}

/** Lembretes criados à mão na Agenda: criar, editar, concluir (avança a data se repete) e excluir. */
export class LembreteAvulsoService {
  constructor(repo = new LembreteAvulsoRepository(), pets = new PetRepository()) {
    this.repo = repo;
    this.pets = pets;
  }

  buscar(id) {
    return this.repo.buscarPorId(id);
  }

  salvar(lembrete) {
    const erros = lembrete.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoLembrete(erros);
    return this.repo.salvar(lembrete);
  }

  excluir(id) {
    this.repo.excluir(id);
  }

  /** Marca como feito: avança a data se o lembrete se repete, ou o conclui. */
  concluir(id, hoje = new Date()) {
    const l = this.repo.buscarPorId(id);
    if (!l) return null;
    l.concluir(paraISO(hoje), hoje);
    return this.repo.salvar(l);
  }

  /** Eventos da agenda no intervalo, incluindo as repetições. */
  eventos(inicioISO, fimISO, hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const pets = new Map(this.pets.listarAtivos().map((p) => [p.id, p]));
    const resultado = [];
    for (const l of this.repo.pendentesDePetsAtivos()) {
      const pet = pets.get(l.petId);
      if (!pet) continue;
      for (const data of ocorrenciasNoIntervalo(l.data, l.repetir, inicioISO, fimISO)) {
        const estado = estadoPorData(data, hojeISO);
        resultado.push(
          criarEvento({
            chave: `avulso-${l.id}`,
            petId: pet.id,
            petNome: pet.nome,
            titulo: `${l.titulo} ${pet.deNome}`,
            texto: textoDias(diferencaEmDias(hojeISO, data), l.hora),
            data,
            hora: l.hora,
            estado,
            icone: iconeDoTipo(l.tipo),
            antecedenciaDias: l.antecedenciaDias,
            rota: { pathname: '/lembrete', params: { lembreteId: l.id } },
          }),
        );
      }
    }
    return resultado;
  }

  /** Para o painel do dia: os lembretes atrasados, de hoje e dos próximos 14 dias. */
  lembretes(hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const pets = new Map(this.pets.listarAtivos().map((p) => [p.id, p]));
    const resultado = [];
    for (const l of this.repo.pendentesDePetsAtivos()) {
      const pet = pets.get(l.petId);
      if (!pet) continue;
      const dias = diferencaEmDias(hojeISO, l.data);
      if (dias > DIAS_PROXIMOS) continue;
      resultado.push(
        criarLembrete({
          chave: `avulso-${l.id}`,
          petId: pet.id,
          petNome: pet.nome,
          titulo: `${l.titulo} ${pet.deNome}`,
          texto: textoDias(dias, l.hora),
          dias,
          data: l.data,
          icone: iconeDoTipo(l.tipo),
          rota: { pathname: '/lembrete', params: { lembreteId: l.id } },
        }),
      );
    }
    return resultado;
  }
}

export const lembreteAvulsoService = new LembreteAvulsoService();
