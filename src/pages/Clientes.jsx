import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome_cliente: '',
    cnpj: '',
    codigo_erp: '',
    endereco: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    telefone: '',
    contato: '',
    email_cliente: '',
    observacoes: '',
  });

  const handleSubmit = async () => {
    if (!form.nome_cliente) {
      alert('O Nome do Cliente é obrigatório.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/clientes', form);
      alert('Cliente cadastrado com sucesso!');
      setMostrarForm(false);
      setForm({ nome_cliente: '', cnpj: '', codigo_erp: '', endereco: '', bairro: '', cidade: '', uf: '', cep: '', telefone: '', contato: '', email_cliente: '', observacoes: '' });
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch (erro) {
      alert('Erro ao cadastrar cliente. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    api.get('/clientes')
      .then((res) => setClientes(res.data))
      .catch(() => setClientes([]))
      .finally(() => setCarregando(false));
  }, []);

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
          <h2 style={styles.pageTitulo}>Clientes</h2>
          <button style={styles.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? '✕ Fechar' : '+ Novo Cliente'}
          </button>
        </div>

        {mostrarForm && (
          <div style={styles.form}>
            <h3 style={styles.formTitulo}>Novo Cliente</h3>
            <input style={styles.input} placeholder="Nome do Cliente *" value={form.nome_cliente} onChange={(e) => setForm({ ...form, nome_cliente: e.target.value })} />
            <input style={styles.input} placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            <input style={styles.input} placeholder="Código ERP" value={form.codigo_erp} onChange={(e) => setForm({ ...form, codigo_erp: e.target.value })} />
            <input style={styles.input} placeholder="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            <input style={styles.input} placeholder="Bairro" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
            <input style={styles.input} placeholder="Cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            <input style={styles.input} placeholder="UF (ex: SP)" maxLength={2} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} />
            <input style={styles.input} placeholder="CEP" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
            <input style={styles.input} placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            <input style={styles.input} placeholder="Nome do Contato" value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
            <input style={styles.input} placeholder="E-mail" value={form.email_cliente} onChange={(e) => setForm({ ...form, email_cliente: e.target.value })} />
            <textarea style={styles.input} placeholder="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
            <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        )}

        {carregando ? (
          <p style={styles.mensagem}>Carregando...</p>
        ) : clientes.length === 0 ? (
          <p style={styles.mensagem}>Nenhum cliente cadastrado.</p>
        ) : (
          <table style={styles.tabela}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>CNPJ</th>
                <th style={styles.th}>Cidade</th>
                <th style={styles.th}>Telefone</th>
                <th style={styles.th}>Máquinas</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} style={styles.tr}>
                  <td style={styles.td}>{c.nome_cliente}</td>
                  <td style={styles.td}>{c.cnpj || '—'}</td>
                  <td style={styles.td}>{c.cidade || '—'}</td>
                  <td style={styles.td}>{c.telefone || '—'}</td>
                  <td style={styles.td}>{c.total_maquinas || '0'}</td>
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