import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

export default function Manutencoes() {
  const navigate = useNavigate();
  const { podeManutencao } = useUsuario();
  const [manutencoes, setManutencoes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    numero_serie: '',
    tipo_servico: '',
    qtd_abastecida: '',
    observacao: '',
    nome_assinante: '',
  });

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
    } catch (erro) {
      alert('Erro ao salvar registro. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    api.get('/manutencoes')
      .then((res) => setManutencoes(res.data))
      .catch(() => setManutencoes([]))
      .finally(() => setCarregando(false));

    api.get('/maquinas')
      .then((res) => setMaquinas(res.data))
      .catch(() => setMaquinas([]));
  }, []);

  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleString('pt-BR');
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
        <div style={styles.topBar}>
          <h2 style={styles.pageTitulo}>Manutenções</h2>
          {podeManutencao && (
            <button style={styles.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? '✕ Fechar' : '+ Novo Registro'}
            </button>
          )}
        </div>

        {mostrarForm && podeManutencao && (
          <div style={styles.form}>
            <h3 style={styles.formTitulo}>Novo Registro</h3>
            <select style={styles.input} value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })}>
              <option value="">Selecionar Máquina *</option>
              {maquinas.map((m) => (
                <option key={m.id} value={m.numero_serie}>
                  {m.numero_serie} — {m.nome_cliente || 'Sem cliente'}
                </option>
              ))}
            </select>
            <select style={styles.input} value={form.tipo_servico} onChange={(e) => setForm({ ...form, tipo_servico: e.target.value })}>
              <option value="">Tipo de Serviço *</option>
              <option value="Instalação">Instalação</option>
              <option value="Abastecimento">Abastecimento</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Retirada">Retirada</option>
            </select>
            {form.tipo_servico === 'Abastecimento' && (
              <input
                style={styles.input}
                placeholder="Quantidade Abastecida (litros)"
                type="number"
                value={form.qtd_abastecida}
                onChange={(e) => setForm({ ...form, qtd_abastecida: e.target.value })}
              />
            )}
            <input style={styles.input} placeholder="Nome do Assinante" value={form.nome_assinante} onChange={(e) => setForm({ ...form, nome_assinante: e.target.value })} />
            <textarea style={styles.input} placeholder="Observações" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} rows={3} />
            <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Registro'}
            </button>
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
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  botaoNovo: { padding: '10px 20px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  form: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitulo: { color: '#38bdf8', margin: '0 0 8px 0' },
  input: { padding: '10px 14px', backgroundColor: '#0f172a', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  botaoSalvar: { padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '8px' },
};