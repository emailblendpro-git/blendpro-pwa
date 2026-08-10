// ================================================================
// BLENDPRO PWA — Página: Lançamentos de Faturamento
// ================================================================
// Gerenciar lançamentos de faturamento com tabela editável
// Edição inline + aprovação em lotes

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuario } from '../hooks/useUsuario';
import useLancamentosFaturamento from '../hooks/useLancamentosFaturamento';
import TabelaEditavelLotes from '../components/TabelaEditavelLotes';
import './LancamentosFaturamento.css';

const LancamentosFaturamento = () => {
  const navigate = useNavigate();
  const { perfil, isMaster, isOperadorInterno } = useUsuario();

  const {
    lancamentos,
    carregando,
    erro,
    totais,
    filtros,
    selecionados,
    edicoes,
    totalSelecionado,
    carregarTabela,
    atualizarLancamento,
    toggleSelecionado,
    selecionarTodos,
    salvarRascunho,
    aprovarLote,
    atualizarFiltro,
    setErro
  } = useLancamentosFaturamento();

  // Verificar permissão
  if (!isMaster && !isOperadorInterno) {
    return (
      <div className="pagina-nao-autorizada">
        <h1>❌ Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta página.</p>
        <p>Contate um administrador.</p>
      </div>
    );
  }

  const handleSalvarRascunho = async () => {
    const resultado = await salvarRascunho();
    if (resultado.sucesso) {
      alert(`✅ ${resultado.dados.mensagem}`);
    } else {
      alert(`❌ Erro: ${resultado.erro}`);
    }
  };

  const handleAprovarLote = async () => {
    if (
      !window.confirm(
        `Você tem certeza? Vai faturar R$ ${parseFloat(totalSelecionado?.faturado || 0).toFixed(
          2
        )} em ${totalSelecionado?.registros || 0} máquinas.`
      )
    ) {
      return;
    }

    const resultado = await aprovarLote();
    if (resultado.sucesso) {
      const resumo = resultado.dados.resumo || {};
      alert(
        `✅ Lote aprovado!\n\nTotal: R$ ${parseFloat(resumo.total_faturado || 0).toFixed(2)}\nMáquinas: ${
          resumo.quantidade_registros || 0
        }\nLitros: ${parseFloat(resumo.total_litros || 0).toFixed(2)}`
      );
    } else {
      alert(`❌ Erro: ${resultado.erro}`);
    }
  };

  return (
    <div className="lancamentos-page">
      <div className="topo-barra">
        <h1 className="topo-titulo">BlendPro</h1>
        <button className="botao-voltar" onClick={() => navigate('/dashboard')}>← Voltar</button>
      </div>
      <div className="lancamentos-conteudo">
      {/* Header */}
      <div className="lancamentos-header">
        <div>
          <h1>💰 Lançamentos de Faturamento</h1>
          <p>
            Período: <strong>{filtros.mes}/{filtros.ano}</strong>
          </p>
        </div>
        <div className="header-infos">
          <div className="info-card">
            <div className="info-label">Total</div>
            <div className="info-valor">R$ {parseFloat(totais.total_faturado || 0).toFixed(2)}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Litros</div>
            <div className="info-valor">{parseFloat(totais.total_litros || 0).toFixed(1)}L</div>
          </div>
          <div className="info-card">
            <div className="info-label">Máquinas</div>
            <div className="info-valor">{totais.total_registros || 0}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="lancamentos-filtros">
        <div className="filtro-grupo">
          <label>Data:</label>
          <input
            type="date"
            value={filtros.data || new Date().toISOString().split('T')[0]}
            onChange={e => {
              const data = new Date(e.target.value);
              atualizarFiltro({
                data: e.target.value,
                mes: data.getMonth() + 1,
                ano: data.getFullYear()
              });
            }}
          />
        </div>

        <div className="filtro-grupo">
          <label>
            <input
              type="checkbox"
              checked={filtros.mostrarInativos}
              onChange={e => atualizarFiltro({ mostrarInativos: e.target.checked })}
            />
            Mostrar máquinas inativas
          </label>
        </div>

        <button className="btn-recarregar" onClick={carregarTabela} disabled={carregando}>
          🔄 Recarregar
        </button>
      </div>

      {/* Mensagem de Erro */}
      {erro && (
        <div className="alerta-erro">
          <span>❌ {erro}</span>
          <button onClick={() => setErro(null)}>✕</button>
        </div>
      )}

      {/* Tabela Editável */}
      <TabelaEditavelLotes
        lancamentos={lancamentos}
        selecionados={selecionados}
        edicoes={edicoes}
        onToggleSelecionado={toggleSelecionado}
        onSelecionarTodos={selecionarTodos}
        onAtualizarLancamento={atualizarLancamento}
        carregando={carregando}
      />

      {/* Totalizadores de Seleção */}
      {selecionados.size > 0 && (
        <div className="totalizador-selecao">
          <div className="totalizador-info">
            <span className="info-item">
              <strong>Selecionadas:</strong> {totalSelecionado.registros} máquinas
            </span>
            <span className="info-item">
              <strong>Volume:</strong> {totalSelecionado.litros.toFixed(2)}L
            </span>
            <span className="info-item">
              <strong>Total:</strong> R$ {totalSelecionado.faturado.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Toolbar de Ações */}
      <div className="lancamentos-toolbar">
        <button
          className="btn btn-rascunho"
          onClick={handleSalvarRascunho}
          disabled={carregando || selecionados.size === 0}
        >
          📝 Salvar Rascunho
        </button>

        <button
          className="btn btn-aprovar"
          onClick={handleAprovarLote}
          disabled={carregando || selecionados.size === 0}
        >
          ✅ Aprovar Lote ({selecionados.size})
        </button>

        {isMaster && (
          <button className="btn btn-historico" onClick={() => alert('Histórico (em breve)')}>
            📊 Ver Histórico
          </button>
        )}
      </div>

      {/* Ajuda */}
      <div className="lancamentos-ajuda">
        <details>
          <summary>ℹ️ Como usar?</summary>
          <div className="ajuda-conteudo">
            <ol>
              <li>Selecione o mês e ano desejado</li>
              <li>Edite quantidade de litros e valor por litro (campos com ✏️)</li>
              <li>O total é calculado automaticamente (R$ = Litros × Valor/L)</li>
              <li>Adicione número da Nota Fiscal se desejar</li>
              <li>Clique em "Salvar Rascunho" para guardar sem faturar</li>
              <li>Clique em "Aprovar Lote" para faturar as máquinas selecionadas</li>
              <li>Máquinas inativas (🔴) não podem ser selecionadas</li>
            </ol>
          </div>
        </details>
      </div>
      </div>
    </div>
  );
};

export default LancamentosFaturamento;
