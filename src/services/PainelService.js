import { organizarPainel } from './painelRegras';
import { alimentacaoService } from './AlimentacaoService';
import { consultaService } from './ConsultaService';
import { cuidadoService } from './CuidadoService';
import { lembreteAvulsoService } from './LembreteAvulsoService';
import { passeioService } from './PasseioService';
import { pesoService } from './PesoService';
import { vacinaService } from './VacinaService';

/**
 * Junta os lembretes de todos os módulos. Para um novo módulo (cuidados, consultas...)
 * aparecer no painel, basta ele ter um método lembretes(hoje) e entrar na lista de provedores.
 */
export class PainelService {
  constructor(
    provedores = [
      vacinaService,
      pesoService,
      consultaService,
      alimentacaoService,
      passeioService,
      cuidadoService,
      lembreteAvulsoService,
    ],
  ) {
    this.provedores = provedores;
  }

  montar(hoje = new Date()) {
    const todos = this.provedores.flatMap((p) => p.lembretes(hoje));
    return organizarPainel(todos);
  }
}

export const painelService = new PainelService();
