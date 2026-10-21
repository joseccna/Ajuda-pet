import { Database } from '../database/Database';
import { AnexoConsultaRepository } from '../database/repositories/AnexoConsultaRepository';
import { ConsultaPrivadaRepository } from '../database/repositories/ConsultaPrivadaRepository';
import { ConsultaRepository } from '../database/repositories/ConsultaRepository';
import { PetRepository } from '../database/repositories/PetRepository';
import { AnexoConsulta } from '../models/AnexoConsulta';
import { ConsultaPrivada } from '../models/ConsultaPrivada';
import { criarLembrete } from '../models/Lembrete';
import { criarEvento, estadoPorData } from '../models/regrasAgenda';
import { gastoDoAno, separarConsultas, textoQuando } from '../models/regrasConsulta';
import { diferencaEmDias, formatarDataCurta, paraISO } from '../utils/datas';
import { FotoService } from './FotoService';
import { tutorService } from './TutorService';

export class ErroValidacaoConsulta extends Error {
  constructor(erros) {
    super('Dados da consulta inválidos');
    this.name = 'ErroValidacaoConsulta';
    this.erros = erros;
  }
}

/** Dias à frente em que uma consulta ou retorno vira lembrete. */
const DIAS_LEMBRETE = 30;

/**
 * Regras de consultas. Valor e anotações pessoais ficam em ConsultaPrivada e só aparecem
 * para quem criou a consulta, nunca em pacotes compartilhados.
 */
export class ConsultaService {
  constructor(
    consultas = new ConsultaRepository(),
    privadas = new ConsultaPrivadaRepository(),
    anexos = new AnexoConsultaRepository(),
    pets = new PetRepository(),
  ) {
    this.consultas = consultas;
    this.privadas = privadas;
    this.anexos = anexos;
    this.pets = pets;
  }

  /** Dados da seção Consultas: próxima, agendadas, histórico, anexos e gasto do ano. */
  resumo(petId, hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const todas = this.consultas.listarPorPet(petId);
    const privadas = this.privadas.mapaPorPet(petId);
    const { proxima, agendadas, historico } = separarConsultas(todas, hojeISO);
    const ano = hoje.getFullYear();
    return {
      proxima,
      agendadas,
      historico,
      anexosPorConsulta: this.anexos.contagemPorPet(petId),
      ano,
      gastoAnoCentavos: gastoDoAno(todas, privadas, ano, hojeISO),
    };
  }

  /** Consulta com a parte privada e os anexos. */
  detalhe(id) {
    const consulta = this.consultas.buscarPorId(id);
    if (!consulta) return null;
    return {
      consulta,
      privada: this.privadas.buscarPorConsulta(id),
      anexos: this.anexos.listarPorConsulta(id),
    };
  }

  /**
   * Veterinário e clínica para sugerir no cadastro: os da última consulta do pet
   * ou, se não houver, os do veterinário de confiança do perfil do tutor.
   */
  profissionalSugerido(petId) {
    const ultimo = this.consultas.ultimoProfissional(petId);
    if (ultimo) return ultimo;
    const tutor = tutorService.atual();
    if (tutor && (tutor.vetNome || tutor.vetClinica))
      return { veterinario: tutor.vetNome, clinica: tutor.vetClinica };
    return null;
  }

  /**
   * Grava a consulta, a parte privada e os anexos em uma transação.
   * anexos: lista de { id?, uri, privado }. Sem id é um anexo novo; os que faltarem são removidos.
   */
  salvar({ consulta, valorCentavos = null, anotacoes = '', anexos = [] }) {
    const erros = consulta.validar();
    if (Object.keys(erros).length > 0) throw new ErroValidacaoConsulta(erros);

    const existentes = this.consultas.buscarPorId(consulta.id)
      ? this.anexos.listarPorConsulta(consulta.id)
      : [];
    const mantidos = new Set(anexos.filter((a) => a.id).map((a) => a.id));
    const removidos = existentes.filter((e) => !mantidos.has(e.id));

    // Copia as fotos novas antes da transação; se algo falhar, apaga as cópias.
    const novos = anexos
      .filter((a) => !a.id)
      .map((a) => ({
        privado: a.privado,
        uri: FotoService.ehTemporaria(a.uri) ? FotoService.guardarAnexo(a.uri, consulta.id) : a.uri,
      }));

    try {
      Database.get().withTransactionSync(() => {
        this.consultas.salvar(consulta);

        const atual = this.privadas.buscarPorConsulta(consulta.id);
        const privada = atual ?? new ConsultaPrivada({ consultaId: consulta.id });
        privada.valorCentavos = valorCentavos;
        privada.anotacoes = anotacoes;
        if (privada.vazia) {
          if (atual) this.privadas.excluir(atual.id);
        } else {
          this.privadas.salvar(privada);
        }

        for (const a of anexos.filter((x) => x.id)) {
          const ex = existentes.find((e) => e.id === a.id);
          if (ex && ex.privado !== a.privado) {
            ex.privado = a.privado;
            this.anexos.salvar(ex);
          }
        }
        for (const n of novos) {
          this.anexos.salvar(new AnexoConsulta({ consultaId: consulta.id, uri: n.uri, privado: n.privado }));
        }
        for (const r of removidos) this.anexos.excluir(r.id);
      });
    } catch (e) {
      novos.forEach((n) => FotoService.apagar(n.uri));
      throw e;
    }

    removidos.forEach((r) => FotoService.apagar(r.uri));
    return consulta;
  }

  excluir(id) {
    const anexos = this.anexos.listarPorConsulta(id);
    Database.get().withTransactionSync(() => this.consultas.excluirComDependencias(id));
    anexos.forEach((a) => FotoService.apagar(a.uri));
  }

  /**
   * Consultas (passadas e futuras) e retornos que caem no intervalo (contrato de evento da agenda).
   * As consultas passadas aparecem só como histórico.
   */
  eventos(inicioISO, fimISO, hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const pets = new Map(this.pets.listarAtivos().map((p) => [p.id, p]));
    const resultado = [];
    for (const c of this.consultas.listarDePetsAtivos()) {
      const pet = pets.get(c.petId);
      if (!pet) continue;
      const rota = { pathname: '/pet/[id]/consulta', params: { id: pet.id, consultaId: c.id } };
      if (c.data >= inicioISO && c.data <= fimISO) {
        const passada = c.data < hojeISO;
        resultado.push(
          criarEvento({
            chave: `consulta-${c.id}`,
            petId: pet.id,
            petNome: pet.nome,
            titulo: `${c.motivo} ${pet.deNome}`,
            texto: passada ? 'Consulta realizada' : textoQuando(c, hojeISO),
            data: c.data,
            hora: c.hora,
            estado: estadoPorData(c.data, hojeISO, false),
            icone: 'medkit-outline',
            rota,
          }),
        );
      }
      if (c.retornoEm && c.retornoEm >= hojeISO && c.retornoEm >= inicioISO && c.retornoEm <= fimISO) {
        resultado.push(
          criarEvento({
            chave: `retorno-${c.id}`,
            petId: pet.id,
            petNome: pet.nome,
            titulo: `Retorno ${pet.deNome}`,
            texto: textoQuando({ data: c.retornoEm, hora: '' }, hojeISO),
            data: c.retornoEm,
            estado: estadoPorData(c.retornoEm, hojeISO, false),
            icone: 'medkit-outline',
            rota,
          }),
        );
      }
    }
    return resultado;
  }

  /** Consultas e retornos dos próximos 30 dias, como lembretes (contrato Lembrete). */
  lembretes(hoje = new Date()) {
    const hojeISO = paraISO(hoje);
    const pets = new Map(this.pets.listarAtivos().map((p) => [p.id, p]));
    const resultado = [];

    for (const c of this.consultas.listarDePetsAtivos()) {
      const pet = pets.get(c.petId);
      if (!pet) continue;

      const dias = diferencaEmDias(hojeISO, c.data);
      if (dias >= 0 && dias <= DIAS_LEMBRETE) {
        resultado.push(
          criarLembrete({
            chave: `consulta-${c.id}`,
            petId: pet.id,
            petNome: pet.nome,
            titulo: `Consulta ${pet.deNome}`,
            texto: textoQuando(c, hojeISO),
            dias,
            data: c.data,
            icone: 'medkit-outline',
            rota: { pathname: '/pet/[id]/consulta', params: { id: pet.id, consultaId: c.id } },
          }),
        );
      }

      if (c.retornoEm) {
        const diasRetorno = diferencaEmDias(hojeISO, c.retornoEm);
        if (diasRetorno >= 0 && diasRetorno <= DIAS_LEMBRETE) {
          resultado.push(
            criarLembrete({
              chave: `retorno-${c.id}`,
              petId: pet.id,
              petNome: pet.nome,
              titulo: `Retorno ${pet.deNome}`,
              texto:
                diasRetorno === 0 ? 'Hoje' : diasRetorno === 1 ? 'Amanhã' : formatarDataCurta(c.retornoEm),
              dias: diasRetorno,
              data: c.retornoEm,
              icone: 'medkit-outline',
              rota: { pathname: '/pet/[id]/consulta', params: { id: pet.id, consultaId: c.id } },
            }),
          );
        }
      }
    }
    return resultado;
  }
}

export const consultaService = new ConsultaService();
