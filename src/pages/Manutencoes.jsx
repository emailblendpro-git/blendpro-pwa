import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

const moeda = (v) => `R$ ${parseFloat(v || 0).toFixed(2).replace('.', ',')}`;

export default function Manutencoes() {
  const navigate = useNavigate();
  const { podeManutencao, podeGerenciar } = useUsuario();
  const [aba, setAba] = useState('registros');
  const [manutencoes, setManutencoes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [custos, setCustos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoCustos, setCarregandoCustos] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarFormCusto, setMostrarFormCusto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [filtroCustoSerial, setFiltroCustoSerial] = useState('');
  const [filtroCustoStatus, setFiltroCustoStatus] = useState('');
  const [editandoCusto, setEditandoCusto] = useState(null);

  const [form, setForm] = useState({
    numero_serie: '',
    tipo_servico: '',
    qtd_abastecida: '',
    observacao: '',
    nome_assinante: '',
  });

  const [formCusto, setFormCusto] = useState({
    numero_serie: '',
    data: new Date().toISOString().split('T')[0],
    tipo: '',
    descricao: '',
    valor: '',
    tecnico_responsavel: '',
    observacoes: '',
  });

  useEffect(() => {
    api.get('/manutencoes').then((res) => setManutencoes(res.data)).catch(() => setManutencoes([])).finally(() => setCarregando(false));
    api.get('/maquinas').then((res) => setMaquinas(res.data)).catch(() => setMaquinas([]));
  }, []);

  useEffect(() => {
    if (aba === 'custos') carregarCustos();
  }, [aba, filtroCustoSerial, filtroCustoStatus]);

  const carregarCustos = async () => {
    try {
      setCarregandoCustos(true);
      const params = new URLSearchParams();
      if (filtroCustoSerial) params.append('serial', filtroCustoSerial);
      if (filtroCustoStatus) params.append('status', filtroCustoStatus);
      const res = await api.get(`/custos?${params.toString()}`);
      setCustos(res.data);
    } catch { setCustos([]); }
    finally { setCarregandoCustos(false); }
  };

  const handleSubmit = async () => {
    if (!form.numero_serie || !form.tipo_servico) {
      alert('Máquina e Tipo de Serviço são obrigatórios.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/manutencoes', {
        ...form,
        qtd_abastecida: form.qtd_abastecida ? parseFloat(form.qtd_abastecida) : null,
      });
      alert('Registro salvo com sucesso!');
      setMostrarForm(false);
      setForm({ numero_serie: '', tipo_servico: '', qtd_abastecida: '', observacao: '', nome_assinante: '' });
      const res = await api.get('/manutencoes');
      setManutencoes(res.data);
    } catch { alert('Erro ao salvar registro.'); }
    finally { setSalvando(false); }
  };

  const handleSubmitCusto = async () => {
    if (!formCusto.numero_serie || !formCusto.tipo || !formCusto.valor || !formCusto.data) {
      alert('Máquina, data, tipo e valor são obrigatórios.');
      return;
    }
    setSalvando(true);
    try {
      if (editandoCusto) {
        await api.patch(`/custos/${editandoCusto.id}`, { ...formCusto, valor: parseFloat(formCusto.valor) });
        alert('Custo atualizado com sucesso!');
      } else {
        await api.post('/custos', { ...formCusto, valor: parseFloat(formCusto.valor) });
        alert('Custo registrado com sucesso!');
      }
      setMostrarFormCusto(false);
      setEditandoCusto(null);
      setFormCusto({ numero_serie: '', data: new Date().toISOString().split('T')[0], tipo: '', descricao: '', valor: '', tecnico_responsavel: '', observacoes: '' });
      await carregarCustos();
    } catch { alert('Erro ao salvar custo.'); }
    finally { setSalvando(false); }
  };

  const handleConfirmarCusto = async (id) => {
    if (!window.confirm('Confirmar este custo? Ele entrará nos relatórios financeiros.')) return;
    try {
      await api.patch(`/custos/${id}/confirmar`);
      await carregarCustos();
    } catch { alert('Erro ao confirmar custo.'); }
  };

  const handleDeletarCusto = async (id) => {
    if (!window.confirm('Deseja remover este custo?')) return;
    try {
      await api.delete(`/custos/${id}`);
      await carregarCustos();
    } catch { alert('Erro ao remover custo.'); }
  };

  const handleEditarCusto = (custo) => {
    setEditandoCusto(custo);
    setFormCusto({
      numero_serie: custo.numero_serie,
      data: custo.data?.split('T')[0] || '',
      tipo: custo.tipo,
      descricao: custo.descricao || '',
      valor: custo.valor,
      tecnico_responsavel: custo.tecnico_responsavel || '',
      observacoes: custo.observacoes || '',
    });
    setMostrarFormCusto(true);
  };

  const formatarData = (data) => { if (!data) return '—'; return new Date(data).toLocaleString('pt-BR'); };
  const formatarDataSimples = (data) => { if (!data) return '—'; return new Date(data).toLocaleDateString('pt-BR'); };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <button style={styles.botaoVoltar} onClick={() => navigate('/dashboard')}>← Voltar</button>
      </div>
      <div style={styles.conteudo}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitulo}>Manutenções</h2>
          {aba === 'registros' && podeManutencao && (
            <button style={styles.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? '✕ Fechar' : '+ Novo Registro'}
            </button>
          )}
          {aba === 'custos' && podeManutencao && (
            <button style={styles.botaoNovo} onClick={() => { setMostrarFormCusto(!mostrarFormCusto); setEditandoCusto(null); setFormCusto({ numero_serie: '', data: new Date().toISOString().split('T')[0], tipo: '', descricao: '', valor: '', tecnico_responsavel: '', observacoes: '' }); }}>
              {mostrarFormCusto ? '✕ Fechar' : '+ Novo Custo'}
            </button>
          )}
        </div>

        {/* ABAS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button style={{ ...styles.aba, ...(aba === 'registros' ? styles.abaAtiva : {}) }} onClick={() => setAba('registros')}>🔧 Registros</button>
          <button style={{ ...styles.aba, ...(aba === 'custos' ? styles.abaAtiva : {}) }} onClick={() => setAba('custos')}>💰 Custos</button>
        </div>

        {/* ABA REGISTROS */}
        {aba === 'registros' && (
          <div>
            {mostrarForm && podeManutencao && (
              <div style={styles.form}>
                <h3 style={styles.formTitulo}>Novo Registro</h3>
                <select style={styles.input} value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })}>
                  <option value="">Selecionar Máquina *</option>
                  {maquinas.map((m) => (<option key={m.id} value={m.numero_serie}>{m.numero_serie} — {m.nome_cliente || 'Sem cliente'}</option>))}
                </select>
                <select style={styles.input} value={form.tipo_servico} onChange={(e) => setForm({ ...form, tipo_servico: e.target.value })}>
                  <option value="">Tipo de Serviço *</option>
                  <option value="Instalação">Instalação</option>
                  <option value="Abastecimento">Abastecimento</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Retirada">Retirada</option>
                </select>
                {form.tipo_servico === 'Abastecimento' && (
                  <input style={styles.input} placeholder="Quantidade Abastecida (litros)" type="number" value={form.qtd_abastecida} onChange={(e) => setForm({ ...form, qtd_abastecida: e.target.value })} />
                )}
                <input style={styles.input} placeholder="Nome do Assinante" value={form.nome_assinante} onChange={(e) => setForm({ ...form, nome_assinante: e.target.value })} />
                <textarea style={styles.input} placeholder="Observações" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={3} />
                <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar Registro'}</button>
              </div>
            )}
            {carregando ? (
              <p style={styles.mensagem}>Carregando...</p>
            ) : manutencoes.length === 0 ? (
              <p style={styles.mensagem}>Nenhum registro encontrado.</p>
            ) : (
              <table style={styles.tabela}>
                <thead>
                  <tr>
                    <th style={styles.th}>Data</th>
                    <th style={styles.th}>Máquina</th>
                    <th style={styles.th}>Tipo</th>
                    <th style={styles.th}>Técnico</th>
                    <th style={styles.th}>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {manutencoes.map((m) => (
                    <tr key={m.id} style={styles.tr}>
                      <td style={styles.td}>{formatarData(m.created_at)}</td>
                      <td style={styles.td}>{m.numero_serie}</td>
                      <td style={styles.td}>{m.tipo_servico}</td>
                      <td style={styles.td}>{m.tecnico_nome || '—'}</td>
                      <td style={styles.td}>{m.observacao || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ABA CUSTOS */}
        {aba === 'custos' && (
          <div>
            {/* Formulário novo custo */}
            {mostrarFormCusto && podeManutencao && (
              <div style={styles.form}>
                <h3 style={styles.formTitulo}>{editandoCusto ? 'Editar Custo' : 'Novo Custo'}</h3>
                <select style={styles.input} value={formCusto.numero_serie} onChange={(e) => setFormCusto({ ...formCusto, numero_serie: e.target.value })}>
                  <option value="">Selecionar Máquina *</option>
                  {maquinas.map((m) => (<option key={m.id} value={m.numero_serie}>{m.numero_serie} — {m.nome_cliente || 'Sem cliente'}</option>))}
                </select>
                <input style={styles.input} type="date" value={formCusto.data} onChange={(e) => setFormCusto({ ...formCusto, data: e.target.value })} />
                <select style={styles.input} value={formCusto.tipo} onChange={(e) => setFormCusto({ ...formCusto, tipo: e.target.value })}>
                  <option value="">Tipo de Custo *</option>
                  <option value="Peça">Peça</option>
                  <option value="Mão de Obra">Mão de Obra</option>
                  <option value="Deslocamento">Deslocamento</option>
                  <option value="Gabinete">Gabinete</option>
                  <option value="Bomba">Bomba</option>
                  <option value="Válvula">Válvula</option>
                  <option value="Outro">Outro</option>
                </select>
                <input style={styles.input} placeholder="Descrição da peça/serviço" value={formCusto.descricao} onChange={(e) => setFormCusto({ ...formCusto, descricao: e.target.value })} />
                <input style={styles.input} placeholder="Valor (R$) *" type="number" step="0.01" value={formCusto.valor} onChange={(e) => setFormCusto({ ...formCusto, valor: e.target.value })} />
                <input style={styles.input} placeholder="Técnico Responsável" value={formCusto.tecnico_responsavel} onChange={(e) => setFormCusto({ ...formCusto, tecnico_responsavel: e.target.value })} />
                <textarea style={styles.input} placeholder="Observações" value={formCusto.observacoes} onChange={(e) => setFormCusto({ ...formCusto, observacoes: e.target.value })} rows={3} />
                <button style={styles.botaoSalvar} onClick={handleSubmitCusto} disabled={salvando}>{salvando ? 'Salvando...' : editandoCusto ? 'Salvar Alterações' : 'Registrar Custo'}</button>
              </div>
            )}

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <select style={styles.inputFiltro} value={filtroCustoSerial} onChange={(e) => setFiltroCustoSerial(e.target.value)}>
                <option value="">Todas as Máquinas</option>
                {maquinas.map((m) => (<option key={m.id} value={m.numero_serie}>{m.numero_serie}</option>))}
              </select>
              <select style={styles.inputFiltro} value={filtroCustoStatus} onChange={(e) => setFiltroCustoStatus(e.target.value)}>
                <option value="">Todos os Status</option>
                <option value="Pendente">Pendente</option>
                <option value="Confirmado">Confirmado</option>
              </select>
            </div>

            {carregandoCustos ? (
              <p style={styles.mensagem}>Carregando...</p>
            ) : custos.length === 0 ? (
              <p style={styles.mensagem}>Nenhum custo encontrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {custos.map((c) => (
                  <div key={c.id} style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '10px',
                    padding: '16px',
                    borderLeft: `4px solid ${c.status === 'Confirmado' ? '#22c55e' : '#f59e0b'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c.numero_serie} — {c.tipo}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{formatarDataSimples(c.data)} {c.tecnico_responsavel ? `· ${c.tecnico_responsavel}` : ''}</div>
                        {c.descricao && <div style={{ fontSize: '13px', marginTop: '4px' }}>{c.descricao}</div>}
                        {c.observacoes && <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{c.observacoes}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: c.status === 'Confirmado' ? '#22c55e' : '#f59e0b' }}>{moeda(c.valor)}</div>
                        <div style={{ fontSize: '11px', color: c.status === 'Confirmado' ? '#22c55e' : '#f59e0b', marginTop: '2px' }}>
                          {c.status === 'Confirmado' ? '✅ Confirmado' : '⏳ Pendente'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {c.status === 'Pendente' && podeGerenciar && (
                        <button style={{ ...styles.botaoAcao, backgroundColor: '#22c55e' }} onClick={() => handleConfirmarCusto(c.id)}>✅ Confirmar</button>
                      )}
                      {c.status === 'Pendente' && (
                        <button style={{ ...styles.botaoAcao, backgroundColor: '#f59e0b' }} onClick={() => handleEditarCusto(c)}>✏️ Editar</button>
                      )}
                      {podeGerenciar && (
                        <button style={{ ...styles.botaoAcao, backgroundColor: '#ef4444' }} onClick={() => handleDeletarCusto(c.id)}>🗑️ Remover</button>
                      )}
                    </div>
                  </div>
                ))}
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
  pageTitulo: { color: '#f1f5f9', marginBottom: 0 },
  mensagem: { color: '#94a3b8' },
  tabela: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #334155' },
  tr: { borderBottom: '1px solid #1e293b' },
  td: { padding: '12px 16px', color: '#f1f5f9', fontSize: '14px' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  botaoNovo: { padding: '10px 20px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  form: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitulo: { color: '#38bdf8', margin: '0 0 8px 0' },
  input: { padding: '10px 14px', backgroundColor: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  botaoSalvar: { padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '8px' },
  aba: { padding: '10px 20px', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  abaAtiva: { backgroundColor: '#0ea5e9', color: '#fff', border: '1px solid #0ea5e9' },
  inputFiltro: { padding: '10px 14px', backgroundColor: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', flex: 1, minWidth: '200px' },
  botaoAcao: { padding: '6px 14px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
};