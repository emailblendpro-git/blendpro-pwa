import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

// ── Utilidades ───────────────────────────────────

function formatarData(data) {
  if (!data) return '—';
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatarDataCurta(data) {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR');
}

function corStatus(s) {
  if (s === 'Ativa')       return '#22c55e';
  if (s === 'Inativa')     return '#ef4444';
  if (s === 'Em Teste')    return '#f59e0b';
  if (s === 'Manutenção')  return '#f59e0b';
  return '#94a3b8';
}

function corChamado(s) {
  if (s === 'Aberto')       return '#ef4444';
  if (s === 'Em Andamento') return '#f59e0b';
  if (s === 'Resolvido')    return '#22c55e';
  return '#94a3b8';
}

function corPrioridade(p) {
  if (p === 'Alta')   return '#ef4444';
  if (p === 'Normal') return '#f59e0b';
  return '#22c55e';
}

function iconeRegistro(tipo) {
  if (tipo === 'Abastecimento')          return '💧';
  if (tipo === 'Instalação')             return '🏗️';
  if (tipo === 'Retirada')               return '📦';
  if (tipo === 'Vista sem abastecimento') return '👁️';
  return '🔧';
}

// ── Componente principal ─────────────────────────

export default function PortalCliente() {
  const navigate    = useNavigate();
  const { usuario } = useUsuario();

  const [aba, setAba]               = useState('maquinas');
  const [maquinas, setMaquinas]     = useState([]);
  const [carregandoMaq, setCarregandoMaq] = useState(true);

  // Máquina expandida + seus registros
  const [maquinaAberta, setMaquinaAberta] = useState(null);
  const [registrosMaq, setRegistrosMaq]   = useState({});   // { [numero_serie]: [] }
  const [carregandoReg, setCarregandoReg] = useState(null); // serial que está carregando

  // Chamados
  const [chamados, setChamados]         = useState([]);
  const [carregandoCh, setCarregandoCh] = useState(false);
  const [chamadoSel, setChamadoSel]     = useState(null);

  // Carrega máquinas ao montar
  useEffect(() => {
    api.get('/maquinas')
      .then((r) => setMaquinas(r.data))
      .catch(() => setMaquinas([]))
      .finally(() => setCarregandoMaq(false));
  }, []);

  // Carrega chamados ao entrar na aba
  const carregarChamados = useCallback(() => {
    setCarregandoCh(true);
    api.get('/chamados')
      .then((r) => setChamados(r.data))
      .catch(() => setChamados([]))
      .finally(() => setCarregandoCh(false));
  }, []);

  useEffect(() => {
    if (aba === 'chamados') carregarChamados();
  }, [aba, carregarChamados]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  }

  // Abre/fecha registros de uma máquina
  async function toggleMaquina(serial) {
    if (maquinaAberta === serial) {
      setMaquinaAberta(null);
      return;
    }
    setMaquinaAberta(serial);
    if (registrosMaq[serial]) return; // já carregou

    setCarregandoReg(serial);
    try {
      const r = await api.get(`/manutencoes?serial=${serial}`);
      const ordenados = [...r.data].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      setRegistrosMaq((prev) => ({ ...prev, [serial]: ordenados }));
    } catch {
      setRegistrosMaq((prev) => ({ ...prev, [serial]: [] }));
    } finally {
      setCarregandoReg(null);
    }
  }

  // Nome de exibição do cliente
  const clientesUnicos = [...new Set(maquinas.map((m) => m.nome_cliente).filter(Boolean))];
  const nomeCliente = clientesUnicos.length === 1
    ? clientesUnicos[0]
    : clientesUnicos.length > 1
      ? `${clientesUnicos[0]} +${clientesUnicos.length - 1}`
      : usuario?.nome || 'Cliente';

  // ── Renders ──────────────────────────────────────

  function renderMaquinas() {
    if (carregandoMaq) return <p style={s.msg}>Carregando...</p>;
    if (!maquinas.length) return <p style={s.msg}>Nenhuma máquina vinculada.</p>;

    return (
      <div>
        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
          🏭 {maquinas.length} máquina{maquinas.length !== 1 ? 's' : ''} vinculada{maquinas.length !== 1 ? 's' : ''}
        </p>

        {maquinas.map((m) => {
          const aberta   = maquinaAberta === m.numero_serie;
          const regs     = registrosMaq[m.numero_serie] || [];
          const loading  = carregandoReg === m.numero_serie;
          const ativos   = regs.filter(r => r.status_lancamento !== 'Cancelado').length;

          return (
            <div key={m.numero_serie} style={s.maqBloco}>
              {/* ── Cabeçalho da máquina ── */}
              <div
                style={{ ...s.maqHeader, ...(aberta ? s.maqHeaderAberto : {}) }}
                onClick={() => toggleMaquina(m.numero_serie)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
                  {/* Serial */}
                  <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '15px', minWidth: '140px' }}>
                    {m.numero_serie}
                  </span>
                  {/* Local / Cliente */}
                  <span style={{ color: '#f1f5f9', fontSize: '14px' }}>
                    {m.nome_local || m.nome_cliente || '—'}
                  </span>
                  {/* Modelo */}
                  {m.modelo && (
                    <span style={{ color: '#64748b', fontSize: '12px' }}>{m.modelo}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold',
                    backgroundColor: corStatus(m.status) + '22',
                    color: corStatus(m.status),
                    border: `1px solid ${corStatus(m.status)}55`,
                  }}>
                    {m.status || 'Desconhecido'}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '18px', transition: 'transform 0.2s', transform: aberta ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </div>
              </div>

              {/* ── Registros expandidos ── */}
              {aberta && (
                <div style={s.maqRegistros}>
                  {loading ? (
                    <p style={{ ...s.msg, padding: '20px 0' }}>Carregando registros...</p>
                  ) : regs.length === 0 ? (
                    <p style={{ ...s.msg, padding: '20px 0' }}>Nenhum registro encontrado para esta máquina.</p>
                  ) : (
                    <>
                      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px', padding: '0 4px' }}>
                        📋 Registros do Cliente ({ativos})
                      </p>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={s.tabela}>
                          <thead>
                            <tr>
                              <th style={s.th}>Data</th>
                              <th style={s.th}>Serial</th>
                              <th style={s.th}>Cliente</th>
                              <th style={s.th}>Tipo de Registro</th>
                              <th style={{ ...s.th, textAlign: 'right' }}>Qtd (L)</th>
                              <th style={s.th}>Técnico</th>
                              <th style={s.th}>Conferente</th>
                              <th style={{ ...s.th, textAlign: 'right' }}>Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {regs.map((r, i) => {
                              const cancelado = r.status_lancamento === 'Cancelado';
                              const valor = r.tipo_servico === 'Abastecimento' && parseFloat(r.valor_unitario || 0) > 0
                                ? parseFloat(r.qtd_abastecida || 0) * parseFloat(r.valor_unitario || 0)
                                : null;
                              return (
                                <tr key={i} style={{ ...s.tr, opacity: cancelado ? 0.4 : 1, backgroundColor: i % 2 === 0 ? 'transparent' : '#0f172a33' }}>
                                  <td style={s.td}>{formatarDataCurta(r.created_at)}</td>
                                  <td style={s.td}>{r.numero_serie}</td>
                                  <td style={s.td}>{r.nome_cliente || '—'}</td>
                                  <td style={s.td}>
                                    <span>{iconeRegistro(r.tipo_servico)} {r.tipo_servico}</span>
                                    {cancelado && (
                                      <span style={{ color: '#6b7280', fontSize: '11px', marginLeft: '6px' }}>● Cancelado</span>
                                    )}
                                  </td>
                                  <td style={{ ...s.td, textAlign: 'right', color: r.qtd_abastecida ? '#38bdf8' : '#475569' }}>
                                    {r.qtd_abastecida ? `${r.qtd_abastecida} L` : '—'}
                                  </td>
                                  <td style={{ ...s.td, color: '#94a3b8' }}>{r.tecnico_nome || '—'}</td>
                                  <td style={{ ...s.td, color: '#94a3b8' }}>{r.nome_assinante || '—'}</td>
                                  <td style={{ ...s.td, textAlign: 'right', color: valor ? '#22c55e' : '#475569', fontWeight: valor ? 'bold' : 'normal' }}>
                                    {valor
                                      ? `R$ ${valor.toFixed(2).replace('.', ',')}`
                                      : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderChamados() {
    return (
      <div>
        <div style={s.topBar}>
          <h3 style={{ color: '#f1f5f9', margin: 0 }}>Meus Chamados</h3>
        </div>

        {chamadoSel && (
          <div style={s.modal}>
            <div style={s.modalBox}>
              <div style={s.modalHeader}>
                <h3 style={{ color: '#38bdf8', margin: 0 }}>{chamadoSel.titulo}</h3>
                <button style={s.btnFechar} onClick={() => setChamadoSel(null)}>✕</button>
              </div>
              <div style={s.grid2}>
                <Campo label="Máquina"    valor={chamadoSel.nome_local || chamadoSel.numero_serie || '—'} />
                <Campo label="Aberto em"  valor={formatarData(chamadoSel.created_at)} />
                <Campo label="Prioridade" valor={chamadoSel.prioridade} cor={corPrioridade(chamadoSel.prioridade)} />
                <Campo label="Status"     valor={chamadoSel.status}     cor={corChamado(chamadoSel.status)} />
                {chamadoSel.atribuido_a_nome && (
                  <Campo label="Técnico Responsável" valor={chamadoSel.atribuido_a_nome} />
                )}
                {chamadoSel.data_resolucao && (
                  <Campo label="Resolvido em" valor={formatarData(chamadoSel.data_resolucao)} />
                )}
              </div>
              {chamadoSel.descricao && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Descrição</p>
                  <p style={{ color: '#f1f5f9', margin: 0, lineHeight: '1.6' }}>{chamadoSel.descricao}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {carregandoCh ? (
          <p style={s.msg}>Carregando...</p>
        ) : !chamados.length ? (
          <div style={s.vazio}>
            <p style={{ fontSize: '40px', margin: '0 0 8px 0' }}>✅</p>
            <p style={{ color: '#94a3b8' }}>Nenhum chamado aberto.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chamados.map((c) => (
              <div key={c.id} style={s.chamadoCard} onClick={() => setChamadoSel(c)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '12px' }}>
                    <p style={{ color: '#f1f5f9', margin: '0 0 4px 0', fontWeight: 'bold' }}>{c.titulo}</p>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>
                      {c.nome_local || c.numero_serie || 'Sem máquina'} · {formatarDataCurta(c.created_at)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ ...s.tag, color: corChamado(c.status), backgroundColor: corChamado(c.status) + '22', border: `1px solid ${corChamado(c.status)}44` }}>
                      {c.status}
                    </span>
                    <span style={{ ...s.tag, color: corPrioridade(c.prioridade), backgroundColor: corPrioridade(c.prioridade) + '22', border: `1px solid ${corPrioridade(c.prioridade)}44` }}>
                      {c.prioridade}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderFinanceiro() {
    return (
      <div style={s.placeholderBox}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '56px', margin: '0 0 16px 0' }}>💰</p>
          <h3 style={{ color: '#f1f5f9', margin: '0 0 8px 0' }}>Módulo Financeiro</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 24px 0', maxWidth: '360px' }}>
            Em breve você poderá acompanhar faturas, consumo mensal e histórico de pagamentos diretamente aqui.
          </p>
          <div style={{ display: 'inline-block', padding: '8px 20px', backgroundColor: '#f59e0b22', border: '1px solid #f59e0b44', borderRadius: '8px', color: '#f59e0b', fontSize: '14px' }}>
            🚧 Em desenvolvimento
          </div>
        </div>
      </div>
    );
  }

  // ── Render principal ─────────────────────────────

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.logo}>BlendPro</h1>
          <p style={s.clienteNome}>{nomeCliente}</p>
        </div>
        <button style={s.btnSair} onClick={handleLogout}>Sair</button>
      </div>

      {/* Abas */}
      <div style={s.abas}>
        {[
          { id: 'maquinas',   icon: '🏭', label: 'Máquinas' },
          { id: 'chamados',   icon: '🎫', label: 'Chamados' },
          { id: 'financeiro', icon: '💰', label: 'Financeiro' },
        ].map((a) => (
          <button key={a.id}
            style={{ ...s.aba, ...(aba === a.id ? s.abaAtiva : {}) }}
            onClick={() => setAba(a.id)}>
            <span style={{ fontSize: '20px' }}>{a.icon}</span>
            <span style={{ fontSize: '12px', marginTop: '2px' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={s.conteudo}>
        {aba === 'maquinas'   && renderMaquinas()}
        {aba === 'chamados'   && renderChamados()}
        {aba === 'financeiro' && renderFinanceiro()}
      </div>
    </div>
  );
}

// ── Componente auxiliar ──────────────────────────

function Campo({ label, valor, cor }) {
  return (
    <div>
      <p style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', margin: '0 0 2px 0', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ color: cor || '#f1f5f9', margin: 0, fontWeight: cor ? 'bold' : 'normal' }}>{valor || '—'}</p>
    </div>
  );
}

// ── Estilos ──────────────────────────────────────

const s = {
  container:   { backgroundColor: '#0f172a', minHeight: '100vh', color: '#f1f5f9', display: 'flex', flexDirection: 'column' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  logo:        { color: '#38bdf8', margin: 0, fontSize: '20px' },
  clienteNome: { color: '#94a3b8', margin: 0, fontSize: '13px' },
  btnSair:     { padding: '8px 16px', backgroundColor: '#ef444422', color: '#ef4444', border: '1px solid #ef444444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },

  abas:     { display: 'flex', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  aba:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', backgroundColor: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', transition: 'all 0.2s', gap: '2px', fontWeight: '500' },
  abaAtiva: { color: '#38bdf8', borderBottom: '2px solid #38bdf8' },

  conteudo: { padding: '20px 16px', flex: 1, maxWidth: '960px', width: '100%', margin: '0 auto', boxSizing: 'border-box' },

  msg:   { color: '#94a3b8', textAlign: 'center', padding: '40px 0' },
  vazio: { textAlign: 'center', padding: '40px 0' },

  // Máquina accordion
  maqBloco: { marginBottom: '10px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #334155' },

  maqHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px', backgroundColor: '#1e293b', cursor: 'pointer',
    transition: 'background-color 0.15s', userSelect: 'none',
  },
  maqHeaderAberto: { backgroundColor: '#1a3048', borderBottom: '1px solid #334155' },

  maqRegistros: { backgroundColor: '#0f172a', padding: '16px 18px 20px' },

  // Tabela de registros
  tabela: { width: '100%', borderCollapse: 'collapse', minWidth: '680px' },
  th:     { textAlign: 'left', padding: '10px 14px', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '12px', borderBottom: '2px solid #334155', whiteSpace: 'nowrap' },
  tr:     { borderBottom: '1px solid #1e293b20' },
  td:     { padding: '9px 14px', color: '#f1f5f9', fontSize: '13px' },

  // Modal chamados
  modal:       { position: 'fixed', inset: 0, backgroundColor: '#0f172aCC', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' },
  modalBox:    { backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #334155' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  btnFechar:   { padding: '6px 12px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  grid2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },

  topBar:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  chamadoCard: { backgroundColor: '#1e293b', borderRadius: '10px', padding: '16px 20px', cursor: 'pointer', border: '1px solid #334155', transition: 'border-color 0.2s' },
  tag:         { padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold' },

  placeholderBox: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' },
};
