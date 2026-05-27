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
  if (p === 'Alta')  return '#ef4444';
  if (p === 'Normal') return '#f59e0b';
  return '#22c55e';
}

function NivelEstoque({ atual, minimo }) {
  if (atual == null) return <span style={{ color: '#94a3b8', fontSize: '12px' }}>Sem dados</span>;
  const pct = minimo ? Math.min(100, Math.round((atual / (minimo * 2)) * 100)) : 50;
  const cor = pct <= 25 ? '#ef4444' : pct <= 50 ? '#f59e0b' : '#22c55e';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Estoque</span>
        <span style={{ fontSize: '12px', color: cor, fontWeight: 'bold' }}>{atual?.toLocaleString('pt-BR')} mL</span>
      </div>
      <div style={{ backgroundColor: '#0f172a', borderRadius: '4px', height: '6px', width: '100%' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: cor, borderRadius: '4px', transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────

export default function PortalCliente() {
  const navigate  = useNavigate();
  const { usuario } = useUsuario();

  const [aba, setAba]                       = useState('maquinas');
  const [maquinas, setMaquinas]             = useState([]);
  const [eventos, setEventos]               = useState([]);
  const [chamados, setChamados]             = useState([]);
  const [historico, setHistorico]           = useState([]);
  const [carregandoMaq, setCarregandoMaq]   = useState(true);
  const [carregandoEv, setCarregandoEv]     = useState(false);
  const [carregandoCh, setCarregandoCh]     = useState(false);
  const [carregandoHist, setCarregandoHist] = useState(false);
  const [maquinaSel, setMaquinaSel]         = useState(null);
  const [chamadoSel, setChamadoSel]         = useState(null);
  const [filtroSerial, setFiltroSerial]     = useState('');
  const [filtroSerialHist, setFiltroSerialHist] = useState('');

  // Carrega máquinas sempre
  useEffect(() => {
    api.get('/maquinas')
      .then((r) => setMaquinas(r.data))
      .catch(() => setMaquinas([]))
      .finally(() => setCarregandoMaq(false));
  }, []);

  // Carrega eventos ao entrar na aba
  const carregarEventos = useCallback(() => {
    setCarregandoEv(true);
    const params = filtroSerial ? `?serial=${filtroSerial}&limite=300` : '?limite=300';
    api.get(`/eventos${params}`)
      .then((r) => setEventos(r.data.dados || []))
      .catch(() => setEventos([]))
      .finally(() => setCarregandoEv(false));
  }, [filtroSerial]);

  // Carrega chamados ao entrar na aba
  const carregarChamados = useCallback(() => {
    setCarregandoCh(true);
    api.get('/chamados')
      .then((r) => setChamados(r.data))
      .catch(() => setChamados([]))
      .finally(() => setCarregandoCh(false));
  }, []);

  // Carrega histórico de registros ao entrar na aba
  const carregarHistorico = useCallback((serial = '') => {
    setCarregandoHist(true);
    const params = serial ? `?serial=${serial}` : '';
    api.get(`/manutencoes${params}`)
      .then((r) => setHistorico(r.data))
      .catch(() => setHistorico([]))
      .finally(() => setCarregandoHist(false));
  }, []);

  useEffect(() => {
    if (aba === 'abastecimentos') carregarEventos();
    if (aba === 'chamados') carregarChamados();
    if (aba === 'historico') carregarHistorico(filtroSerialHist);
  }, [aba, carregarEventos, carregarChamados, carregarHistorico, filtroSerialHist]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  }

  // Nome de exibição: nome do usuário + resumo de filiais
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
      <div style={s.cardGrid}>
        {maquinas.map((m) => (
          <div key={m.numero_serie} style={s.maqCard} onClick={() => setMaquinaSel(m)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <p style={s.maqNome}>{m.nome_local || m.numero_serie}</p>
                <p style={s.maqSub}>{m.modelo} · {m.numero_serie}</p>
              </div>
              <span style={{ ...s.badge, backgroundColor: corStatus(m.status) + '22', color: corStatus(m.status), border: `1px solid ${corStatus(m.status)}55` }}>
                {m.status || 'Desconhecido'}
              </span>
            </div>
            <NivelEstoque atual={m.estoque_atual} minimo={m.estoque_minimo} />
            <p style={s.maqFooter}>
              Último contato: {m.ultima_comunicacao ? formatarData(m.ultima_comunicacao) : 'Nunca'}
            </p>
          </div>
        ))}
      </div>
    );
  }

  function renderDetalheMaquina() {
    if (!maquinaSel) return null;
    const m = maquinaSel;
    return (
      <div style={s.modal}>
        <div style={s.modalBox}>
          <div style={s.modalHeader}>
            <h3 style={{ color: '#38bdf8', margin: 0 }}>{m.nome_local || m.numero_serie}</h3>
            <button style={s.btnFechar} onClick={() => setMaquinaSel(null)}>✕</button>
          </div>
          <div style={s.grid2}>
            <Campo label="Número de Série" valor={m.numero_serie} />
            <Campo label="Modelo"          valor={m.modelo} />
            <Campo label="Status"          valor={m.status} cor={corStatus(m.status)} />
            <Campo label="Modo de Acesso"  valor={m.modo_acesso} />
            <Campo label="Produto"         valor={m.nome_produto} />
            <Campo label="Estoque Atual"   valor={m.estoque_atual != null ? `${m.estoque_atual?.toLocaleString('pt-BR')} mL` : '—'} />
            <Campo label="Estoque Mínimo"  valor={m.estoque_minimo != null ? `${m.estoque_minimo?.toLocaleString('pt-BR')} mL` : '—'} />
            <Campo label="Última Comunicação" valor={formatarData(m.ultima_comunicacao)} />
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button style={{ ...s.btnAcao, backgroundColor: '#0ea5e9' }}
              onClick={() => { setAba('abastecimentos'); setFiltroSerial(m.numero_serie); setMaquinaSel(null); }}>
              💧 Ver Abastecimentos
            </button>
            <button style={{ ...s.btnAcao, backgroundColor: '#334155' }}
              onClick={() => { setFiltroSerialHist(m.numero_serie); setAba('historico'); setMaquinaSel(null); }}>
              📋 Ver Histórico
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderAbastecimentos() {
    return (
      <div>
        {/* Filtro por máquina */}
        <div style={s.filtroBar}>
          <select style={s.select} value={filtroSerial}
            onChange={(e) => setFiltroSerial(e.target.value)}>
            <option value="">Todas as máquinas</option>
            {maquinas.map((m) => (
              <option key={m.numero_serie} value={m.numero_serie}>
                {m.nome_local || m.numero_serie}
              </option>
            ))}
          </select>
          <button style={s.btnFiltro} onClick={carregarEventos}>🔄 Atualizar</button>
        </div>

        {carregandoEv ? (
          <p style={s.msg}>Carregando...</p>
        ) : !eventos.length ? (
          <p style={s.msg}>Nenhum abastecimento registrado.</p>
        ) : (
          <>
            {/* Resumo */}
            <div style={s.resumoBar}>
              <div style={s.resumoItem}>
                <span style={s.resumoLabel}>Total de dispensações</span>
                <span style={s.resumoValor}>{eventos.filter(e => e.evento === 'DISPENSACAO' || e.qtd_venda_real > 0).length}</span>
              </div>
              <div style={s.resumoItem}>
                <span style={s.resumoLabel}>Volume total (L)</span>
                <span style={s.resumoValor}>
                  {(eventos.reduce((acc, e) => acc + (parseFloat(e.qtd_venda_real) || 0), 0) / 1000).toFixed(1)}
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={s.tabela}>
                <thead>
                  <tr>
                    <th style={s.th}>Data</th>
                    <th style={s.th}>Máquina</th>
                    <th style={s.th}>Evento</th>
                    <th style={s.th}>Produto</th>
                    <th style={s.th}>Volume</th>
                    <th style={s.th}>Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {eventos.map((e, i) => (
                    <tr key={e.id || i} style={s.tr}>
                      <td style={s.td}>{formatarDataCurta(e.created_at)}</td>
                      <td style={s.td}>{e.nome_local || e.numero_serie}</td>
                      <td style={s.td}>
                        <span style={{ color: e.evento === 'DISPENSACAO' ? '#22c55e' : '#94a3b8', fontSize: '12px' }}>
                          {e.evento || '—'}
                        </span>
                      </td>
                      <td style={s.td}>{e.produto || e.codigo_produto || '—'}</td>
                      <td style={s.td}>
                        {e.qtd_venda_real ? (
                          <span style={{ color: '#38bdf8' }}>{parseFloat(e.qtd_venda_real).toLocaleString('pt-BR')} mL</span>
                        ) : '—'}
                      </td>
                      <td style={s.td}>
                        {e.estoque_atual != null ? `${e.estoque_atual?.toLocaleString('pt-BR')} mL` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
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

  function renderHistorico() {
    const icone = (tipo) => {
      if (tipo === 'Abastecimento') return '💧';
      if (tipo === 'Instalação') return '🏗️';
      if (tipo === 'Retirada') return '📦';
      if (tipo === 'Vista sem abastecimento') return '👁️';
      return '🔧';
    };

    const histOrdenado = [...historico].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const histFiltrado = filtroSerialHist
      ? histOrdenado.filter(r => r.numero_serie === filtroSerialHist)
      : histOrdenado;
    const ativos = histFiltrado.filter(r => r.status_lancamento !== 'Cancelado').length;

    return (
      <div>
        <div style={s.filtroBar}>
          <select style={s.select} value={filtroSerialHist}
            onChange={(e) => { setFiltroSerialHist(e.target.value); carregarHistorico(e.target.value); }}>
            <option value="">Todas as máquinas</option>
            {maquinas.map((m) => (
              <option key={m.numero_serie} value={m.numero_serie}>
                {m.nome_local || m.numero_serie}
              </option>
            ))}
          </select>
          <button style={s.btnFiltro} onClick={() => carregarHistorico(filtroSerialHist)}>🔄 Atualizar</button>
        </div>

        {carregandoHist ? (
          <p style={s.msg}>Carregando...</p>
        ) : !histFiltrado.length ? (
          <p style={s.msg}>Nenhum registro encontrado.</p>
        ) : (
          <>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
              📋 Registros ({ativos})
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.tabela}>
                <thead>
                  <tr>
                    <th style={s.th}>Data</th>
                    <th style={s.th}>Serial</th>
                    <th style={s.th}>Cliente</th>
                    <th style={s.th}>Tipo de Registro</th>
                    <th style={s.th}>Qtd (L)</th>
                    <th style={s.th}>Valor Cobrado</th>
                    <th style={s.th}>Técnico</th>
                    <th style={s.th}>Conferente</th>
                  </tr>
                </thead>
                <tbody>
                  {histFiltrado.map((r, i) => {
                    const cancelado = r.status_lancamento === 'Cancelado';
                    return (
                      <tr key={i} style={{ ...s.tr, opacity: cancelado ? 0.4 : 1 }}>
                        <td style={s.td}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                        <td style={s.td}>{r.numero_serie}</td>
                        <td style={s.td}>{r.nome_cliente || '—'}</td>
                        <td style={s.td}>
                          {icone(r.tipo_servico)} {r.tipo_servico}
                          {cancelado && <span style={{ color: '#6b7280', fontSize: '11px', marginLeft: '6px' }}>● Cancelado</span>}
                        </td>
                        <td style={{ ...s.td, color: '#38bdf8' }}>{r.qtd_abastecida ? `${r.qtd_abastecida} L` : '—'}</td>
                        <td style={{ ...s.td, color: '#22c55e', fontWeight: 'bold' }}>
                          {r.tipo_servico === 'Abastecimento' && parseFloat(r.valor_unitario || 0) > 0
                            ? `R$ ${(parseFloat(r.qtd_abastecida || 0) * parseFloat(r.valor_unitario || 0)).toFixed(2).replace('.', ',')}`
                            : '—'}
                        </td>
                        <td style={{ ...s.td, color: '#94a3b8' }}>{r.tecnico_nome || r.tecnico_responsavel || '—'}</td>
                        <td style={{ ...s.td, color: '#94a3b8' }}>{r.nome_assinante || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
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
          { id: 'maquinas',       icon: '🏭', label: 'Máquinas' },
          { id: 'abastecimentos', icon: '💧', label: 'Abastecimentos' },
          { id: 'historico',      icon: '📋', label: 'Histórico' },
          { id: 'chamados',       icon: '🎫', label: 'Chamados' },
          { id: 'financeiro',     icon: '💰', label: 'Financeiro' },
        ].map((a) => (
          <button key={a.id} style={{ ...s.aba, ...(aba === a.id ? s.abaAtiva : {}) }}
            onClick={() => { setAba(a.id); if (a.id !== 'abastecimentos') setFiltroSerial(''); }}>
            <span style={{ fontSize: '20px' }}>{a.icon}</span>
            <span style={{ fontSize: '12px', marginTop: '2px' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={s.conteudo}>
        {aba === 'maquinas'       && renderMaquinas()}
        {aba === 'abastecimentos' && renderAbastecimentos()}
        {aba === 'historico'      && renderHistorico()}
        {aba === 'chamados'       && renderChamados()}
        {aba === 'financeiro'     && renderFinanceiro()}
      </div>

      {/* Modais */}
      {renderDetalheMaquina()}
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

  abas:    { display: 'flex', backgroundColor: '#1e293b', borderBottom: '1px solid #334155' },
  aba:     { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', backgroundColor: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', transition: 'all 0.2s', gap: '2px', fontWeight: '500' },
  abaAtiva:{ color: '#38bdf8', borderBottom: '2px solid #38bdf8' },

  conteudo: { padding: '20px 16px', flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', boxSizing: 'border-box' },

  msg:      { color: '#94a3b8', textAlign: 'center', padding: '40px 0' },
  vazio:    { textAlign: 'center', padding: '40px 0' },

  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
  maqCard:  { backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', cursor: 'pointer', border: '1px solid #334155', transition: 'border-color 0.2s' },
  maqNome:  { color: '#f1f5f9', margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '16px' },
  maqSub:   { color: '#94a3b8', margin: '0 0 16px 0', fontSize: '12px' },
  maqFooter:{ color: '#475569', margin: '12px 0 0 0', fontSize: '11px' },
  badge:    { padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' },

  modal:    { position: 'fixed', inset: 0, backgroundColor: '#0f172aCC', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' },
  modalBox: { backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #334155' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  btnFechar:{ padding: '6px 12px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  btnAcao:  { padding: '10px 18px', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },

  filtroBar: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  select:    { flex: 1, minWidth: '200px', padding: '10px 14px', backgroundColor: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px' },
  btnFiltro: { padding: '10px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },

  resumoBar:   { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  resumoItem:  { flex: 1, minWidth: '140px', backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 18px', border: '1px solid #334155' },
  resumoLabel: { display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '4px' },
  resumoValor: { display: 'block', color: '#38bdf8', fontSize: '24px', fontWeight: 'bold' },

  tabela: { width: '100%', borderCollapse: 'collapse', minWidth: '560px' },
  th:     { textAlign: 'left', padding: '10px 14px', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '12px', borderBottom: '1px solid #334155' },
  tr:     { borderBottom: '1px solid #1e293b' },
  td:     { padding: '10px 14px', color: '#f1f5f9', fontSize: '13px' },

  topBar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  btnNovo:    { padding: '10px 18px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  formBox:    { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #334155' },
  input:      { padding: '10px 14px', backgroundColor: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  btnSalvar:  { padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
  chamadoCard:{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '16px 20px', cursor: 'pointer', border: '1px solid #334155', transition: 'border-color 0.2s' },
  tag:        { padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 'bold' },

  placeholderBox: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' },
};
