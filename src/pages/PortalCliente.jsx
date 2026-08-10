import { useState, useEffect } from 'react';
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


function iconeRegistro(tipo) {
  if (tipo === 'Abastecimento')          return '💧';
  if (tipo === 'Instalação')             return '🏗️';
  if (tipo === 'Retirada')               return '📦';
  if (tipo === 'Vista sem abastecimento') return '👁️';
  if (tipo === 'Inspeção')               return '👁️';
  if (tipo === 'Limpeza')                return '🧽';
  return '🔧';
}

// Normaliza um registro de `registros_operacionais` (v2) para o mesmo
// formato usado pelas linhas de `manutencoes` (v1) nesta tabela.
function normalizarRegistroOperacional(r) {
  return {
    created_at: r.data_visita,
    numero_serie: r.numero_serie,
    nome_cliente: r.nome_cliente,
    tipo_servico: r.tipo_acao,
    qtd_abastecida: r.quantidade_litros,
    tecnico_nome: r.tecnico_nome,
    nome_assinante: r.nome_conferente,
    status_lancamento: null,
    valor_unitario: null,
  };
}

// ── Componente principal ─────────────────────────

export default function PortalCliente() {
  const navigate    = useNavigate();
  const { usuario } = useUsuario();

  const [aba, setAba]               = useState('maquinas');
  const [maquinas, setMaquinas]     = useState([]);
  const [carregandoMaq, setCarregandoMaq] = useState(true);

  // Todos os registros do cliente (carregados uma vez)
  const [todosRegistros, setTodosRegistros] = useState([]);
  const [carregandoReg,  setCarregandoReg]  = useState(true);

  // Máquina expandida
  const [maquinaAberta, setMaquinaAberta] = useState(null);

  // Carrega máquinas + registros ao montar
  useEffect(() => {
    api.get('/maquinas')
      .then((r) => setMaquinas(r.data))
      .catch(() => setMaquinas([]))
      .finally(() => setCarregandoMaq(false));

    Promise.all([
      api.get('/manutencoes').catch(() => ({ data: [] })),
      api.get('/registros-operacionais?limite=500').catch(() => ({ data: { dados: [] } })),
    ]).then(([resAntigos, resNovos]) => {
      const antigos = resAntigos.data || [];
      const novos = (resNovos.data.dados || []).map(normalizarRegistroOperacional);
      const ordenados = [...antigos, ...novos].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      setTodosRegistros(ordenados);
    })
      .catch(() => setTodosRegistros([]))
      .finally(() => setCarregandoReg(false));
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  }

  // Abre/fecha registros de uma máquina (filtragem local)
  function toggleMaquina(serial) {
    setMaquinaAberta((prev) => (prev === serial ? null : serial));
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
    if (carregandoMaq || carregandoReg) return <p style={s.msg}>Carregando...</p>;
    if (!maquinas.length) return <p style={s.msg}>Nenhuma máquina vinculada.</p>;

    return (
      <div>
        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
          🏭 {maquinas.length} máquina{maquinas.length !== 1 ? 's' : ''} vinculada{maquinas.length !== 1 ? 's' : ''}
        </p>

        {maquinas.map((m) => {
          const aberta = maquinaAberta === m.numero_serie;
          const regs   = todosRegistros.filter(r => r.numero_serie === m.numero_serie);
          const ativos = regs.filter(r => r.status_lancamento !== 'Cancelado').length;

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
                  {regs.length === 0 ? (
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

      {/* Conteúdo */}
      <div style={s.conteudo}>
        {renderMaquinas()}
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
