import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, XIcon, BookOpenIcon } from './icons';

interface HelpTopic {
  id: string;
  icon: string;
  title: string;
  category: string;
  description: string;
  steps: string[];
  tips: string[];
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'dashboard',
    icon: '📊',
    title: 'Dashboard - Seu Painel de Controle',
    category: 'Começando',
    description: 'O Dashboard é a primeira tela que você vê. Mostra um resumo rápido de tudo que está acontecendo com sua música.',
    steps: [
      'Acesse ao fazer login',
      'Veja seus próximos shows, releases e tarefas',
      'Clique em qualquer card para ir para mais detalhes',
      'Use para monitorar o progresso geral',
    ],
    tips: [
      'O Dashboard atualiza em tempo real',
      'Você pode customizar o que aparece nas configurações',
      'Todos os números são interativos - clique neles!',
    ]
  },
  {
    id: 'releases',
    icon: '💿',
    title: 'Releases - Planejando Seu Lançamento',
    category: 'Música',
    description: 'Gerencie lançamentos de singles, EPs e álbuns com um checklist completo de tarefas pré e pós-lançamento.',
    steps: [
      'Clique em "Releases" na barra lateral',
      'Clique "Plan New Release" para criar um novo lançamento',
      'Defina a data de lançamento (considere 4-6 semanas antes)',
      'Preencha o checklist com tarefas específicas',
      'Atribua tarefas para membros da equipe',
      'Acompanhe o progresso com a barra verde',
    ],
    tips: [
      'Use o checkbox do lado esquerdo para marcar tarefas como concluídas',
      'A IA pode gerar um plano automático para você',
      'Você pode fazer upload de arte da capa aqui',
      'As tarefas aparecem no seu Calendar para não esquecer',
    ]
  },
  {
    id: 'campaigns',
    icon: '📧',
    title: 'Campaigns - Enviando Emails Profissionais',
    category: 'Contatos',
    description: 'Crie campanhas de email para imprensa, rádio, labels e fãs. A IA gera conteúdo personalizado se você quiser.',
    steps: [
      'Clique em "Campaigns" na barra lateral',
      'Clique "New Campaign"',
      'Passo 1: Configure o nome e tipo de campanha (Press, Radio, etc)',
      'Passo 2: Selecione os destinatários da sua lista de contatos',
      'Passo 3: Escreva o email (ou deixe a IA gerar)',
      'Passo 4: Revise e envie agora ou agende para depois',
    ],
    tips: [
      'Use "Import from EPK" para gerar emails baseados na sua banda',
      'Você pode agendar "follow-ups" automáticos se não tiver resposta',
      'Há tonalidades diferentes: Professional, Casual, Enthusiastic',
      'Personalizações como {{name}} e {{outlet}} funcionam',
    ]
  },
  {
    id: 'tours',
    icon: '🚌',
    title: 'Tours - Organizando Seus Shows',
    category: 'Shows',
    description: 'Crie tours com múltiplos shows, venues e horários. Integre setlists e compartilhe com a banda.',
    steps: [
      'Clique em "Tours" na barra lateral',
      'Clique "New Tour" para criar uma nova turnê',
      'Escolha datas de início e fim',
      'Adicione shows clicando "Add Show"',
      'Para cada show: Adicione venue, data, horário',
      'Adicione timeslots em cada show',
      'Escolha setlist para cada show',
    ],
    tips: [
      'Você pode importar um plano de tour existente',
      'Venues aparecem automático se já estão salvos',
      'A IA pode sugerir próximos locais baseado em padrões anteriores',
      'Sincronize com seu Calendar para não perder datas',
    ]
  },
  {
    id: 'press',
    icon: '📰',
    title: 'Press Outreach - Conectar com Jornalistas',
    category: 'Contatos',
    description: 'Encontre jornalistas que cobrem artistas similares a você. Use Sound Match para descobertas automáticas.',
    steps: [
      'Clique em "Press" na barra lateral',
      'Cole um artista similar no campo "Find New Contacts"',
      'A IA encontrará jornalistas que cobrem esse artista',
      'Clique "Add" para adicionar à sua lista',
      'Use "Add Contact" para adicionar manualmente',
      'Organize por tier (A, B, C)',
    ],
    tips: [
      'Sound Match descobre jornalistas que REALMENTE gostam do seu estilo',
      'Você pode importar um CSV com seus contatos',
      'Use campanhas para enviar pitches para múltiplos jornalistas',
      'Importe contatos do seu EPK automaticamente',
    ]
  },
  {
    id: 'soundmatch',
    icon: '🎯',
    title: 'Sound Match - IA Encontra Oportunidades',
    category: 'IA & Inteligência',
    description: 'Cole seu URL do Spotify. A IA analisa seu som e encontra contatos relevantes em imprensa e rádio compartilhando seu estilo.',
    steps: [
      'Url do seu artista no Spotify (ex: open.spotify.com/artist/...)',
      'Clique "Analyze My Sound"',
      'Revise a análise gerada (gêneros, moods, artistas similares)',
      'Clique "Find Opportunities"',
      'A IA encontra jornalistas e DJs que adoram artistas como você',
      'Salve contatos diretamente para Press ou Radio',
    ],
    tips: [
      'Sound Match é melhor que busca genérica por gênero',
      'Baseado em dados reais de quem cobriu artistas similares',
      'Você pode fazer isso toda vez que lança algo novo',
      'As descobertas são salvas automaticamente',
    ]
  },
  {
    id: 'calendar',
    icon: '📅',
    title: 'Calendar - Veja Tudo em Um Lugar',
    category: 'Agendamento',
    description: 'Seu calendário unificado mostra shows, releases, deadlines, tarefas e lembretes - tudo sincronizado.',
    steps: [
      'Clique em "Calendar" na barra lateral',
      'Escolha entre vista Semana, Mês ou Ano',
      'Veja eventos de releases, tours, tarefas e fundos',
      'Clique em um evento para ver mais detalhes',
      'Aproveita o botão + para adicionar eventos manuais',
    ],
    tips: [
      'Lembretes aparecem automaticamente 7, 3 e 1 dia antes',
      'Você pode navegar rápido usando as setas',
      'A cor do evento indica o tipo (rosa=gig, azul=studio, etc)',
      'Materiais importantes aparecem com ícone 📎',
    ]
  },
  {
    id: 'financials',
    icon: '💰',
    title: 'Financials - Gerenciando Seu Dinheiro',
    category: 'Negócio',
    description: 'Rastreie rendas, despesas e divisão de lucros entre membros da banda.',
    steps: [
      'Clique em "Financials" na barra lateral',
      'Visualize rendas por tipo (merch, shows, streams, etc)',
      'Adicione transações manualmente',
      'Configure como dividir o dinheiro entre membros',
      'Veja gráficos de receita mensal',
    ],
    tips: [
      'A divisão de lucros é por banda, não individual',
      'Você pode sincronizar com bancos depois (recursos futuros)',
      'Todos os números são em tempo real',
      'Exporte relatórios para sua contadora',
    ]
  },
  {
    id: 'taskmanager',
    icon: '✅',
    title: 'Task Manager - Organize Suas Tarefas',
    category: 'Produtividade',
    description: 'Sistema Kanban simples: To Do → In Progress → Review → Done. Perfeito para coordenar com sua equipe.',
    steps: [
      'Clique em "Task Manager" na barra lateral',
      'Clique "+ New Task" para criar uma tarefa',
      'Defina prioridade, data limite e responsável',
      'Tarefas aparecem em colunas por status',
      'Clique "Start" para mover para In Progress',
      'Clique "Done" quando terminar',
    ],
    tips: [
      'Tarefas do Release aparecem automaticamente aqui',
      'Tarefas atrasadas aparecem com ⚠️ em vermelho',
      'Filtre por pessoa ou prioridade',
      'A IA pode sugerir próximas tarefas',
    ]
  },
  {
    id: 'productions',
    icon: '🎚️',
    title: 'Production - Organizando Suas Faixas',
    category: 'Criação',
    description: 'Rastreie canções em produção, estúdio, mixagem e masterização. Veja progresso de cada faixa.',
    steps: [
      'Clique em "Production" na barra lateral',
      'Clique "+ New Song" para adicionar uma música',
      'Defina compositor, gênero e inspirações',
      'Altere o status conforme progride (Demo → Studio → Mix → Master)',
      'Adicione notas sobre sessions e feedback',
    ],
    tips: [
      'Cada música tem sua própria timeline',
      'Você pode adicionar links do Drive/Dropbox para demos',
      'Compartilhe a timeline com seu produtor/engenheiro',
      'Acumule histórico completo de como a música evoluiu',
    ]
  },
  {
    id: 'funding',
    icon: '🎁',
    title: 'Funding - Procurando Apoio Financeiro',
    category: 'Oportunidades',
    description: 'Encontre editais, bolsas, prêmios e crowdfunding para financiar seus projetos musicais.',
    steps: [
      'Clique em "Funding" na barra lateral',
      'Pesquise fundos por palavra-chave (ex: "música", "artes")',
      'Veja deadline e requisitos de cada oportunidade',
      'Salve as que te interessam',
      'Adicione lembretes no Calendar 6+ semanas antes do deadline',
    ],
    tips: [
      'sempre pesquise prazos com bastante antecedência',
      'Salve oportunidades que combinam mesmo que não lance agora',
      'A IA pode criar uma documentação base para inscrição',
      'Você pode adicionar fundos manualmente também',
    ]
  },
  {
    id: 'epk',
    icon: '🎭',
    title: 'EPK - Seu Press Kit Digital',
    category: 'Profissional',
    description: 'Crie um Press Kit profissional que compartilhar com imprensa, venues, festivals e labels. Tudo centralizado.',
    steps: [
      'Clique em "EPK" na barra lateral',
      'Adicione foto de capa principal',
      'Escreva sua bio (a IA pode ajudar)',
      'Anexe seu último release',
      'Destaque seus próximos shows',
      'Compartilhe o link com contatos',
    ],
    tips: [
      'EPK faz você parecer profissional',
      'Atualize quando tiver novidades importantes',
      'Todos links são rastreáveis (você vê quem clicou)',
      'Funciona bem em mobile para venues',
    ]
  },
  {
    id: 'merch',
    icon: '👕',
    title: 'Merchandise - Vendendo Seus Produtos',
    category: 'Negócio',
    description: 'Crie catálogo de produtos (camisetas, vinil, CDs, etc). Registre vendas e lucro em cada show.',
    steps: [
      'Clique em "Merchandise" na barra lateral',
      'Clique "Add Item" para novo produto',
      'Defina tipo (Shirt, CD, Vinyl, Poster)',
      'Adicione variações (tamanhos, cores)',
      'Aloque quantidade por variante',
      'No show: Clique "+ Sale" para registrar venda',
    ],
    tips: [
      'Merch é uma fonte de receita importante',
      'Rastreie estoque para não vender sem ter',
      'Você pode dar desconto em certas quantidades',
      'Gera relatórios de quais produtos vendem mais',
    ]
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: 'Settings - Configuração da Sua Conta',
    category: 'Sistema',
    description: 'Configure informações da banda, membros, integração com APIs e exportação de dados.',
    steps: [
      'Clique em "Settings" na barra lateral',
      'Atualize nome da banda e gênero',
      'Adicione membros da equipe (email + role)',
      'Configure como dividir os lucros',
      'Veja uso de APIs (limitado no free)',
      'Exporte seu data quando quiser',
    ],
    tips: [
      'Você pode resetar todos dados (atenção!)',
      'membros recebem email convite',
      'API monitoring mostra quanto as IAs foram usadas',
      'Dados exportam em JSON - fácil de importar depois',
    ]
  },
  {
    id: 'radio',
    icon: '📻',
    title: 'Radio Outreach - Alcançar DJs',
    category: 'Contatos',
    description: 'Encontre estações de rádio, programas e DJs que toquem seu estilo. Envie musica para aditoria.',
    steps: [
      'Clique em "Radio" na barra lateral',
      'Busque por gênero (indie rock, eletrônico, etc)',
      'Veja estação, país e descrição do programa',
      'Clique "Save" para adicionar à lista',
      'Use Campaigns para enviar sua música',
    ],
    tips: [
      'Rádio comunitária é mais fácil pra começar',
      'Pesquise ao vivo antes de enviar',
      'Alguns DJs têm redes também - mande para todos',
      'Rádio gera muito buzz quando funciona',
    ]
  },
  {
    id: 'collaborators',
    icon: '👥',
    title: 'Collaborators - Sua Equipe',
    category: 'Organização',
    description: 'Cadastre produtores, engenheiros, fotógrafos e outros colaboradores com contato e anotações.',
    steps: [
      'Clique em "Collaborators" na barra lateral',
      'Clique "Add Collaborator"',
      'Adicione nome, role (Producer, Engineer, etc)',
      'Email e anotações (portfólio, valor hora, etc)',
      'Filtre por tipo de profissional',
    ],
    tips: [
      'Ali você guarda números dos técnicos/estúdios preferidos',
      'Adicione link do Insta/Portfolio',
      'Você pode avaliar e deixar feedback',
      'Use como referência quando precisar',
    ]
  },
  {
    id: 'search-cache',
    icon: '💾',
    title: 'Buscas Salvam Automaticamente',
    category: 'Dica Rápida',
    description: 'Quando você faz uma busca (Press, Radio, Labels), os resultados são salvos automaticamente.',
    steps: [
      'Faça uma busca qualquer (ex: buscar jornalistas)',
      'Saia da página e volte depois',
      'Seus últimos 20 resultados estão lá!',
      'Isso funciona também se você fechar o navegador',
    ],
    tips: [
      'Nunca mais perd seus resultados de busca',
      'Funciona inclusive no seu telemóvel',
      'Dados salvam localmente no seu navegador',
    ]
  },
];

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ isOpen, onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    return Array.from(new Set(HELP_TOPICS.map(t => t.category))).sort();
  }, []);

  const filteredTopics = useMemo(() => {
    return HELP_TOPICS.filter(topic => {
      const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           topic.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || topic.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex z-50">
      {/* Topic View */}
      {selectedTopic && (
        <div className="w-full max-w-2xl bg-gray-800 overflow-y-auto">
          <div className="p-6 border-b border-gray-700">
            <button
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Voltar
            </button>
            <h2 className="text-3xl font-bold text-white">
              {selectedTopic.icon} {selectedTopic.title}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <p className="text-gray-300">{selectedTopic.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Como Fazer:</h3>
              <ol className="space-y-2">
                {selectedTopic.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-gray-300">
                    <span className="text-purple-400 font-bold">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {selectedTopic.tips.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">💡 Dicas Úteis:</h3>
                <ul className="space-y-2">
                  {selectedTopic.tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-gray-300">
                      <span className="text-yellow-400">✦</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {!selectedTopic && (
        <div className="w-full bg-gray-800 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <BookOpenIcon className="w-8 h-8 text-purple-400" />
                Centro de Ajuda
              </h1>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <XIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Procurar por tópico..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Categories Filter */}
          <div className="px-6 pt-4 flex-shrink-0 overflow-x-auto">
            <div className="flex gap-2 pb-4">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  categoryFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Tudo
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    categoryFilter === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Topics List */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="grid gap-4 mt-4">
              {filteredTopics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-left transition border border-gray-600 hover:border-purple-500"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{topic.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{topic.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{topic.description}</p>
                      <p className="text-xs text-purple-400 mt-2">{topic.category}</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  </div>
                </button>
              ))}
              
              {filteredTopics.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">Nenhum tópico encontrado. Tente outra busca.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
