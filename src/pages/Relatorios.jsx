import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

const moeda = (v) => `R$ ${parseFloat(v || 0).toFixed(2).replace('.', ',')}`;
const num = (v, dec = 1) => parseFloat(v || 0).toFixed(dec);

export default function Relatorios() {
  const navigate = useNavigate();
  const { podeGerenciar } = useUsuario();
  const [aba, setAba] = useState('geral');
  const [maquinas, setMaquinas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [relatorioMaquina, setRelatorioMaquina] = useState(null);
  const [relatorioCliente, setRelatorioCliente] = useState(null);
  const [relatorioFinanceiroCliente, setRelatorioFinanceiroCliente] = useState(null);
  const [relatorioFinanceiro, setRelatorioFinanceiro] = useState(null);
  const [serialSelecionado, setSerialSelecionado] = useState('');
  const [serialFinanceiro, setSerialFinanceiro] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [clienteFinanceiro, setClienteFinanceiro] = useState('');

  useEffect(() => {
    api.get('/maquinas').then((res) => setMaquinas(res.data)).catch(() => setMaquinas([]));
    api.get('/clientes').then((res) => setClientes(res.data)).catch(() => setClientes([]));
    carregarResumo();
  }, []);

  const carregarResumo = async () => {
    try {
      setCarregando(true);
      const res = await api.get('/relatorios');
      setResumo(res.data);
    } catch {
      setResumo(null);
    } finally {
      setCarregando(false);
    }
  };

  const carregarRelatorioMaquina = async () => {
    if (!serialSelecionado) return;
    try {
      setCarregando(true);
      const res = await api.get(`/relatorios/${serialSelecionado}`);
      setRelatorioMaquina(res.data);
    } catch {
      alert('Erro ao carregar relatório da máquina.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarRelatorioCliente = async () => {
    if (!clienteSelecionado) return;
    try {
      setCarregando(true);
      const res = await api.get(`/relatorios/cliente/${clienteSelecionado}`);
      setRelatorioCliente(res.data);
      setRelatorioFinanceiroCliente(null);
    } catch {
      alert('Erro ao carregar relatório do cliente.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarFinanceiroCliente = async () => {
    if (!clienteSelecionado) return;
    try {
      setCarregando(true);
      const res = await api.get(`/relatorios/financeiro/cliente/${clienteSelecionado}`);
      setRelatorioFinanceiroCliente(res.data);
    } catch {
      alert('Erro ao carregar relatório financeiro do cliente.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarRelatorioFinanceiro = async () => {
    if (!serialFinanceiro) return;
    try {
      setCarregando(true);
      const res = await api.get(`/relatorios/financeiro/${serialFinanceiro}`);
      setRelatorioFinanceiro(res.data);
    } catch {
      alert('Erro ao carregar relatório financeiro.');
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleString('pt-BR');
  };

  const formatarMes = (mes) => {
    if (!mes) return '—';
    const [ano, m] = mes.split('-');
    return `${m}/${ano}`;
  };

  const SecaoDeducoes = ({ deducoes }) => (
    <div style={styles.secao}>
      <h3 style={styles.secaoTitulo}>📋 Deduções Detalhadas (Total Histórico)</h3>
      <div style={styles.cards}>
        {[
          { label: 'ICMS', key: 'icms' },
          { label: 'PIS', key: 'pis' },
          { label: 'COFINS', key: 'cofins' },
          { label: 'Logístico', key: 'logistico' },
          { label: 'Comissionado 1', key: 'comissionado_1' },
          { label: 'Comissionado 2', key: 'comissionado_2' },
          { label: 'Custo Operacional', key: 'custo_operacional' },
          { label: 'Outros', key: 'outros' },
        ].map(({ label, key }) => (
          <div key={key} style={{ ...styles.card, minWidth: '140px', borderTop: '3px solid #f59e0b' }}>
            <p style={styles.cardTitulo}>{label}</p>
            <p style={{ ...styles.cardValor, fontSize: '18px', color: '#f59e0b' }}>
              {moeda(deducoes[key])}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const SecaoHistoricoMensal = ({ historico }) => (
    <div style={styles.secao}>
      <h3 style={styles.secaoTitulo}>📅 Histórico Mensal Financeiro</h3>
      <table style={styles.tabela}>
        <thead>
          <tr>
            <th style={styles.th}>Mês</th>
            <th style={styles.th}>Volume (L)</th>
            <th style={styles.th}>Receita</th>
            <th style={styles.th}>Custo</th>
            <th style={styles.th}>Deduções</th>
            <th style={styles.th}>Margem</th>
            <th style={styles.th}>Margem %</th>
          </tr>
        </thead>
        <tbody>
          {historico.map((h, i) => (
            <tr key={i} style={styles.tr}>
              <td style={styles.td}>{formatarMes(h.mes)}</td>
              <td style={styles.td}>{num(h.volume)}</td>
              <td style={styles.td}>{moeda(h.receita)}</td>
              <td style={styles.td}>{moeda(h.custo)}</td>
              <td style={styles.td}>{moeda(h.deducoes)}</td>
              <td style={{ ...styles.td, color: '#22c55e', fontWeight: 'bold' }}>{moeda(h.margem)}</td>
              <td style={{ ...styles.td, color: '#22c55e' }}>{num(h.margem_pct, 2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const CardsFinanceiros = ({ totais }) => (
    <div style={styles.cards}>
      <div style={{ ...styles.card, borderTop: '3px solid #38bdf8' }}>
        <p style={styles.cardTitulo}>Total Abastecimentos</p>
        <p style={styles.cardValor}>{totais.total_abastecimentos}</p>
      </div>
      <div style={{ ...styles.card, borderTop: '3px solid #38bdf8' }}>
        <p style={styles.cardTitulo}>Volume Total (L)</p>
        <p style={styles.cardValor}>{num(totais.volume_total)}</p>
      </div>
      <div style={{ ...styles.card, borderTop: '3px solid #22c55e' }}>
        <p style={styles.cardTitulo}>Receita Total</p>
        <p style={{ ...styles.cardValor, fontSize: '20px', color: '#22c55e' }}>{moeda(totais.receita_total)}</p>
      </div>
      <div style={{ ...styles.card, borderTop: '3px solid #ef4444' }}>
        <p style={styles.cardTitulo}>Custo Total</p>
        <p style={{ ...styles.cardValor, fontSize: '20px', color: '#ef4444' }}>{moeda(totais.custo_total)}</p>
      </div>
      <div style={{ ...styles.card, borderTop: '3px solid #f59e0b' }}>
        <p style={styles.cardTitulo}>Total Deduções</p>
        <p style={{ ...styles.cardValor, fontSize: '20px', color: '#f59e0b' }}>{moeda(totais.deducoes_total)}</p>
      </div>
      <div style={{ ...styles.card, borderTop: '3px solid #22c55e' }}>
        <p style={styles.cardTitulo}>Margem Total</p>
        <p style={{ ...styles.cardValor, fontSize: '20px', color: '#22c55e' }}>
          {moeda(totais.margem_total)}
          <span style={{ fontSize: '14px', marginLeft: '6px' }}>({num(totais.margem_media_pct, 2)}%)</span>
        </p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <button style={styles.botaoVoltar} onClick={() => navigate('/dashboard')}>
          ← Voltar
        </button>
      </div>
      <div style={styles.conteudo}>
        <h2 style={styles.pageTitulo}>Relatórios</h2>

        {/* Abas */}
        <div style={styles.abas}>
          <button style={{ ...styles.aba, ...(aba === 'geral' ? styles.abaAtiva : {}) }} onClick={() => setAba('geral')}>
            📊 Geral
          </button>
          <button style={{ ...styles.aba, ...(aba === 'maquina' ? styles.abaAtiva : {}) }} onClick={() => setAba('maquina')}>
            🖨️ Por Máquina
          </button>
          <button style={{ ...styles.aba, ...(aba === 'cliente' ? styles.abaAtiva : {}) }} onClick={() => setAba('cliente')}>
            🏢 Por Cliente
          </button>
          {podeGerenciar && (
            <button style={{ ...styles.aba, ...(aba === 'financeiro' ? styles.abaAtiva : {}) }} onClick={() => setAba('financeiro')}>
              💰 Financeiro
            </button>
          )}
        </div>

        {/* ABA GERAL */}
        {aba === 'geral' && (
          <div>
            {carregando ? (
              <p style={styles.mensagem}>Carregando...</p>
            ) : resumo ? (
              <div>
                <div style={styles.cards}>
                  <div style={styles.card}>
                    <p style={styles.cardTitulo}>Total de Máquinas</p>
                    <p style={styles.cardValor}>{resumo.resumo.total_maquinas}</p>
                  </div>
                  <div style={{ ...styles.card, borderTop: '3px solid #22c55e' }}>
                    <p style={styles.cardTitulo}>Ativas</p>
                    <p style={{ ...styles.cardValor, color: '#22c55e' }}>{resumo.resumo.maquinas_ativas}</p>
                  </div>
                  <div style={{ ...styles.card, borderTop: '3px solid #f59e0b' }}>
                    <p style={styles.cardTitulo}>Em Manutenção</p>
                    <p style={{ ...styles.cardValor, color: '#f59e0b' }}>{resumo.resumo.em_manutencao}</p>
                  </div>
                  <div style={{ ...styles.card, borderTop: '3px solid #ef4444' }}>
                    <p style={styles.cardTitulo}>Bloqueadas</p>
                    <p style={{ ...styles.cardValor, color: '#ef4444' }}>{resumo.resumo.bloqueadas}</p>
                  </div>
                  <div style={{ ...styles.card, borderTop: '3px solid #ef4444' }}>
                    <p style={styles.cardTitulo}>Sem Comunicação</p>
                    <p style={{ ...styles.cardValor, color: '#ef4444' }}>{resumo.resumo.sem_comunicacao}</p>
                  </div>
                  <div style={{ ...styles.card, borderTop: '3px solid #f59e0b' }}>
                    <p style={styles.cardTitulo}>Nível Baixo</p>
                    <p style={{ ...styles.cardValor, color: '#f59e0b' }}>{resumo.resumo.nivel_baixo}</p>
                  </div>
                </div>

                {resumo.top_maquinas_mes.length > 0 && (
                  <div style={styles.secao}>
                    <h3 style={styles.secaoTitulo}>🏆 Top Máquinas do Mês</h3>
                    <table style={styles.tabela}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Serial</th>
                          <th style={styles.th}>Local</th>
                          <th style={styles.th}>Modelo</th>
                          <th style={styles.th}>Acionamentos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumo.top_maquinas_mes.map((m, i) => (
                          <tr key={i} style={styles.tr}>
                            <td style={styles.td}>{m.numero_serie}</td>
                            <td style={styles.td}>{m.nome_local || '—'}</td>
                            <td style={styles.td}>{m.modelo}</td>
                            <td style={styles.td}>{m.acionamentos_mes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p style={styles.mensagem}>Nenhum dado disponível.</p>
            )}
          </div>
        )}

        {/* ABA POR MÁQUINA */}
        {aba === 'maquina' && (
          <div>
            <div style={styles.filtro}>
              <select style={styles.input} value={serialSelecionado} onChange={(e) => setSerialSelecionado(e.target.value)}>
                <option value="">Selecionar Máquina</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.numero_serie}>
                    {m.numero_serie} — {m.nome_cliente || 'Sem cliente'}
                  </option>
                ))}
              </select>
              <button style={styles.botaoBuscar} onClick={carregarRelatorioMaquina}>
                🔍 Buscar
              </button>
            </div>

            {carregando && <p style={styles.mensagem}>Carregando...</p>}

            {relatorioMaquina && !carregando && (
              <div>
                <div style={styles.cards}>
                  <div style={styles.card}>
                    <p style={styles.cardTitulo}>Total Acionamentos</p>
                    <p style={styles.cardValor}>{relatorioMaquina.totais.total_acionamentos || 0}</p>
                  </div>
                  <div style={styles.card}>
                    <p style={styles.cardTitulo}>Volume Total (L)</p>
                    <p style={styles.cardValor}>{num(relatorioMaquina.totais.volume_total_geral)}</p>
                  </div>
                  <div style={styles.card}>
                    <p style={styles.cardTitulo}>Média Mensal</p>
                    <p style={styles.cardValor}>{relatorioMaquina.media_mensal_acionamentos}</p>
                  </div>
                </div>

                {relatorioMaquina.historico_mensal.length > 0 && (
                  <div style={styles.secao}>
                    <h3 style={styles.secaoTitulo}>📅 Histórico Mensal</h3>
                    <table style={styles.tabela}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Mês</th>
                          <th style={styles.th}>Acionamentos</th>
                          <th style={styles.th}>Volume (L)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioMaquina.historico_mensal.map((h, i) => (
                          <tr key={i} style={styles.tr}>
                            <td style={styles.td}>{formatarMes(h.mes)}</td>
                            <td style={styles.td}>{h.acionamentos}</td>
                            <td style={styles.td}>{num(h.volume_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {relatorioMaquina.ultimas_manutencoes.length > 0 && (
                  <div style={styles.secao}>
                    <h3 style={styles.secaoTitulo}>🔧 Últimas Manutenções</h3>
                    <table style={styles.tabela}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Data</th>
                          <th style={styles.th}>Tipo</th>
                          <th style={styles.th}>Técnico</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioMaquina.ultimas_manutencoes.map((m, i) => (
                          <tr key={i} style={styles.tr}>
                            <td style={styles.td}>{formatarData(m.created_at)}</td>
                            <td style={styles.td}>{m.tipo_servico}</td>
                            <td style={styles.td}>{m.tecnico_nome || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ABA POR CLIENTE */}
        {aba === 'cliente' && (
          <div>
            <div style={styles.filtro}>
              <select style={styles.input} value={clienteSelecionado} onChange={(e) => { setClienteSelecionado(e.target.value); setRelatorioCliente(null); setRelatorioFinanceiroCliente(null); }}>
                <option value="">Selecionar Cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_cliente}
                  </option>
                ))}
              </select>
              <button style={styles.botaoBuscar} onClick={carregarRelatorioCliente}>
                🔍 Operacional
              </button>
              {podeGerenciar && (
                <button style={{ ...styles.botaoBuscar, backgroundColor: '#22c55e' }} onClick={carregarFinanceiroCliente}>
                  💰 Financeiro
                </button>
              )}
            </div>

            {carregando && <p style={styles.mensagem}>Carregando...</p>}

            {/* Relatório operacional do cliente */}
            {relatorioCliente && !carregando && !relatorioFinanceiroCliente && (
              <div>
                <div style={styles.secao}>
                  <h3 style={styles.secaoTitulo}>🏢 {relatorioCliente.cliente.nome_cliente}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                    {relatorioCliente.cliente.cidade || '—'} — {relatorioCliente.cliente.telefone || '—'}
                  </p>
                </div>

                {relatorioCliente.maquinas.length > 0 ? (
                  <div style={styles.secao}>
                    <h3 style={styles.secaoTitulo}>🖨️ Máquinas do Cliente (mês atual)</h3>
                    <table style={styles.tabela}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Serial</th>
                          <th style={styles.th}>Modelo</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Acionamentos</th>
                          <th style={styles.th}>Volume (L)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioCliente.maquinas.map((m, i) => (
                          <tr key={i} style={styles.tr}>
                            <td style={styles.td}>{m.numero_serie}</td>
                            <td style={styles.td}>{m.modelo}</td>
                            <td style={styles.td}>{m.status}</td>
                            <td style={styles.td}>{m.total_acionamentos || 0}</td>
                            <td style={styles.td}>{num(m.volume_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={styles.mensagem}>Nenhuma máquina vinculada a este cliente.</p>
                )}
              </div>
            )}

            {/* Relatório financeiro do cliente */}
            {relatorioFinanceiroCliente && !carregando && (
              <div>
                <div style={styles.secao}>
                  <h3 style={styles.secaoTitulo}>💰 {relatorioFinanceiroCliente.cliente.nome_cliente} — Financeiro</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                    {relatorioFinanceiroCliente.cliente.cidade || '—'} — {relatorioFinanceiroCliente.cliente.telefone || '—'}
                  </p>
                </div>

                <CardsFinanceiros totais={relatorioFinanceiroCliente.totais} />

                {/* Por máquina */}
                {relatorioFinanceiroCliente.por_maquina.length > 0 && (
                  <div style={styles.secao}>
                    <h3 style={styles.secaoTitulo}>🖨️ Financeiro por Máquina</h3>
                    <table style={styles.tabela}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Serial</th>
                          <th style={styles.th}>Abastec.</th>
                          <th style={styles.th}>Volume (L)</th>
                          <th style={styles.th}>Receita</th>
                          <th style={styles.th}>Custo</th>
                          <th style={styles.th}>Deduções</th>
                          <th style={styles.th}>Margem</th>
                          <th style={styles.th}>Margem %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioFinanceiroCliente.por_maquina.map((m, i) => (
                          <tr key={i} style={styles.tr}>
                            <td style={styles.td}>{m.numero_serie}</td>
                            <td style={styles.td}>{m.total_abastecimentos}</td>
                            <td style={styles.td}>{num(m.volume_total)}</td>
                            <td style={styles.td}>{moeda(m.receita_total)}</td>
                            <td style={styles.td}>{moeda(m.custo_total)}</td>
                            <td style={styles.td}>{moeda(m.deducoes_total)}</td>
                            <td style={{ ...styles.td, color: '#22c55e', fontWeight: 'bold' }}>{moeda(m.margem_total)}</td>
                            <td style={{ ...styles.td, color: '#22c55e' }}>{num(m.margem_media_pct, 2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <SecaoDeducoes deducoes={relatorioFinanceiroCliente.deducoes_detalhadas} />
                <SecaoHistoricoMensal historico={relatorioFinanceiroCliente.historico_mensal} />
              </div>
            )}
          </div>
        )}

        {/* ABA FINANCEIRO POR MÁQUINA */}
        {aba === 'financeiro' && podeGerenciar && (
          <div>
            <div style={styles.filtro}>
              <select style={styles.input} value={serialFinanceiro} onChange={(e) => setSerialFinanceiro(e.target.value)}>
                <option value="">Selecionar Máquina</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.numero_serie}>
                    {m.numero_serie} — {m.nome_cliente || 'Sem cliente'}
                  </option>
                ))}
              </select>
              <button style={styles.botaoBuscar} onClick={carregarRelatorioFinanceiro}>
                🔍 Buscar
              </button>
            </div>

            {carregando && <p style={styles.mensagem}>Carregando...</p>}

            {relatorioFinanceiro && !carregando && (
              <div>
                <CardsFinanceiros totais={relatorioFinanceiro.totais} />
                <SecaoDeducoes deducoes={relatorioFinanceiro.deducoes_detalhadas} />
                {relatorioFinanceiro.historico_mensal.length > 0 && (
                  <SecaoHistoricoMensal historico={relatorioFinanceiro.historico_mensal} />
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0f172a', minHeight: '100vh', color: '#f1f5f9' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  titulo: { color: '#38bdf8', margin: 0 },
  botaoVoltar: { padding: '8px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  conteudo: { padding: '40px 32px' },
  pageTitulo: { color: '#f1f5f9', marginBottom: '24px' },
  mensagem: { color: '#94a3b8' },
  abas: { display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' },
  aba: { padding: '10px 20px', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  abaAtiva: { backgroundColor: '#0ea5e9', color: '#fff', border: '1px solid #0ea5e9' },
  cards: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' },
  card: { backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', minWidth: '160px', borderTop: '3px solid #38bdf8' },
  cardTitulo: { color: '#94a3b8', margin: '0 0 8px 0', fontSize: '13px' },
  cardValor: { color: '#38bdf8', margin: 0, fontSize: '32px', fontWeight: 'bold' },
  secao: { marginBottom: '32px' },
  secaoTitulo: { color: '#38bdf8', marginBottom: '16px' },
  tabela: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #334155' },
  tr: { borderBottom: '1px solid #1e293b' },
  td: { padding: '12px 16px', color: '#f1f5f9', fontSize: '14px' },
  filtro: { display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' },
  input: { padding: '10px 14px', backgroundColor: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', flex: 1 },
  botaoBuscar: { padding: '10px 20px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
};