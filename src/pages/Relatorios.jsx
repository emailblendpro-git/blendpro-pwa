import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

export default function Relatorios() {
  const navigate = useNavigate();
  const { podeGerenciar } = useUsuario();
  const [aba, setAba] = useState('geral'); // 'geral' | 'maquina' | 'cliente'
  const [maquinas, setMaquinas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [relatorioMaquina, setRelatorioMaquina] = useState(null);
  const [relatorioCliente, setRelatorioCliente] = useState(null);
  const [serialSelecionado, setSerialSelecionado] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState('');

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
    } catch {
      alert('Erro ao carregar relatório do cliente.');
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
                    <p style={styles.cardValor}>{parseFloat(relatorioMaquina.totais.volume_total_geral || 0).toFixed(1)}</p>
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
                            <td style={styles.td}>{parseFloat(h.volume_total || 0).toFixed(1)}</td>
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
              <select style={styles.input} value={clienteSelecionado} onChange={(e) => setClienteSelecionado(e.target.value)}>
                <option value="">Selecionar Cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_cliente}
                  </option>
                ))}
              </select>
              <button style={styles.botaoBuscar} onClick={carregarRelatorioCliente}>
                🔍 Buscar
              </button>
            </div>

            {carregando && <p style={styles.mensagem}>Carregando...</p>}

            {relatorioCliente && !carregando && (
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
                            <td style={styles.td}>{parseFloat(m.volume_total || 0).toFixed(1)}</td>
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
  abas: { display: 'flex', gap: '8px', marginBottom: '32px' },
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