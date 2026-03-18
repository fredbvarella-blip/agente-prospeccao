import React, { useState } from 'react';
import { Search, MapPin, Target, Users, Star, ExternalLink, Phone, Mail, Instagram, Loader2, Bookmark, AlertCircle, Share2, Copy, Check, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  address: string;
  category: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  
  const [keyword, setKeyword] = useState('arquiteto');
  const [city, setCity] = useState('Teresópolis, RJ');
  const [focus, setFocus] = useState('');
  const [count, setCount] = useState(8);
  
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [savedLeads, setSavedLeads] = useState<Lead[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);

  // Use the public Shared App URL for sharing, NOT the private Dev URL
  const appUrl = 'https://ais-pre-u7d7bm3el5v52su7tho6j4-90281823261.us-east5.run.app';
  const iframeCode = `<iframe src="${appUrl}" width="100%" height="800" style="border:none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);"></iframe>`;

  const copyToClipboard = async (text: string, type: 'link' | 'iframe') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedIframe(true);
        setTimeout(() => setCopiedIframe(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword || !city) return;

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    setError('');

    try {
      // Initialize Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Você é um assistente de prospecção de leads especializado em encontrar profissionais e empresas locais.
      Faça uma busca profunda e real na web (incluindo Google Maps, sites oficiais, redes sociais como Instagram/Facebook, e listas profissionais/diretórios) por profissionais ou empresas de "${keyword}" localizados em "${city}". 
      ${focus ? `Foco de atuação desejado: ${focus}.` : ''}
      
      Sua tarefa é encontrar exatamente ${count} resultados reais, precisos e verificáveis de negócios que operam nessa região.
      
      Para CADA lead encontrado, você DEVE extrair o máximo de informações possível:
      - name: Nome real do profissional ou da empresa.
      - phone: Procure em sites, perfis de Instagram ou Google Maps.
      - email: Procure nas seções de contato dos sites ou na bio das redes sociais.
      - website: URL oficial do negócio.
      - instagram: O @perfil do Instagram (procure ativamente por isso, é muito comum para arquitetos/decoradores).
      - address: O endereço físico ou bairro de atuação (frequentemente no Google Maps).
      - category: A especialidade ou categoria.
      
      Seja rigoroso: retorne apenas dados reais que você encontrou na web agora. Se uma informação específica (como email ou site) realmente não estiver disponível publicamente em nenhum lugar para aquele lead, retorne uma string vazia "".
      
      IMPORTANTE: Sua resposta DEVE ser estritamente um array JSON válido. Não adicione nenhum texto antes ou depois do JSON.
      Formato esperado:
      [
        {
          "name": "Nome do Profissional",
          "phone": "(21) 99999-9999",
          "email": "contato@email.com",
          "website": "www.site.com",
          "instagram": "@perfil",
          "address": "Rua Exemplo, 123",
          "category": "Arquiteto"
        }
      ]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }] // Enable real-time Google Search
        }
      });

      const text = response.text;
      if (text) {
        // Extract JSON array using regex to handle potential markdown formatting from the model
        const match = text.match(/\[[\s\S]*\]/);
        const jsonStr = match ? match[0] : text;
        
        try {
          const data = JSON.parse(jsonStr);
          if (Array.isArray(data)) {
            const newLeads = data.map((item: any, index: number) => ({
              id: `real-lead-${Date.now()}-${index}`,
              name: item.name || 'Nome não disponível',
              phone: item.phone || '',
              email: item.email || '',
              website: item.website || '',
              instagram: item.instagram || '',
              address: item.address || '',
              category: item.category || keyword
            }));
            setResults(newLeads);
          } else {
            throw new Error("Parsed data is not an array");
          }
        } catch (parseError) {
          console.error("JSON Parse error:", parseError, "Raw text:", text);
          setError('A IA encontrou resultados, mas houve um erro ao processar o formato dos dados. Tente buscar novamente.');
        }
      } else {
        setError('A IA não retornou resultados. Tente mudar os termos da busca.');
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError(`Erro na busca: ${err?.message || 'Falha na conexão'}. Por favor, tente novamente.`);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSaveLead = (lead: Lead) => {
    setSavedLeads(prev => {
      const isSaved = prev.some(l => l.id === lead.id);
      if (isSaved) {
        return prev.filter(l => l.id !== lead.id);
      } else {
        return [...prev, lead];
      }
    });
  };

  const LeadCard = ({ lead }: { lead: Lead }) => {
    const isSaved = savedLeads.some(l => l.id === lead.id);

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow duration-200 flex flex-col h-full relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-teal-500/20"></div>
        
        <div className="flex justify-between items-start mb-4 mt-2">
          <div>
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full mb-2">
              {lead.category}
            </span>
            <h3 className="text-lg font-semibold text-stone-800 leading-tight">{lead.name}</h3>
          </div>
          <button
            onClick={() => toggleSaveLead(lead)}
            className={`p-2 rounded-full transition-colors shrink-0 ml-2 ${
              isSaved 
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                : 'bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
            title={isSaved ? "Remover dos salvos" : "Salvar lead"}
          >
            <Star className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="space-y-3 flex-grow text-sm text-stone-600">
          {lead.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-stone-400 shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.instagram && (
            <div className="flex items-center gap-3">
              <Instagram className="w-4 h-4 text-stone-400 shrink-0" />
              <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                {lead.instagram}
              </a>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-stone-400 shrink-0" />
              <a href={`mailto:${lead.email}`} className="hover:text-teal-600 transition-colors truncate">{lead.email}</a>
            </div>
          )}
          {lead.website && (
            <div className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4 text-stone-400 shrink-0" />
              <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 transition-colors truncate">
                {lead.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {lead.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
              <span className="leading-tight">{lead.address}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] font-sans text-stone-800 selection:bg-teal-100 selection:text-teal-900">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                  <Search className="w-6 h-6 text-teal-500" />
                  Agente de Prospecção
                </h1>
                <span className="px-2.5 py-1 bg-stone-100 text-stone-500 text-xs font-medium rounded-full border border-stone-200">
                  por <a href="https://antiqualha.com.br" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 hover:underline transition-colors">antiqualha</a>
                </span>
              </div>
              <p className="text-stone-500 text-sm">Busca profissionais e empresas no Google para parcerias comerciais</p>
            </div>
            
            <div className="flex items-center gap-3 self-stretch sm:self-auto">
              {/* Tabs */}
              <div className="flex bg-stone-100 p-1 rounded-xl flex-grow sm:flex-grow-0">
                <button
                  onClick={() => setActiveTab('search')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'search' 
                      ? 'bg-white text-stone-800 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Buscar Leads
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'saved' 
                      ? 'bg-white text-stone-800 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  Salvos
                  {savedLeads.length > 0 && (
                    <span className="bg-teal-100 text-teal-700 py-0.5 px-2 rounded-full text-xs">
                      {savedLeads.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Share Button */}
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="p-2.5 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-teal-600 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                title="Compartilhar ou Incorporar no Site"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium pr-1">Divulgar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'search' ? (
          <div className="space-y-8">
            {/* Search Form */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
              
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-2">
                  <label htmlFor="keyword" className="block text-sm font-medium text-stone-700 flex items-center gap-2">
                    <Search className="w-4 h-4 text-stone-400" />
                    Palavra-chave (profissão ou segmento)
                  </label>
                  <input
                    type="text"
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="ex: arquiteto, decorador, vitrinista"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="block text-sm font-medium text-stone-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-stone-400" />
                    Cidade
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="ex: Teresópolis, RJ"
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="focus" className="block text-sm font-medium text-stone-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-stone-400" />
                    Foco da busca <span className="text-stone-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    id="focus"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="ex: residencial, projetos de luxo, restauro..."
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="count" className="block text-sm font-medium text-stone-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-stone-400" />
                    Qtd. de leads
                  </label>
                  <select
                    id="count"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value={4}>4 leads</option>
                    <option value={8}>8 leads</option>
                    <option value={12}>12 leads</option>
                    <option value={20}>20 leads</option>
                  </select>
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Buscando na web em tempo real...
                      </>
                    ) : (
                      <>
                        Buscar leads reais
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Results Section */}
            {hasSearched && !error && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-stone-800">
                    {isSearching ? 'Analisando resultados do Google...' : 'Resultados da busca'}
                  </h2>
                  {!isSearching && results.length > 0 && (
                    <span className="text-sm text-stone-500">
                      Encontrados {results.length} profissionais
                    </span>
                  )}
                </div>

                {isSearching ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(count > 6 ? 6 : count)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 h-64 flex flex-col animate-pulse">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-3 w-full">
                            <div className="h-6 bg-stone-100 rounded-full w-24"></div>
                            <div className="h-6 bg-stone-100 rounded-md w-3/4"></div>
                          </div>
                          <div className="w-9 h-9 bg-stone-100 rounded-full shrink-0"></div>
                        </div>
                        <div className="space-y-4 mt-4">
                          <div className="h-4 bg-stone-50 rounded w-1/2"></div>
                          <div className="h-4 bg-stone-50 rounded w-2/3"></div>
                          <div className="h-4 bg-stone-50 rounded w-3/4"></div>
                          <div className="h-4 bg-stone-50 rounded w-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map(lead => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}
                  </div>
                ) : (
                  !isSearching && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-stone-100">
                      <p className="text-stone-500">Nenhum resultado encontrado. Tente ajustar os termos da busca.</p>
                    </div>
                  )
                )}
              </section>
            )}
          </div>
        ) : (
          /* Saved Leads Tab */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-stone-800">Leads Salvos</h2>
              <span className="text-sm text-stone-500">
                {savedLeads.length} {savedLeads.length === 1 ? 'profissional' : 'profissionais'}
              </span>
            </div>

            {savedLeads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedLeads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-stone-300" />
                </div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">Nenhum lead salvo ainda</h3>
                <p className="text-stone-500 max-w-sm">
                  Volte para a aba de busca e clique no ícone de estrela (★) para salvar os contatos mais interessantes aqui.
                </p>
                <button 
                  onClick={() => setActiveTab('search')}
                  className="mt-6 px-6 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition-colors"
                >
                  Ir para Busca
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-stone-500">
            © {new Date().getFullYear()} Agente de Prospecção
          </p>
          <p className="text-sm text-stone-500">
            Uma ferramenta <a href="https://antiqualha.com.br" target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors">antiqualha</a>
          </p>
        </div>
      </footer>

      {/* Share/Embed Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-stone-100">
              <h2 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-teal-500" />
                Divulgar Agente
              </h2>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-stone-600 text-sm">
                Esta ferramenta é incrível para gerar leads! Compartilhe o link no seu Instagram ou incorpore o agente diretamente no seu site.
              </p>

              {/* Direct Link (Instagram) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-800">
                  Link direto (Ideal para Instagram / Linktree / WhatsApp)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={appUrl}
                    className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600 outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(appUrl, 'link')}
                    className="px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl transition-colors flex items-center gap-2 shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Iframe Code (Website) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-800">
                  Código de Incorporação (Ideal para o seu Site / WordPress)
                </label>
                <div className="relative">
                  <textarea 
                    readOnly 
                    value={iframeCode}
                    rows={3}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600 font-mono outline-none resize-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(iframeCode, 'iframe')}
                    className="absolute top-3 right-3 p-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    {copiedIframe ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs font-medium">{copiedIframe ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
                <p className="text-xs text-stone-500 mt-1">Cole este código HTML na página do seu site onde deseja que o agente apareça.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

