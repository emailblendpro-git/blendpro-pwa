// ================================================================
// BLENDPRO PWA — Componente: TabelaEditavelLotes
// ================================================================
// Tabela editável inline para lançamentos de faturamento
// Com lista corrida, status visual (🟢 ativa / 🔴 inativa)

import React from 'react';
import './TabelaEditavelLotes.css';

const TabelaEditavelLotes = ({
  lancamentos = [],
  selecionados = new Set(),
  edicoes = {},
  onToggleSelecionado,
  onSelecionarTodos,
  onAtualizarLancamento,
  carregando = false
}) => {
  if (carregando) {
    return (
      <div className="tabela-carregando">
        <div className="spinner"></div>
        <p>Carregando tabela...</p>
      </div>
    );
  }

  if (lancamentos.length === 0) {
    return (
      <div className="tabela-vazia">
        <p>Nenhuma máquina encontrada para este período.</p>
      </div>
    );
  }

  const obterValor = (numero_serie, campo) => {
    if (edicoes[numero_serie] && edicoes[numero_serie][campo] !== undefined) {
      return edicoes[numero_serie][campo];
    }
    const lancamento = lancamentos.find(l => l.numero_serie === numero_serie);
    return lancamento ? lancamento[campo] : '';
  };

  const calcularTotal = (numero_serie) => {
    const qtd = parseFloat(obterValor(numero_serie, 'quantidade_litros')) || 0;
    const valor = parseFloat(obterValor(numero_serie, 'valor_por_litro')) || 0;
    return (qtd * valor).toFixed(2);
  };

  return (
    <div className="tabela-editavel-container">
      <div className="tabela-scroll">
        <table className="tabela-editavel">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input
                  type="checkbox"
                  checked={selecionados.size === lancamentos.length && lancamentos.length > 0}
                  onChange={onSelecionarTodos}
                  title="Selecionar/Desselecionar todos"
                />
              </th>
              <th className="col-status">Status</th>
              <th className="col-maquina">Máquina</th>
              <th className="col-local">Cliente</th>
              <th className="col-litros">Litros ✏️</th>
              <th className="col-valor">R$/Litro ✏️</th>
              <th className="col-total">Total ◆</th>
              <th className="col-nf">N° NF ✏️</th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map(lancamento => {
              const isSelected = selecionados.has(lancamento.numero_serie);
              const isAtiva = lancamento.status === 'Ativa' || lancamento.status === 'Instalada';
              const statusIcon = isAtiva ? '🟢' : '🔴';
              const statusLabel = lancamento.status || 'Desconhecido';

              return (
                <tr
                  key={lancamento.numero_serie}
                  className={`${isSelected ? 'selecionada' : ''} ${
                    !isAtiva ? 'inativa' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelecionado(lancamento.numero_serie)}
                      disabled={!isAtiva}
                      title={
                        isAtiva
                          ? 'Selecionar para faturar'
                          : 'Máquina inativa'
                      }
                    />
                  </td>

                  {/* Status */}
                  <td className="col-status">
                    <span className="status-badge" title={statusLabel}>
                      {statusIcon}
                    </span>
                  </td>

                  {/* Máquina */}
                  <td className="col-maquina">
                    <strong>{lancamento.numero_serie}</strong>
                  </td>

                  {/* Cliente */}
                  <td className="col-local">{lancamento.nome_cliente}</td>

                  {/* Quantidade (Editável) */}
                  <td className="col-litros">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={obterValor(lancamento.numero_serie, 'quantidade_litros')}
                      onChange={e =>
                        onAtualizarLancamento(
                          lancamento.numero_serie,
                          'quantidade_litros',
                          e.target.value
                        )
                      }
                      disabled={!isAtiva}
                      className="input-numero"
                    />
                  </td>

                  {/* Valor/L (Editável) */}
                  <td className="col-valor">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={obterValor(lancamento.numero_serie, 'valor_por_litro')}
                      onChange={e =>
                        onAtualizarLancamento(
                          lancamento.numero_serie,
                          'valor_por_litro',
                          e.target.value
                        )
                      }
                      disabled={!isAtiva}
                      className="input-numero"
                    />
                  </td>

                  {/* Total (Calculado, Read-only) */}
                  <td className="col-total">
                    <strong className="total-value">
                      R$ {calcularTotal(lancamento.numero_serie)}
                    </strong>
                  </td>

                  {/* Número NF (Editável) */}
                  <td className="col-nf">
                    <input
                      type="text"
                      maxLength="20"
                      placeholder="NF"
                      value={obterValor(lancamento.numero_serie, 'numero_nota_fiscal') || ''}
                      onChange={e =>
                        onAtualizarLancamento(
                          lancamento.numero_serie,
                          'numero_nota_fiscal',
                          e.target.value
                        )
                      }
                      disabled={!isAtiva}
                      className="input-texto"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Nota de Legendas */}
      <div className="tabela-legenda">
        <p>
          <strong>Legendas:</strong> 🟢 Ativa/Instalada | 🔴 Inativa | ✏️ Editável | ◆ Calculado
          automaticamente
        </p>
      </div>
    </div>
  );
};

export default TabelaEditavelLotes;
