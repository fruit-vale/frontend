import { env } from '@/config/env'

export interface Secao {
  id: string
  titulo: string
  paragrafos?: string[]
  itens?: string[]
  /** parágrafo final, depois da lista */
  nota?: string
}

export const ATUALIZADO_EM = '17 de novembro de 2026'

const controlador = env.controladorNome || 'FruitVale'
const contato = env.contatoPrivacidade || 'o canal de contato informado pelo administrador da sua conta'

export const RESUMO = [
  {
    titulo: 'O que coletamos',
    texto:
      'Dados de cadastro (nome, CPF, e-mail, telefone), dados da propriedade e as leituras dos seus sensores.',
  },
  {
    titulo: 'Para que usamos',
    texto:
      'Para operar a plataforma: login, monitoramento, alertas, previsão de colheita e relatórios.',
  },
  {
    titulo: 'Não vendemos seus dados',
    texto:
      'Seus dados não são vendidos nem usados para publicidade. Só são compartilhados nos casos descritos abaixo.',
  },
  {
    titulo: 'Você tem controle',
    texto:
      'Pode pedir acesso, correção, portabilidade ou exclusão dos seus dados a qualquer momento.',
  },
]

export const TERMOS: Secao[] = [
  {
    id: 'aceite',
    titulo: '1. Aceite dos termos',
    paragrafos: [
      `Estes Termos de Uso regulam o acesso e o uso da plataforma FruitVale, operada por ${controlador}. Ao entrar na plataforma ou usar qualquer funcionalidade, você declara que leu e concorda com estes termos e com a Política de Privacidade abaixo.`,
      'Se você usa a plataforma em nome de uma empresa, declara ter poderes para vinculá-la a estes termos.',
    ],
  },
  {
    id: 'servico',
    titulo: '2. O que é o serviço',
    paragrafos: [
      'A FruitVale é uma plataforma de apoio à fruticultura. Ela oferece:',
    ],
    itens: [
      'monitoramento de lotes e propriedades com sensores conectados por MQTT;',
      'alertas quando uma medida sai da faixa ideal da cultura;',
      'previsão de colheita, ajustada pela temperatura medida;',
      'consulta de preços de mercado e dados de exportação;',
      'análises, mapa dos lotes e relatórios em PDF e CSV.',
    ],
    nota: 'As funcionalidades disponíveis dependem do perfil de acesso (administrador, produtor ou analista) e do plano contratado.',
  },
  {
    id: 'conta',
    titulo: '3. Conta e acesso',
    itens: [
      'As contas são criadas pelo administrador da plataforma. Não há cadastro aberto.',
      'Você deve informar dados verdadeiros e mantê-los atualizados.',
      'Login e senha são pessoais e intransferíveis. Você é responsável por tudo o que for feito com eles.',
      'Avise imediatamente se suspeitar de uso indevido da sua conta.',
      'A conta pode ser suspensa em caso de descumprimento destes termos, fraude ou risco à segurança.',
    ],
  },
  {
    id: 'uso',
    titulo: '4. Uso adequado',
    paragrafos: ['Ao usar a plataforma, você se compromete a não:'],
    itens: [
      'tentar acessar dados de outras empresas ou contas;',
      'burlar, testar ou sobrecarregar a segurança e os limites do sistema;',
      'enviar dados falsos ou de sensores que não sejam seus;',
      'copiar, revender ou fazer engenharia reversa da plataforma;',
      'usar a plataforma para fins ilícitos.',
    ],
  },
  {
    id: 'previsoes',
    titulo: '5. Previsões, alertas e preços',
    paragrafos: [
      'As previsões de colheita, os alertas e os preços exibidos são estimativas calculadas a partir de modelos, das leituras dos sensores e de fontes públicas de mercado. Elas apoiam a sua decisão, mas não a substituem.',
      'A precisão depende da instalação, da calibração e do funcionamento dos sensores e da conexão de internet. Não garantimos resultado de safra, preço de venda ou ausência de perdas, e a decisão final de manejo, colheita e venda é sempre sua.',
    ],
  },
  {
    id: 'dados-cliente',
    titulo: '6. Seus dados e conteúdo',
    paragrafos: [
      'Os dados que você ou sua empresa inserem (propriedades, lotes, culturas, leituras e relatórios) continuam sendo seus. Você nos autoriza a tratá-los apenas para prestar o serviço, conforme a Política de Privacidade.',
      'A marca, o software, o layout e os modelos da plataforma são de propriedade de quem a opera, e o uso do serviço não transfere nenhum direito sobre eles.',
    ],
  },
  {
    id: 'disponibilidade',
    titulo: '7. Disponibilidade e responsabilidade',
    paragrafos: [
      'Trabalhamos para manter a plataforma disponível, mas ela pode ficar indisponível por manutenção, falhas de internet, de energia ou de terceiros. Não respondemos por danos indiretos, lucros cessantes ou perdas decorrentes de decisões tomadas com base nas informações exibidas, salvo nos casos em que a lei determinar o contrário.',
    ],
  },
  {
    id: 'alteracoes',
    titulo: '8. Alterações e encerramento',
    paragrafos: [
      'Podemos atualizar estes termos. Mudanças relevantes serão avisadas na plataforma, e a data da última atualização fica no topo desta página. Continuar usando o serviço depois do aviso significa aceitar a nova versão.',
      'Você pode encerrar o uso a qualquer momento, solicitando o cancelamento da conta ao administrador.',
    ],
  },
  {
    id: 'foro',
    titulo: '9. Lei aplicável e foro',
    paragrafos: [
      'Estes termos são regidos pela legislação brasileira. Fica eleito o foro da comarca do domicílio do consumidor, quando houver relação de consumo, ou o foro da sede de quem opera a plataforma nos demais casos.',
    ],
  },
]

export const PRIVACIDADE: Secao[] = [
  {
    id: 'controlador',
    titulo: '10. Quem é o responsável pelos dados',
    paragrafos: [
      `O controlador dos dados pessoais tratados na plataforma é ${controlador}${env.controladorCnpj ? `, inscrita no CNPJ ${env.controladorCnpj}` : ''}. Para falar sobre privacidade, use ${contato}.`,
      'Esta política segue a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).',
    ],
  },
  {
    id: 'dados',
    titulo: '11. Quais dados coletamos',
    paragrafos: ['Coletamos apenas o necessário para o funcionamento da plataforma:'],
    itens: [
      'Cadastro do usuário: nome, CPF, e-mail, telefone, perfil de acesso e senha (guardada somente em formato criptografado, nunca em texto).',
      'Cadastro da empresa: razão social, CPF ou CNPJ, e-mail e telefone.',
      'Propriedades e lotes: nome, município, coordenadas e desenho da área no mapa, culturas e ciclos de cultivo.',
      'Sensores e leituras: identificação do sensor, localização, medidas (temperatura, umidade, solo, precipitação e outras) e horário.',
      'Dados de uso e segurança: registros de acesso e de erros, necessários para proteger e manter o sistema.',
      'Dados no seu aparelho: token de login, tema escolhido e preferências da tela (veja a seção sobre armazenamento local).',
    ],
    nota: 'Não coletamos dados pessoais sensíveis (como saúde, biometria, religião ou origem racial).',
  },
  {
    id: 'finalidades',
    titulo: '12. Para que usamos e em que base legal',
    itens: [
      'Criar e manter sua conta, autenticar o acesso e controlar permissões. Base: execução de contrato (art. 7º, V).',
      'Receber leituras, gerar alertas, previsões, análises e relatórios. Base: execução de contrato (art. 7º, V).',
      'Cumprir obrigações legais e regulatórias, como guarda de registros de acesso. Base: obrigação legal (art. 7º, II).',
      'Proteger a plataforma contra fraude, acesso indevido e abuso. Base: legítimo interesse (art. 7º, IX).',
      'Responder a solicitações e dar suporte. Base: execução de contrato ou legítimo interesse.',
    ],
    nota: 'Não usamos seus dados para publicidade nem para criar perfis de consumo, e não os vendemos.',
  },
  {
    id: 'compartilhamento',
    titulo: '13. Com quem compartilhamos',
    paragrafos: ['Compartilhamos dados somente quando necessário e com o mínimo possível:'],
    itens: [
      'Provedores de infraestrutura (hospedagem, banco de dados e rede), que atuam como operadores e só tratam os dados sob nossa instrução.',
      'Provedores de mapas (NASA e Google Maps Tiles): recebem a área visualizada no mapa e o endereço IP do seu aparelho para entregar as imagens.',
      'Google Fonts: ao abrir a plataforma, as fontes são carregadas dos servidores do Google, que recebem o endereço IP do seu aparelho.',
      'WhatsApp: ao clicar em "Contratar serviço", você é levado ao WhatsApp, que passa a tratar a conversa conforme a política dele.',
      'Autoridades públicas, quando houver ordem legal ou judicial.',
      'Dentro da sua empresa: cada empresa só enxerga os seus próprios dados. Administradores da plataforma acessam dados para operar e dar suporte.',
    ],
  },
  {
    id: 'internacional',
    titulo: '14. Transferência internacional',
    paragrafos: [
      'Alguns provedores citados acima podem tratar dados fora do Brasil. Quando isso ocorrer, a transferência segue os mecanismos previstos nos arts. 33 a 36 da LGPD, como cláusulas contratuais e países com nível de proteção adequado.',
    ],
  },
  {
    id: 'armazenamento',
    titulo: '15. Cookies e armazenamento local',
    paragrafos: [
      'A plataforma não usa cookies de publicidade ou de rastreamento. Ela guarda no próprio navegador, por meio do armazenamento local:',
    ],
    itens: [
      'o token de login: em "Lembrar de mim", fica no armazenamento local até você sair; sem essa opção, fica só na aba aberta;',
      'preferências de interface, como tema claro ou escuro, seções do menu e o aviso de primeiros passos;',
      'uma sessão de mapa do Google, quando a imagem de satélite em alta resolução está ativa.',
    ],
    nota: 'Você pode apagar esses dados a qualquer momento nas configurações do navegador, ou ao sair da conta. Isso apenas fará você entrar de novo.',
  },
  {
    id: 'retencao',
    titulo: '16. Por quanto tempo guardamos',
    paragrafos: [
      'Mantemos os dados enquanto a conta estiver ativa e pelo tempo necessário para cumprir obrigações legais, resolver disputas e exercer direitos. Ao fim desse prazo, os dados são eliminados ou anonimizados, ressalvadas as hipóteses de guarda previstas no art. 16 da LGPD.',
      'Registros de acesso são mantidos pelo prazo mínimo exigido pelo Marco Civil da Internet (Lei nº 12.965/2014).',
    ],
  },
  {
    id: 'seguranca',
    titulo: '17. Como protegemos',
    itens: [
      'Conexões com a plataforma e com o broker MQTT protegidas por TLS (criptografia em trânsito).',
      'Senhas guardadas com hash criptográfico, nunca em texto.',
      'Controle de acesso por perfil e separação dos dados por empresa.',
      'Credenciais de sensores individuais, que podem ser revogadas.',
    ],
    nota: 'Nenhum sistema é totalmente imune a incidentes. Se ocorrer um incidente que possa causar risco ou dano relevante, avisaremos os titulares e a ANPD, nos termos do art. 48 da LGPD.',
  },
  {
    id: 'direitos',
    titulo: '18. Seus direitos como titular',
    paragrafos: ['A LGPD (art. 18) garante que você pode, a qualquer momento, pedir:'],
    itens: [
      'confirmação de que tratamos seus dados e acesso a eles;',
      'correção de dados incompletos, inexatos ou desatualizados;',
      'anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;',
      'portabilidade dos dados a outro fornecedor;',
      'eliminação dos dados tratados com base no seu consentimento;',
      'informação sobre com quem compartilhamos seus dados;',
      'informação sobre a possibilidade de não consentir e suas consequências;',
      'revogação do consentimento, quando essa for a base usada;',
      'revisão de decisões tomadas apenas de forma automatizada.',
    ],
    nota: `Para exercer qualquer direito, use ${contato}. Respondemos em prazo razoável, conforme a regulamentação. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.`,
  },
  {
    id: 'menores',
    titulo: '19. Crianças e adolescentes',
    paragrafos: [
      'A plataforma é voltada a profissionais e empresas do setor agrícola e não é destinada a menores de 18 anos. Se identificarmos dados de menores coletados sem a autorização legal, eles serão excluídos.',
    ],
  },
  {
    id: 'mudancas',
    titulo: '20. Mudanças nesta política',
    paragrafos: [
      'Podemos atualizar esta política para refletir mudanças legais ou no serviço. A data da última atualização fica no topo da página e, em mudanças relevantes, avisaremos na plataforma.',
    ],
  },
]
