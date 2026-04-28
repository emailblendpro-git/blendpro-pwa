import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

const moeda = (v) => `R$ ${(Math.round(parseFloat(v || 0) * 100) / 100).toFixed(2).replace('.', ',')}`;

export default function Manutencoes() {
  const navigate = useNavigate();
  const { usuario, podeManutencao, podeGerenciar } = useUsuario();
  const [registros, setRegistros] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [filtroSerial, setFiltroSerial] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [temCusto, setTemCusto] = useState(false);
  const [form, setForm] = useState({
    numero_serie: '',
    tipo_servico: '',
    qtd_abastecida: '',
    observacao: '',
    nome_assinante: '',
    tecnico_responsavel: usuario?.nome || '',
    custo_tipo: '',
    custo_descricao: '',
    custo_valor: '',
    custo_observacoes: '',
  });

  useEffect(() => {
    carregarRegistros();
    api.get('/maquinas').then((res) => setMaquinas(res.data)).catch(() => setMaquinas([]));
  }, []);

  const carregarRegistros = async () => {
    try {
      setCarregando(true);
      const [resMan, resCustos] = await Promise.all([
        api.get('/manutencoes'),
        api.get('/custos'),
      ]);

      const manutencoes = resMan.data.map(m => ({ ...m, _tipo: 'manutencao' }));
      const custos = resCustos.data.map(c => ({ ...c, _tipo: 'custo' }));

      const agora = new Date();
const todos = [...manutencoes, ...custos].sort((a, b) => {
  const dataA = new Date(a.created_at);
  const dataB = new Date(b.created_at);
  const aFuturo = dataA > agora;
  const bFuturo = dataB > agora;
  if (aFuturo && !bFuturo) return 1;
  if (!aFuturo && bFuturo) return -1;
  return dataB - dataA;
});

      setRegistros(todos);
    } catch { setRegistros([]); }
    finally { setCarregando(false); }
  };

  const resetForm = () => {
    setForm({
      numero_serie: '',
      tipo_servico: '',
      qtd_abastecida: '',
      observacao: '',
      nome_assinante: '',
      tecnico_responsavel: usuario?.nome || '',
      custo_tipo: '',
      custo_descricao: '',
      custo_valor: '',
      custo_observacoes: '',
    });
    setTemCusto(false);
  };

  const handleSubmit = async () => {
    if (!form.numero_serie || !form.tipo_servico) {
      alert('Máquina e Tipo de Serviço são obrigatórios.');
      return;
    }
    if (temCusto && (!form.custo_tipo || !form.custo_valor)) {
      alert('Tipo e valor do custo são obrigatórios.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/manutencoes', {
        numero_serie: form.numero_serie,
        tipo_servico: form.tipo_servico,
        qtd_abastecida: form.qtd_abastecida ? parseFloat(form.qtd_abastecida) : null,
        observacao: form.observacao,
        nome_assinante: form.nome_assinante,
        tecnico_responsavel: form.tecnico_responsavel,
      });

      if (temCusto) {
        await api.post('/custos', {
          numero_serie: form.numero_serie,
          data: new Date().toISOString().split('T')[0],
          tipo: form.custo_tipo,
          descricao: form.custo_descricao,
          valor: parseFloat(form.custo_valor),
          tecnico_responsavel: form.tecnico_responsavel,
          observacoes: form.custo_observacoes,
        });
      }

      alert('Registro salvo com sucesso!');
      setMostrarForm(false);
      resetForm();
      await carregarRegistros();
    } catch { alert('Erro ao salvar registro.'); }
    finally { setSalvando(false); }
  };

  const handleConfirmarCusto = async (id) => {
    if (!window.confirm('Confirmar este custo? Ele entrará nos relatórios financeiros.')) return;
    try {
      await api.patch(`/custos/${id}/confirmar`);
      await carregarRegistros();
    } catch { alert('Erro ao confirmar custo.'); }
  };

  const handleDeletarCusto = async (id) => {
    if (!window.confirm('Deseja remover este custo?')) return;
    try {
      await api.delete(`/custos/${id}`);
      await carregarRegistros();
    } catch { alert('Erro ao remover custo.'); }
  };

  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const icone = (item) => {
    if (item._tipo === 'custo') return '💰';
    if (item.tipo_servico === 'Abastecimento') return '💧';
    if (item.tipo_servico === 'Instalação') return '🏗️';
    if (item.tipo_servico === 'Retirada') return '📦';
    return '🔧';
  };

  const registrosFiltrados = registros.filter(r => {
    const serialOk = filtroSerial === '' || r.numero_serie === filtroSerial;
    const tipoOk = filtroTipo === '' ||
      (filtroTipo === 'custo' && r._tipo === 'custo') ||
      (filtroTipo !== 'custo' && r.tipo_servico === filtroTipo);
    return serialOk && tipoOk;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.titulo}>BlendPro</h1>
        <button style={styles.botaoVoltar} onClick={() => navigate('/dashboard')}>← Voltar</button>
      </div>
      <div style={styles.conteudo}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitulo}>Manutenções</h2>
          {podeManutencao && (
            <button style={styles.botaoNovo} onClick={() => { setMostrarForm(!mostrarForm); resetForm(); }}>
              {mostrarForm ? '✕ Fechar' : '+ Novo Registro'}
            </button>
          )}
        </div>

        {/* FORMULÁRIO */}
        {mostrarForm && podeManutencao && (
          <div style={styles.form}>
            <h3 style={styles.formTitulo}>Novo Registro</h3>

            <select style={styles.input} value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })}>
              <option value="">Selecionar Máquina *</option>
              {maquinas.map((m) => (<option key={m.id} value={m.numero_serie}>{m.numero_serie} — {m.nome_cliente || 'Sem cliente'}</option>))}
            </select>

            <select style={styles.input} value={form.tipo_servico} onChange={(e) => { setForm({ ...form, tipo_servico: e.target.value }); setTemCusto(false); }}>
              <option value="">Tipo de Serviço *</option>
              <option value="Instalação">🏗️ Instalação</option>
              <option value="Abastecimento">💧 Abastecimento</option>
              <option value="Manutenção">🔧 Manutenção</option>
              <option value="Retirada">📦 Retirada</option>
            </select>

            {form.tipo_servico === 'Abastecimento' && (
              <input style={styles.input} placeholder="Quantidade Abastecida (litros)" type="number" value={form.qtd_abastecida} onChange={(e) => setForm({ ...form, qtd_abastecida: e.target.value })} />
            )}

            <input style={styles.input} placeholder="Nome do Assinante" value={form.nome_assinante} onChange={(e) => setForm({ ...form, nome_assinante: e.target.value })} />

            <input style={styles.input} placeholder="Técnico Responsável" value={form.tecnico_responsavel} onChange={(e) => setForm({ ...form, tecnico_responsavel: e.target.value })} />

            <textarea style={styles.input} placeholder="Observações" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={2} />

            {/* CUSTO VINCULADO */}
            {(form.tipo_servico === 'Manutenção' || form.tipo_servico === 'Instalação') && (
              <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '16px', border: '1px solid #334155' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f1f5f9' }}>
                  <input type="checkbox" checked={temCusto} onChange={(e) => setTemCusto(e.target.checked)} />
                  <span>💰 Houve troca de peça ou custo adicional?</span>
                </label>

                {temCusto && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <select style={styles.input} value={form.custo_tipo} onChange={(e) => setForm({ ...form, custo_tipo: e.target.value })}>
                      <option value="">Tipo de Custo *</option>
                      <option value="Peça">Peça</option>
                      <option value="Mão de Obra">Mão de Obra</option>
                      <option value="Deslocamento">Deslocamento</option>
                      <option value="Gabinete">Gabinete</option>
                      <option value="Bomba">Bomba</option>
                      <option value="Válvula">Válvula</option>
                      <option value="Outro">Outro</option>
                    </select>
                    <input style={styles.input} placeholder="Descrição da peça/serviço" value={form.custo_descricao} onChange={(e) => setForm({ ...form, custo_descricao: e.target.value })} />
                    <input style={styles.input} placeholder="Valor provisório (R$) *" type="number" step="0.01" value={form.custo_valor} onChange={(e) => setForm({ ...form, custo_valor: e.target.value })} />
                    <textarea style={styles.input} placeholder="Observações do custo" value={form.custo_observacoes} onChange={(e) => setForm({ ...form, custo_observacoes: e.target.value })} rows={2} />
                    <p style={{ color: '#f59e0b', fontSize: '12px', margin: 0 }}>⚠️ Este custo ficará pendente de confirmação pelo operador interno.</p>
                  </div>
                )}
              </div>
            )}

            <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Registro'}
            </button>
          </div>
        )}

        {/* FILTROS */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <select style={styles.inputFiltro} value={filtroSerial} onChange={(e) => setFiltroSerial(e.target.value)}>
            <option value="">Todas as Máquinas</option>
            {maquinas.map((m) => (<option key={m.id} value={m.numero_serie}>{m.numero_serie}</option>))}
          </select>
          <select style={styles.inputFiltro} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos os Tipos</option>
            <option value="Instalação">🏗️ Instalação</option>
            <option value="Abastecimento">💧 Abastecimento</option>
            <option value="Manutenção">🔧 Manutenção</option>
            <option value="Retirada">📦 Retirada</option>
            <option value="custo">💰 Custo</option>
          </select>
        </div>

        {/* LISTA */}
        {carregando ? (
          <p style={styles.mensagem}>Carregando...</p>
        ) : registrosFiltrados.length === 0 ? (
          <p style={styles.mensagem}>Nenhum registro encontrado.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {registrosFiltrados.map((r) => (
              <div key={r.id} style={{
                backgroundColor: '#1e293b',
                borderRadius: '10px',
                padding: '14px 16px',
                borderLeft: `4px solid ${r._tipo === 'custo' ? (r.status === 'Confirmado' ? '#22c55e' : '#f59e0b') : '#38bdf8'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                      {icone(r)} {r.numero_serie} — {r._tipo === 'custo' ? `${r.tipo} (Custo)` : r.tipo_servico}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                      {formatarData(r.created_at || r.data)}
                      {(r.tecnico_nome || r.tecnico_responsavel) ? ` · ${r.tecnico_nome || r.tecnico_responsavel}` : ''}
                    </div>
                    {r._tipo === 'manutencao' && r.qtd_abastecida && (
                      <div style={{ fontSize: '13px', marginTop: '4px', color: '#38bdf8' }}>💧 {r.qtd_abastecida}L</div>
                    )}
                    {r._tipo === 'custo' && r.descricao && (
                      <div style={{ fontSize: '13px', marginTop: '4px' }}>{r.descricao}</div>
                    )}
                    {(r.observacao || r.observacoes) && (
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{r.observacao || r.observacoes}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {r._tipo === 'custo' && (
                      <>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: r.status === 'Confirmado' ? '#22c55e' : '#f59e0b' }}>{moeda(r.valor)}</div>
                        <div style={{ fontSize: '11px', color: r.status === 'Confirmado' ? '#22c55e' : '#f59e0b' }}>
                          {r.status === 'Confirmado' ? '✅ Confirmado' : '⏳ Pendente'}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Botões de ação para custos pendentes */}
                {r._tipo === 'custo' && r.status === 'Pendente' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {podeGerenciar && (
                      <button style={{ ...styles.botaoAcao, backgroundColor: '#22c55e' }} onClick={() => handleConfirmarCusto(r.id)}>✅ Confirmar</button>
                    )}
                    <button style={{ ...styles.botaoAcao, backgroundColor: '#ef4444' }} onClick={() => handleDeletarCusto(r.id)}>🗑️ Remover</button>
                  </div>
                )}
              </div>
            ))}
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
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  botaoNovo: { padding: '10px 20px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  form: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitulo: { color: '#38bdf8', margin: '0 0 8px 0' },
  input: { padding: '10px 14px', backgroundColor: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  botaoSalvar: { padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '8px' },
  inputFiltro: { padding: '10px 14px', backgroundColor: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', flex: 1, minWidth: '200px' },
  botaoAcao: { padding: '6px 14px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
};