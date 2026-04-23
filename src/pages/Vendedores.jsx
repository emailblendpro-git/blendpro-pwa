import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';

export default function Vendedores() {
    const navigate = useNavigate();
    const { podeGerenciar } = useUsuario();
    const [vendedores, setVendedores] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [vendedorSelecionado, setVendedorSelecionado] = useState(null);
    const [editando, setEditando] = useState(false);
    const [form, setForm] = useState({ nome: '', carteira: '', email: '', telefone: '' });
    const [formEdicao, setFormEdicao] = useState({});

    useEffect(() => {
        api.get('/vendedores')
            .then((res) => setVendedores(res.data))
            .catch(() => setVendedores([]))
            .finally(() => setCarregando(false));
    }, []);

    const handleSubmit = async () => {
        if (!form.nome || !form.carteira) {
            alert('Preencha Nome e Carteira.');
            return;
        }
        setSalvando(true);
        try {
            await api.post('/vendedores', form);
            alert('Vendedor cadastrado com sucesso!');
            setMostrarForm(false);
            setForm({ nome: '', carteira: '', email: '', telefone: '' });
            const res = await api.get('/vendedores');
            setVendedores(res.data);
        } catch {
            alert('Erro ao cadastrar vendedor.');
        } finally {
            setSalvando(false);
        }
    };

    const handleSalvarEdicao = async () => {
        try {
            await api.patch(`/vendedores/${vendedorSelecionado.id}`, formEdicao);
            alert('Vendedor atualizado com sucesso!');
            setEditando(false);
            const res = await api.get('/vendedores');
            setVendedores(res.data);
            setVendedorSelecionado({ ...vendedorSelecionado, ...formEdicao });
        } catch {
            alert('Erro ao atualizar vendedor.');
        }
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
                    <h2 style={styles.pageTitulo}>Vendedores</h2>
                    {podeGerenciar && (
                        <button style={styles.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
                            {mostrarForm ? '✕ Fechar' : '+ Novo Vendedor'}
                        </button>
                    )}
                </div>

                {mostrarForm && podeGerenciar && (
                    <div style={styles.form}>
                        <h3 style={styles.formTitulo}>Novo Vendedor</h3>
                        <input style={styles.input} placeholder="Nome *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                        <input style={styles.input} placeholder="Carteira (ex: A, B, C) *" value={form.carteira} onChange={(e) => setForm({ ...form, carteira: e.target.value })} />
                        <input style={styles.input} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        <input style={styles.input} placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                        <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
                            {salvando ? 'Salvando...' : 'Salvar Vendedor'}
                        </button>
                    </div>
                )}

                {vendedorSelecionado && (
                    <div style={styles.painel}>
                        <div style={styles.painelHeader}>
                            <h3 style={styles.painelTitulo}>{vendedorSelecionado.nome}</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {podeGerenciar && (
                                    <button style={styles.botaoEditar} onClick={() => {
                                        setEditando(!editando);
                                        setFormEdicao(vendedorSelecionado);
                                    }}>
                                        {editando ? '✕ Cancelar' : '✏️ Editar'}
                                    </button>
                                )}
                                <button style={styles.botaoFechar} onClick={() => { setVendedorSelecionado(null); setEditando(false); }}>
                                    ✕ Fechar
                                </button>
                            </div>
                        </div>

                        {!editando ? (
                            <div style={styles.painelGrid}>
                                <div style={styles.painelCampo}><span style={styles.painelLabel}>Nome</span><span>{vendedorSelecionado.nome || '—'}</span></div>
                                <div style={styles.painelCampo}><span style={styles.painelLabel}>Carteira</span><span>{vendedorSelecionado.carteira || '—'}</span></div>
                                <div style={styles.painelCampo}><span style={styles.painelLabel}>Email</span><span>{vendedorSelecionado.email || '—'}</span></div>
                                <div style={styles.painelCampo}><span style={styles.painelLabel}>Telefone</span><span>{vendedorSelecionado.telefone || '—'}</span></div>
                                <div style={styles.painelCampo}><span style={styles.painelLabel}>Status</span><span>{vendedorSelecionado.ativo ? 'Ativo' : 'Inativo'}</span></div>
                            </div>
                        ) : (
                            <div style={styles.form}>
                                <input style={styles.input} placeholder="Nome *" value={formEdicao.nome || ''} onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })} />
                                <input style={styles.input} placeholder="Carteira *" value={formEdicao.carteira || ''} onChange={(e) => setFormEdicao({ ...formEdicao, carteira: e.target.value })} />
                                <input style={styles.input} placeholder="Email" value={formEdicao.email || ''} onChange={(e) => setFormEdicao({ ...formEdicao, email: e.target.value })} />
                                <input style={styles.input} placeholder="Telefone" value={formEdicao.telefone || ''} onChange={(e) => setFormEdicao({ ...formEdicao, telefone: e.target.value })} />
                                <select style={styles.input} value={formEdicao.ativo} onChange={(e) => setFormEdicao({ ...formEdicao, ativo: e.target.value === 'true' })}>
                                    <option value="true">Ativo</option>
                                    <option value="false">Inativo</option>
                                </select>
                                <button style={styles.botaoSalvar} onClick={handleSalvarEdicao}>
                                    Salvar Alterações
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {carregando ? (
                    <p style={styles.mensagem}>Carregando...</p>
                ) : vendedores.length === 0 ? (
                    <p style={styles.mensagem}>Nenhum vendedor cadastrado.</p>
                ) : (
                    <table style={styles.tabela}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Nome</th>
                                <th style={styles.th}>Carteira</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Telefone</th>
                                <th style={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendedores.map((v) => (
                                <tr key={v.id} style={{ ...styles.tr, cursor: 'pointer' }}
                                    onClick={() => { setVendedorSelecionado(v); setFormEdicao(v); setEditando(false); }}>
                                    <td style={styles.td}>{v.nome}</td>
                                    <td style={styles.td}>{v.carteira}</td>
                                    <td style={styles.td}>{v.email || '—'}</td>
                                    <td style={styles.td}>{v.telefone || '—'}</td>
                                    <td style={styles.td}>{v.ativo ? '✅ Ativo' : '❌ Inativo'}</td>
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
    painel: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '32px' },
    painelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    painelTitulo: { color: '#38bdf8', margin: 0 },
    painelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    painelCampo: { display: 'flex', flexDirection: 'column', gap: '4px' },
    painelLabel: { color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' },
    botaoEditar: { padding: '8px 16px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    botaoFechar: { padding: '8px 16px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
};