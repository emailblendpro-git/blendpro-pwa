// ================================================================
// BLENDPRO PWA — Hook: useLancamentosFaturamento
// ================================================================
// Gerencia estado e lógica de lançamentos de faturamento
// Inclui: carregamento de tabela, edição inline, salvamento em lotes

import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

export const useLancamentosFaturamento = () => {
  // Estado principal
  const [lancamentos, setLancamentos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [totais, setTotais] = useState({
    total_registros: 0,
    total_faturado: 0,
    total_litros: 0,
    ativas: 0,
    inativas: 0
  });

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    id_cliente: null,
    mostrarInativos: false
  });

  // Estado de seleção (checkboxes)
  const [selecionados, setSelecionados] = useState(new Set());

  // Estado de edição inline
  const [edicoes, setEdicoes] = useState({});

  // Carregar tabela de lançamentos
  const carregarTabela = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams({
        mes: filtros.mes,
        ano: filtros.ano,
        ...(filtros.id_cliente && { id_cliente: filtros.id_cliente })
      });

      const response = await api.get(
        `/lancamentos-faturamento/tabela-lotes?${params}`
      );

      // Filtrar máquinas inativas se necessário
      let dados = response.data.lancamentos;
      if (!filtros.mostrarInativos) {
        dados = dados.filter(r => r.status === 'Ativa' || r.status === 'Instalada');
      }

      setLancamentos(dados);
      setTotais(response.data.totais);
      setSelecionados(new Set()); // Limpar seleção
      setEdicoes({}); // Limpar edições
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao carregar tabela');
      console.error('❌ Erro ao carregar tabela:', err);
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  // Carregar na montagem
  useEffect(() => {
    carregarTabela();
  }, [carregarTabela]);

  // ================================================================
  // Funções de Edição Inline
  // ================================================================

  const atualizarLancamento = useCallback((numero_serie, campo, valor) => {
    setEdicoes(prev => ({
      ...prev,
      [numero_serie]: {
        ...prev[numero_serie],
        [campo]: valor
      }
    }));
  }, []);

  const obterValorEditado = useCallback((numero_serie, campo) => {
    const edicao = edicoes[numero_serie];
    if (edicao && edicao[campo] !== undefined) {
      return edicao[numero_serie][campo];
    }
    // Retornar valor original
    const lancamento = lancamentos.find(l => l.numero_serie === numero_serie);
    return lancamento ? lancamento[campo] : '';
  }, [edicoes, lancamentos]);

  // ================================================================
  // Funções de Seleção
  // ================================================================

  const toggleSelecionado = useCallback((numero_serie) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(numero_serie)) {
        novo.delete(numero_serie);
      } else {
        novo.add(numero_serie);
      }
      return novo;
    });
  }, []);

  const selecionarTodos = useCallback(() => {
    if (selecionados.size === lancamentos.length) {
      setSelecionados(new Set()); // Desselecionar todos
    } else {
      setSelecionados(new Set(lancamentos.map(l => l.numero_serie))); // Selecionar todos
    }
  }, [lancamentos, selecionados]);

  // ================================================================
  // Funções de Salvamento
  // ================================================================

  const salvarRascunho = useCallback(async () => {
    if (selecionados.size === 0) {
      setErro('Selecione pelo menos um lançamento');
      return { sucesso: false };
    }

    setCarregando(true);
    try {
      // Construir array de lançamentos selecionados com edições
      const lancamentosAprovar = lancamentos
        .filter(l => selecionados.has(l.numero_serie))
        .map(l => ({
          numero_serie: l.numero_serie,
          quantidade_litros: parseFloat(
            edicoes[l.numero_serie]?.quantidade_litros ?? l.quantidade_litros
          ),
          valor_por_litro: parseFloat(
            edicoes[l.numero_serie]?.valor_por_litro ?? l.valor_por_litro
          ),
          numero_nota_fiscal:
            edicoes[l.numero_serie]?.numero_nota_fiscal ?? l.numero_nota_fiscal ?? ''
        }));

      const response = await api.post('/lancamentos-faturamento/salvar-rascunho', {
        lancamentos: lancamentosAprovar,
        data_lancamento: filtros.data || new Date().toISOString().split('T')[0]
      });

      setErro(null);
      return { sucesso: true, dados: response.data };
    } catch (err) {
      const mensagem = err.response?.data?.erro || 'Erro ao salvar rascunho';
      setErro(mensagem);
      return { sucesso: false, erro: mensagem };
    } finally {
      setCarregando(false);
    }
  }, [selecionados, lancamentos, edicoes, filtros.data]);

  const aprovarLote = useCallback(async () => {
    if (selecionados.size === 0) {
      setErro('Selecione pelo menos um lançamento');
      return { sucesso: false };
    }

    setCarregando(true);
    try {
      // Construir array de lançamentos selecionados com edições
      const lancamentosAprovar = lancamentos
        .filter(l => selecionados.has(l.numero_serie))
        .map(l => ({
          numero_serie: l.numero_serie,
          quantidade_litros: parseFloat(
            edicoes[l.numero_serie]?.quantidade_litros ?? l.quantidade_litros
          ),
          valor_por_litro: parseFloat(
            edicoes[l.numero_serie]?.valor_por_litro ?? l.valor_por_litro
          ),
          numero_nota_fiscal:
            edicoes[l.numero_serie]?.numero_nota_fiscal ?? l.numero_nota_fiscal ?? ''
        }));

      const response = await api.post('/lancamentos-faturamento/aprovar-lote', {
        lancamentos: lancamentosAprovar,
        data_lancamento: filtros.data || new Date().toISOString().split('T')[0]
      });

      setErro(null);
      // Recarregar tabela após aprovação
      setTimeout(() => carregarTabela(), 500);
      return { sucesso: true, dados: response.data };
    } catch (err) {
      const mensagem = err.response?.data?.erro || 'Erro ao aprovar lote';
      setErro(mensagem);
      return { sucesso: false, erro: mensagem };
    } finally {
      setCarregando(false);
    }
  }, [selecionados, lancamentos, edicoes, carregarTabela, filtros.data]);

  // ================================================================
  // Funções de Filtro
  // ================================================================

  const atualizarFiltro = useCallback((novoFiltro) => {
    setFiltros(prev => ({ ...prev, ...novoFiltro }));
  }, []);

  // ================================================================
  // Cálculos
  // ================================================================

  const totalSelecionado = {
    registros: selecionados.size,
    faturado: lancamentos
      .filter(l => selecionados.has(l.numero_serie))
      .reduce((sum, l) => {
        const qtd = parseFloat(edicoes[l.numero_serie]?.quantidade_litros ?? l.quantidade_litros);
        const valor = parseFloat(edicoes[l.numero_serie]?.valor_por_litro ?? l.valor_por_litro);
        return sum + (qtd * valor);
      }, 0),
    litros: lancamentos
      .filter(l => selecionados.has(l.numero_serie))
      .reduce((sum, l) => {
        const qtd = parseFloat(edicoes[l.numero_serie]?.quantidade_litros ?? l.quantidade_litros);
        return sum + qtd;
      }, 0)
  };

  return {
    // Estado
    lancamentos,
    carregando,
    erro,
    totais,
    filtros,
    selecionados,
    edicoes,
    totalSelecionado,

    // Funções
    carregarTabela,
    atualizarLancamento,
    obterValorEditado,
    toggleSelecionado,
    selecionarTodos,
    salvarRascunho,
    aprovarLote,
    atualizarFiltro,
    setErro
  };
};

export default useLancamentosFaturamento;
