import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsuario } from '../hooks/useUsuario';
import { QRCodeSVG } from 'qrcode.react';

export default function Maquinas() {
    const navigate = useNavigate();
    const { podeGerenciar } = useUsuario();
    const [maquinas, setMaquinas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [maquinaSelecionada, setMaquinaSelecionada] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [editando, setEditando] = useState(false);
    const [formEdicao, setFormEdicao] = useState({});
    const [parametrosExistem, setParametrosExistem] = useState(false);
    const [operadorParaAdicionar, setOperadorParaAdicionar] = useState('');
    const [formParametros, setFormParametros] = useState({
        icms: '18.00',
        pis: '3.65',
        cofins: '2.88',
        logistico: '4.00',
        comissionado_1: '1.50',
        comissionado_2: '0.80',
        custo_operacional: '10.00',
        outros: '2.00',
    });
    const [form, setForm] = useState({
        numero_serie: '',
        modelo: '',
        status: '',
        data_aquisicao: '',
        custo_aquisicao: '',
        fornecedor: '',
        versao_firmware: '',
        notas_internas: '',
    });

    const calcularMargem = () => {
        const venda = parseFloat(String(formEdicao.valor_unitario_atual || '0').replace(',', '.')) || 0;
        const idProduto = formEdicao.id_produto || maquinaSelecionada?.id_produto;
        const produto = produtos.find(p => String(p.id) === String(idProduto));
        const custo = parseFloat(produto?.custo_base || 0);
        const totalPct = ['icms', 'pis', 'cofins', 'logistico', 'comissionado_1', 'comissionado_2', 'custo_operacional', 'outros']
            .reduce((acc, campo) => acc + (parseFloat(formParametros[campo] || 0)), 0);
        const deducoes = (venda * totalPct) / 100;
        const margem = venda - deducoes - custo;
        const margemPct = venda > 0 ? (margem / venda) * 100 : 0;
        return { margem, margemPct, venda, custo, deducoes };
    };

    const handleSubmit = async () => {
        if (!form.numero_serie || !form.modelo || !form.status) {
            alert('Preencha os campos obrigatórios: Número de Série, Modelo e Status.');
            return;
        }
        setSalvando(true);
        try {
            await api.post('/maquinas', {
                ...form,
                custo_aquisicao: form.custo_aquisicao
                    ? parseFloat(form.custo_aquisicao.replace(',', '.'))
                    : null,
            });
            alert('Máquina cadastrada com sucesso!');
            setMostrarForm(false);
            setForm({ numero_serie: '', modelo: '', status: '', data_aquisicao: '', custo_aquisicao: '', fornecedor: '', versao_firmware: '', notas_internas: '' });
            const res = await api.get('/maquinas');
            setMaquinas(res.data);
        } catch (erro) {
            alert('Erro ao cadastrar máquina. Tente novamente.');
        } finally {
            setSalvando(false);
        }
    };

    const carregarParametros = async (numero_serie) => {
        try {
            const res = await api.get(`/parametros/${numero_serie}`);
            setFormParametros({
                icms: res.data.icms,
                pis: res.data.pis,
                cofins: res.data.cofins,
                logistico: res.data.logistico,
                comissionado_1: res.data.comissionado_1,
                comissionado_2: res.data.comissionado_2,
                custo_operacional: res.data.custo_operacional,
                outros: res.data.outros,
            });
            setParametrosExistem(true);
        } catch {
            setParametrosExistem(false);
        }
    };

    const adicionarOperador = async () => {
        if (!operadorParaAdicionar) return;
        try {
            await api.post(`/maquinas/${maquinaSelecionada.numero_serie}/operadores`, {
                id_operador: operadorParaAdicionar
            });
            setOperadorParaAdicionar('');
            const res = await api.get(`/maquinas/${maquinaSelecionada.numero_serie}`);
            setMaquinaSelecionada(res.data);
        } catch {
            alert('Erro ao adicionar operador.');
        }
    };

    const removerOperador = async (id_operador) => {
        if (!confirm('Remover este operador?')) return;
        try {
            await api.delete(`/maquinas/${maquinaSelecionada.numero_serie}/operadores/${id_operador}`);
            const res = await api.get(`/maquinas/${maquinaSelecionada.numero_serie}`);
            setMaquinaSelecionada(res.data);
        } catch {
            alert('Erro ao remover operador.');
        }
    };

    const imprimirQRCode = () => {
        const url = `https://blendpro-pwa.vercel.app/abastecer/${maquinaSelecionada.numero_serie}`;
        const svgEl = document.getElementById('qrcode-svg');
        const svgHTML = svgEl ? svgEl.outerHTML : '';
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head><title>QR Code — ${maquinaSelecionada.numero_serie}</title></head>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#fff;font-family:Arial,sans-serif;">
                <div style="text-align:center;padding:32px;border:2px solid #e2e8f0;border-radius:16px;">
                    ${svgHTML}
                    <p style="font-size:16px;font-weight:bold;margin:12px 0 4px 0;color:#0f172a">${maquinaSelecionada.numero_serie}</p>
                    <p style="font-size:13px;color:#64748b;margin:0">${maquinaSelecionada.nome_cliente || ''}</p>
                    <p style="font-size:11px;color:#94a3b8;margin:8px 0 0 0">${url}</p>
                </div>
            </body>
            </html>
        `);
        win.document.close();
        win.print();
    };

    useEffect(() => {
        api.get('/maquinas')
            .then((res) => setMaquinas(res.data))
            .catch(() => setMaquinas([]))
            .finally(() => setCarregando(false));

        api.get('/clientes')
            .then((res) => setClientes(res.data))
            .catch(() => setClientes([]));

        api.get('/produtos')
            .then((res) => setProdutos(res.data))
            .catch(() => setProdutos([]));

        api.get('/usuarios')
            .then((res) => setUsuarios(res.data))
            .catch(() => setUsuarios([]));

        api.get('/vendedores')
            .then((res) => setVendedores(res.data))
            .catch(() => setVendedores([]));
    }, []);

    const formatarData = (data) => {
        if (!data) return '—';
        const apenas_data = data.substring(0, 10);
        return new Date(apenas_data + 'T12:00:00').toLocaleDateString('pt-BR');
    };

    const mostrarParametros = (maquina) =>
        maquina?.status === 'Ativa' && maquina?.id_cliente;

    const operadoresExternos = usuarios.filter(u => u.perfil === 'operador_externo');

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
                    <h2 style={styles.pageTitulo}>Máquinas</h2>
                    {podeGerenciar && (
                        <button style={styles.botaoNovo} onClick={() => setMostrarForm(!mostrarForm)}>
                            {mostrarForm ? '✕ Fechar' : '+ Nova Máquina'}
                        </button>
                    )}
                </div>

                {mostrarForm && podeGerenciar && (
                    <div style={styles.form}>
                        <h3 style={styles.formTitulo}>Nova Máquina</h3>
                        <input style={styles.input} placeholder="Número de Série *" value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} />
                        <select style={styles.input} value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })}>
                            <option value="">Modelo *</option>
                            <option value="BP-ONE">BlendPro ONE</option>
                            <option value="BP-CAPS">BlendPro Caps</option>
                        </select>
                        <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            <option value="">Status *</option>
                            <option value="Ativa">Ativa</option>
                            <option value="Em Estoque">Em Estoque</option>
                            <option value="Manutenção">Manutenção</option>
                            <option value="Bloqueada">Bloqueada</option>
                            <option value="Em Montagem">Em Montagem</option>
                            <option value="Em Teste">Em Teste</option>
                        </select>
                        <input style={styles.input} type="date" value={form.data_aquisicao} onChange={(e) => setForm({ ...form, data_aquisicao: e.target.value })} />
                        <input
                            style={styles.input}
                            placeholder="Custo de Aquisição (ex: 1.500,00)"
                            value={form.custo_aquisicao}
                            onChange={(e) => setForm({ ...form, custo_aquisicao: e.target.value })}
                            onBlur={(e) => {
                                const valor = parseFloat(e.target.value.replace(',', '.'));
                                if (!isNaN(valor)) setForm({ ...form, custo_aquisicao: valor.toFixed(2).replace('.', ',') });
                            }}
                        />
                        <input style={styles.input} placeholder="Fornecedor" value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
                        <input style={styles.input} placeholder="Versão do Firmware" value={form.versao_firmware} onChange={(e) => setForm({ ...form, versao_firmware: e.target.value })} />
                        <textarea style={styles.input} placeholder="Notas Internas" value={form.notas_internas} onChange={(e) => setForm({ ...form, notas_internas: e.target.value })} rows={3} />
                        <button style={styles.botaoSalvar} onClick={handleSubmit} disabled={salvando}>
                            {salvando ? 'Salvando...' : 'Salvar Máquina'}
                        </button>
                    </div>
                )}

                {maquinaSelecionada && (
                    <div style={styles.painel}>
                        <div style={styles.painelHeader}>
                            <h3 style={styles.painelTitulo}>{maquinaSelecionada.numero_serie}</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {podeGerenciar && (
                                    <button style={styles.botaoEditar} onClick={() => {
                                        if (!editando) carregarParametros(maquinaSelecionada.numero_serie);
                                        setEditando(!editando);
                                    }}>
                                        {editando ? '✕ Cancelar' : '✏️ Editar'}
                                    </button>
                                )}
                                <button style={styles.botaoFechar} onClick={() => setMaquinaSelecionada(null)}>
                                    ✕ Fechar
                                </button>
                            </div>
                        </div>

                        {!editando ? (
                            <div>
                                <div style={styles.painelGrid}>
                                    <div style={styles.painelCampo}><span style={styles.painelLabel}>Modelo</span><span>{maquinaSelecionada.modelo || '—'}</span></div>
                                    <div style={styles.painelCampo}><span style={styles.painelLabel}>Status</span><span>{maquinaSelecionada.status || '—'}</span></div>
                                    <div style={styles.painelCampo}><span style={styles.painelLabel}>Cliente</span><span>{maquinaSelecionada.nome_cliente || '—'}</span></div>
                                    <div style={styles.painelCampo}>
                                        <span style={styles.painelLabel}>Vendedor</span>
                                        <span>{maquinaSelecionada.nome_vendedor ? `${maquinaSelecionada.nome_vendedor} — Carteira ${maquinaSelecionada.carteira_vendedor}` : '—'}</span>
                                    </div>
                                    <div style={styles.painelCampo}><span style={styles.painelLabel}>Data de Aquisição</span><span>{formatarData(maquinaSelecionada.data_aquisicao)}</span></div>
                                    <div style={styles.painelCampo}><span style={styles.painelLabel}>Custo de Aquisição</span><span>{maquinaSelecionada.custo_aquisicao ? `R$ ${parseFloat(maquinaSelecionada.custo_aquisicao).toFixed(2).replace('.', ',')}` : '—'}</span></div>
                                    <div style={styles.painelCampo}><span style={styles.painelLabel}>Fornecedor</span><span>{maquinaSelecionada.fornecedor || '—'}</span></div>
                                    <div style={styles.painelCampo}><span style={styles.painelLabel}>Versão Firmware</span><span>{maquinaSelecionada.versao_firmware || '—'}</span></div>
                                    <div style={styles.painelCampo}><span style={styles.painelLabel}>Produto Utilizado</span><span>{maquinaSelecionada.nome_produto || '—'}</span></div>
                                    <div style={styles.painelCampo}>
                                        <span style={styles.painelLabel}>
                                            {maquinaSelecionada.modelo === 'BP-ONE' ? 'Valor por Litro Atual' : 'Valor por Unidade Atual'}
                                        </span>
                                        <span>{maquinaSelecionada.valor_unitario_atual ? `R$ ${parseFloat(maquinaSelecionada.valor_unitario_atual).toFixed(2).replace('.', ',')}` : '—'}</span>
                                    </div>
                                    <div style={styles.painelCampo}><span style={styles.painelLabel}>Notas Internas</span><span>{maquinaSelecionada.notas_internas || '—'}</span></div>
                                </div>

                                {podeGerenciar && (
                                    <div style={styles.secaoOperadores}>
                                        <h4 style={styles.secaoTitulo}>👷 Operadores Autorizados</h4>
                                        <div style={styles.operadoresList}>
                                            {(maquinaSelecionada.operadores_autorizados || []).length === 0 ? (
                                                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Nenhum operador autorizado.</p>
                                            ) : (
                                                (maquinaSelecionada.operadores_autorizados || []).map((op) => (
                                                    <div key={op.id} style={styles.operadorItem}>
                                                        <span>{op.nome} — {op.email}</span>
                                                        <button style={styles.botaoRemover} onClick={() => removerOperador(op.id)}>✕</button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                            <select style={{ ...styles.input, flex: 1 }} value={operadorParaAdicionar} onChange={(e) => setOperadorParaAdicionar(e.target.value)}>
                                                <option value="">Selecionar Operador Externo</option>
                                                {operadoresExternos
                                                    .filter(u => !(maquinaSelecionada.operadores_autorizados || []).some(op => op.id === u.id))
                                                    .map((u) => (
                                                        <option key={u.id} value={u.id}>{u.nome}</option>
                                                    ))}
                                            </select>
                                            <button style={styles.botaoAdicionar} onClick={adicionarOperador}>+ Adicionar</button>
                                        </div>
                                    </div>
                                )}

                                {podeGerenciar && (
                                    <div style={styles.secaoOperadores}>
                                        <h4 style={styles.secaoTitulo}>📱 QR Code de Abastecimento</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                            <div id="qrcode-svg">
                                                <QRCodeSVG
                                                    value={`https://blendpro-pwa.vercel.app/abastecer/${maquinaSelecionada.numero_serie}`}
                                                    size={180}
                                                    bgColor="#ffffff"
                                                    fgColor="#0f172a"
                                                />
                                            </div>
                                            <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                                                {maquinaSelecionada.numero_serie}
                                            </p>
                                            <button style={styles.botaoAdicionar} onClick={imprimirQRCode}>
                                                🖨️ Imprimir QR Code
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={styles.form}>
                                <select style={styles.input} value={formEdicao.modelo || ''} onChange={(e) => setFormEdicao({ ...formEdicao, modelo: e.target.value })}>
                                    <option value="">Modelo *</option>
                                    <option value="BP-ONE">BlendPro ONE</option>
                                    <option value="BP-CAPS">BlendPro Caps</option>
                                </select>
                                <select style={styles.input} value={formEdicao.status || ''} onChange={(e) => setFormEdicao({ ...formEdicao, status: e.target.value })}>
                                    <option value="">Status *</option>
                                    <option value="Ativa">Ativa</option>
                                    <option value="Em Estoque">Em Estoque</option>
                                    <option value="Manutenção">Manutenção</option>
                                    <option value="Bloqueada">Bloqueada</option>
                                    <option value="Em Montagem">Em Montagem</option>
                                    <option value="Em Teste">Em Teste</option>
                                </select>
                                <input style={styles.input} type="date" value={formEdicao.data_aquisicao ? formEdicao.data_aquisicao.substring(0, 10) : ''} onChange={(e) => setFormEdicao({ ...formEdicao, data_aquisicao: e.target.value })} />
                                <input style={styles.input} placeholder="Custo de Aquisição" value={formEdicao.custo_aquisicao || ''} onChange={(e) => setFormEdicao({ ...formEdicao, custo_aquisicao: e.target.value })} />
                                <select style={styles.input} value={formEdicao.id_cliente || ''} onChange={(e) => setFormEdicao({ ...formEdicao, id_cliente: e.target.value })}>
                                    <option value="">Vincular a um Cliente</option>
                                    {clientes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nome_cliente}</option>
                                    ))}
                                </select>
                                <select style={styles.input} value={formEdicao.id_vendedor || ''} onChange={(e) => setFormEdicao({ ...formEdicao, id_vendedor: e.target.value })}>
                                    <option value="">Vincular Vendedor Responsável</option>
                                    {vendedores.map((v) => (
                                        <option key={v.id} value={v.id}>{v.nome} — Carteira {v.carteira}</option>
                                    ))}
                                </select>
                                <select style={styles.input} value={formEdicao.id_produto || ''} onChange={(e) => setFormEdicao({ ...formEdicao, id_produto: e.target.value })}>
                                    <option value="">Vincular um Produto</option>
                                    {produtos.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nome} ({p.unidade})</option>
                                    ))}
                                </select>
                                <input
                                    style={styles.input}
                                    placeholder="Valor Unitário Atual (ex: 8,50)"
                                    value={formEdicao.valor_unitario_atual || ''}
                                    onChange={(e) => setFormEdicao({ ...formEdicao, valor_unitario_atual: e.target.value })}
                                    onBlur={(e) => {
                                        const valor = parseFloat(e.target.value.replace(',', '.'));
                                        if (!isNaN(valor)) setFormEdicao({ ...formEdicao, valor_unitario_atual: valor.toFixed(2).replace('.', ',') });
                                    }}
                                />
                                <input style={styles.input} placeholder="Fornecedor" value={formEdicao.fornecedor || ''} onChange={(e) => setFormEdicao({ ...formEdicao, fornecedor: e.target.value })} />
                                <input style={styles.input} placeholder="Versão do Firmware" value={formEdicao.versao_firmware || ''} onChange={(e) => setFormEdicao({ ...formEdicao, versao_firmware: e.target.value })} />
                                <textarea style={styles.input} placeholder="Notas Internas" value={formEdicao.notas_internas || ''} onChange={(e) => setFormEdicao({ ...formEdicao, notas_internas: e.target.value })} rows={3} />

                                {mostrarParametros(formEdicao) && (
                                    <div style={styles.secaoParametros}>
                                        <h4 style={styles.secaoTitulo}>💰 Parâmetros Financeiros</h4>
                                        <p style={styles.secaoDesc}>Valores em % sobre o preço de venda</p>
                                        {[
                                            { campo: 'icms', label: 'ICMS' },
                                            { campo: 'pis', label: 'PIS' },
                                            { campo: 'cofins', label: 'COFINS' },
                                            { campo: 'logistico', label: 'Logístico' },
                                            { campo: 'comissionado_1', label: 'Comissionado 1' },
                                            { campo: 'comissionado_2', label: 'Comissionado 2' },
                                            { campo: 'custo_operacional', label: 'Custo Operacional' },
                                            { campo: 'outros', label: 'Outros' },
                                        ].map(({ campo, label }) => (
                                            <div key={campo} style={styles.campoParametro}>
                                                <label style={styles.painelLabel}>{label} (%)</label>
                                                <input
                                                    style={styles.input}
                                                    type="number"
                                                    step="0.01"
                                                    value={formParametros[campo]}
                                                    onChange={(e) => setFormParametros({ ...formParametros, [campo]: e.target.value })}
                                                />
                                            </div>
                                        ))}
                                        {(() => {
                                            const { margem, margemPct, venda, custo, deducoes } = calcularMargem();
                                            return (
                                                <div style={styles.resumoMargem}>
                                                    <h5 style={styles.resumoTitulo}>📊 Resumo da Margem</h5>
                                                    <div style={styles.resumoLinha}><span>Valor de Venda</span><span>R$ {venda.toFixed(2).replace('.', ',')}</span></div>
                                                    <div style={styles.resumoLinha}><span>Custo do Produto</span><span>- R$ {custo.toFixed(2).replace('.', ',')}</span></div>
                                                    <div style={styles.resumoLinha}><span>Total Deduções</span><span>- R$ {deducoes.toFixed(2).replace('.', ',')}</span></div>
                                                    <div style={{ ...styles.resumoLinha, ...styles.resumoDestaque }}>
                                                        <span>Margem</span>
                                                        <span style={{ color: margem >= 0 ? '#22c55e' : '#ef4444' }}>
                                                            R$ {margem.toFixed(2).replace('.', ',')} ({margemPct.toFixed(2)}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                <button style={styles.botaoSalvar} onClick={async () => {
                                    try {
                                        await api.patch(`/maquinas/${maquinaSelecionada.numero_serie}`, {
                                            ...formEdicao,
                                            custo_aquisicao: formEdicao.custo_aquisicao ? parseFloat(String(formEdicao.custo_aquisicao).replace(',', '.')) : null,
                                            valor_unitario_atual: formEdicao.valor_unitario_atual ? parseFloat(String(formEdicao.valor_unitario_atual).replace(',', '.')) : null,
                                        });
                                        if (mostrarParametros(formEdicao)) {
                                            const payload = {
                                                icms: parseFloat(formParametros.icms),
                                                pis: parseFloat(formParametros.pis),
                                                cofins: parseFloat(formParametros.cofins),
                                                logistico: parseFloat(formParametros.logistico),
                                                comissionado_1: parseFloat(formParametros.comissionado_1),
                                                comissionado_2: parseFloat(formParametros.comissionado_2),
                                                custo_operacional: parseFloat(formParametros.custo_operacional),
                                                outros: parseFloat(formParametros.outros),
                                            };
                                            if (parametrosExistem) {
                                                await api.patch(`/parametros/${maquinaSelecionada.numero_serie}`, payload);
                                            } else {
                                                await api.post(`/parametros/${maquinaSelecionada.numero_serie}`, payload);
                                            }
                                        }
                                        alert('Máquina atualizada com sucesso!');
                                        setEditando(false);
                                        const resMaquina = await api.get(`/maquinas/${maquinaSelecionada.numero_serie}`);
                                        setMaquinaSelecionada(resMaquina.data);
                                        const res = await api.get('/maquinas');
                                        setMaquinas(res.data);
                                    } catch {
                                        alert('Erro ao atualizar máquina.');
                                    }
                                }}>
                                    Salvar Alterações
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {carregando ? (
                    <p style={styles.mensagem}>Carregando...</p>
                ) : maquinas.length === 0 ? (
                    <p style={styles.mensagem}>Nenhuma máquina cadastrada.</p>
                ) : (
                    <table style={styles.tabela}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Serial</th>
                                <th style={styles.th}>Modelo</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Cliente</th>
                                <th style={styles.th}>Vendedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {maquinas.map((m) => (
                                <tr key={m.id} style={{ ...styles.tr, cursor: 'pointer' }} onClick={async () => {
                                    const res = await api.get(`/maquinas/${m.numero_serie}`);
                                    setMaquinaSelecionada(res.data);
                                    setFormEdicao(res.data);
                                    setEditando(false);
                                    carregarParametros(m.numero_serie);
                                }}>
                                    <td style={styles.td}>{m.numero_serie}</td>
                                    <td style={styles.td}>{m.modelo}</td>
                                    <td style={styles.td}>{m.status}</td>
                                    <td style={styles.td}>{m.nome_cliente || '—'}</td>
                                    <td style={styles.td}>{m.nome_vendedor ? `${m.nome_vendedor} (${m.carteira_vendedor})` : '—'}</td>
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
    secaoParametros: { backgroundColor: '#0f172a', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid #334155' },
    secaoTitulo: { color: '#38bdf8', margin: '0 0 8px 0', fontSize: '15px' },
    secaoDesc: { color: '#94a3b8', fontSize: '12px', margin: '0 0 8px 0' },
    campoParametro: { display: 'flex', flexDirection: 'column', gap: '4px' },
    resumoMargem: { backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #334155' },
    resumoTitulo: { color: '#f1f5f9', margin: '0 0 8px 0', fontSize: '14px' },
    resumoLinha: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#cbd5e1' },
    resumoDestaque: { borderTop: '1px solid #334155', paddingTop: '8px', fontWeight: 'bold', color: '#f1f5f9' },
    secaoOperadores: { backgroundColor: '#0f172a', borderRadius: '10px', padding: '20px', marginTop: '20px', border: '1px solid #334155' },
    operadoresList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' },
    operadorItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '8px 12px', borderRadius: '8px', fontSize: '14px' },
    botaoRemover: { padding: '4px 10px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    botaoAdicionar: { padding: '10px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' },
};
