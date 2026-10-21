/** Mensagens para cada problema possível ao abrir ou gerar um pacote .ajudapet. */
const MENSAGENS = {
  ARQUIVO_INVALIDO: 'Este arquivo não é um pacote do Ajuda Pet ou está danificado.',
  CORROMPIDO: 'O arquivo está incompleto ou corrompido. Peça para gerar e enviar de novo.',
  SENHA_NECESSARIA: 'Este arquivo está protegido por senha.',
  SENHA_INCORRETA: 'Senha incorreta, ou o arquivo foi alterado. Confira a senha e tente de novo.',
  VERSAO_NOVA: 'Este arquivo foi criado por uma versão mais nova do Ajuda Pet. Atualize o app para abri-lo.',
  MUITO_GRANDE: 'O arquivo é grande demais para ser aberto com segurança.',
  SEM_ESPACO: 'Não há espaço livre suficiente no aparelho. Libere espaço e tente de novo.',
  TIPO_ERRADO: 'Este arquivo não é do tipo esperado para esta ação.',
  SEM_DADOS: 'Não há nada para incluir no arquivo.',
};

export class ErroPacote extends Error {
  constructor(codigo, detalhe) {
    super(MENSAGENS[codigo] ?? 'Não foi possível concluir.');
    this.name = 'ErroPacote';
    this.codigo = codigo;
    this.detalhe = detalhe;
  }
}
