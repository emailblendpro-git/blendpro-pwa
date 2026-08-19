export const formatarEndereco = (m) => {
    const partes = [m.endereco, m.bairro, m.cidade && m.uf ? `${m.cidade}/${m.uf}` : (m.cidade || m.uf)]
        .filter(Boolean);
    return partes.length ? partes.join(' — ') : '—';
};

export const formatarEmissao = (isoString) => {
    const agora = new Date(isoString);
    const data = agora.toLocaleDateString('pt-BR');
    const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${data} às ${hora}`;
};

export function Via({ tag, maquina, numero, geradoEm }) {
    const operadores = maquina.operadores_autorizados || [];
    return (
        <div className="via">
            <span className="via-tag">{tag}</span>
            <div className="head">
                <div className="brand">
                    <div className="mark">Blend<span>Pro</span></div>
                    <div className="sub">Alquimis Química Industrial · Sistema de Gestão de Diluição</div>
                </div>
                <div className="doc-meta">
                    <div className="title">Comprovante de Abastecimento</div>
                    <div className="num">Nº {String(numero).padStart(6, '0')} &nbsp;·&nbsp; Emitido em {formatarEmissao(geradoEm)}</div>
                </div>
            </div>

            <div className="section">
                <div className="section-label">Dados da Máquina</div>
                <div className="grid cols-2">
                    <div className="field">
                        <div className="k">Número de Série</div>
                        <div className="v">{maquina.numero_serie}</div>
                    </div>
                    <div className="field">
                        <div className="k">Modelo</div>
                        <div className="v">{maquina.modelo || '—'}</div>
                    </div>
                </div>
            </div>

            <div className="section">
                <div className="section-label">Dados do Cliente</div>
                <div className="grid cols-3">
                    <div className="field span-2">
                        <div className="k">Razão Social</div>
                        <div className="v">{maquina.nome_cliente || '—'}</div>
                    </div>
                    <div className="field">
                        <div className="k">CNPJ</div>
                        <div className="v">{maquina.cnpj || '—'}</div>
                    </div>
                    <div className="field span-2">
                        <div className="k">Endereço</div>
                        <div className="v">{formatarEndereco(maquina)}</div>
                    </div>
                    <div className="field">
                        <div className="k">CEP</div>
                        <div className="v">{maquina.cep || '—'}</div>
                    </div>
                </div>
            </div>

            <div className="section">
                <div className="section-label">
                    {operadores.length > 1 ? 'Operadores Responsáveis (cadastrados na máquina)' : 'Operador Responsável (cadastrado na máquina)'}
                </div>
                <div className="operador-box">
                    <div>
                        <div className="role">Operador{operadores.length > 1 ? 'es' : ''} externo{operadores.length > 1 ? 's' : ''} autorizado{operadores.length > 1 ? 's' : ''}</div>
                        {operadores.length === 0 ? (
                            <div className="name" style={{ color: 'var(--ink-faint)', fontSize: '11px' }}>Nenhum operador vinculado</div>
                        ) : (
                            operadores.map((op) => <div className="name" key={op.id}>{op.nome}</div>)
                        )}
                    </div>
                    {operadores.length > 0 && <div className="badge">Vinculado à máquina</div>}
                </div>
            </div>

            <div className="section">
                <div className="section-label">Registro do Abastecimento</div>
                <div className="grid cols-4">
                    <div className="field">
                        <div className="k">Data</div>
                        <div className="v blank">&nbsp;</div>
                    </div>
                    <div className="field">
                        <div className="k">Horário</div>
                        <div className="v blank">&nbsp;</div>
                    </div>
                    <div className="field span-2">
                        <div className="k">Nome do atendente que acompanhou</div>
                        <div className="v blank">&nbsp;</div>
                    </div>
                </div>
                <div className="grid cols-3">
                    <div className="field">
                        <div className="k">Quantidade abastecida (L)</div>
                        <div className="v blank">&nbsp;</div>
                    </div>
                    <div className="field span-2">
                        <div className="k">Observações</div>
                        <div className="v blank">&nbsp;</div>
                    </div>
                </div>
            </div>

            <div className="sig-row">
                <div className="sig-box">
                    <div className="cap">Assinatura do atendente</div>
                    <div className="sig-line"></div>
                    <div className="name-hint">Nome legível: ___________________________</div>
                </div>
                <div className="sig-box">
                    <div className="cap">Carimbo do cliente</div>
                    <div className="stamp-area">espaço reservado para carimbo</div>
                </div>
            </div>

            <div className="footer">
                <span>BlendPro · Alquimis Química Industrial Ltda</span>
                <span>Documento gerado eletronicamente — válido como comprovante de visita técnica</span>
            </div>
        </div>
    );
}

export const estilos = `
  :root {
    --canvas: #e7e9ec;
    --canvas-grain: #dde0e4;
    --paper: #fdfdfb;
    --paper-edge: #d8d6ce;
    --ink: #101215;
    --ink-soft: #2f333a;
    --ink-faint: #5c6068;
    --rule: #b6bac1;
    --rule-strong: #82878f;
    --accent: #17475e;
    --accent-soft: #e4edf1;
    --field-bg: #f6f7f4;
    --stamp-border: #b6bcc2;
  }

  * { box-sizing: border-box; }

  html, body { margin: 0; padding: 0; }

  body {
    background: radial-gradient(ellipse at top, var(--canvas-grain), var(--canvas));
    color: var(--ink);
    font-family: Arial, Helvetica, sans-serif;
    padding: 40px 16px 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
  }

  .toolbar {
    width: 100%;
    max-width: 794px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--ink-soft);
    font-size: 12.5px;
    position: sticky;
    top: 0;
  }

  .print-btn {
    border: 1px solid var(--rule-strong);
    background: transparent;
    color: var(--ink-soft);
    font: inherit;
    font-size: 12px;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
  }
  .print-btn:hover { border-color: var(--accent); color: var(--accent); }

  .sheet {
    width: 210mm;
    max-width: 794px;
    min-height: 297mm;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 18px 40px -12px rgba(0,0,0,0.35);
    border: 1px solid var(--paper-edge);
    padding: 2mm 12mm 1mm;
    display: flex;
    flex-direction: column;
    font-size: 12.6px;
    line-height: 1.4;
  }

  .via { display: flex; flex-direction: column; gap: 2.2mm; }

  .cut-line {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-soft);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0.5mm 0;
  }
  .cut-line::before, .cut-line::after {
    content: "";
    flex: 1;
    border-top: 1.5px dashed var(--rule-strong);
  }

  .via-tag {
    align-self: flex-start;
    background: var(--accent);
    color: var(--paper);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 3px;
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 2px solid var(--accent);
    padding-bottom: 3px;
  }
  .brand { display: flex; flex-direction: column; gap: 1px; }
  .brand .mark { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; color: var(--accent); }
  .brand .mark span { color: var(--ink); font-weight: 800; }
  .brand .sub { font-size: 9.5px; color: var(--ink-faint); }
  .doc-meta { text-align: right; }
  .doc-meta .title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink); }
  .doc-meta .num { font-size: 10px; color: var(--ink-soft); font-variant-numeric: tabular-nums; margin-top: 1px; }

  .section { display: flex; flex-direction: column; gap: 3px; }
  .section-label {
    font-size: 9.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .section-label::after { content: ""; flex: 1; height: 1px; background: var(--rule); }

  .grid { display: grid; gap: 5px 10px; }
  .grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
  .grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
  .grid.cols-4 { grid-template-columns: repeat(4, 1fr); }

  .field { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .field .k { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint); font-weight: 800; }
  .field .v {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--ink);
    padding: 4px 7px;
    background: var(--field-bg);
    border: 1px solid var(--rule);
    border-radius: 3px;
    min-height: 12px;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .field.span-2 { grid-column: span 2; }
  .field.span-3 { grid-column: span 3; }

  .field .v.blank {
    background: transparent;
    border: none;
    border-bottom: 1.5px solid var(--ink-soft);
    border-radius: 0;
    min-height: 16px;
    padding: 4px 2px;
  }

  .operador-box {
    border: 1px solid var(--rule);
    background: var(--accent-soft);
    border-radius: 4px;
    padding: 4px 9px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  .operador-box .name { font-size: 14px; font-weight: 800; color: var(--accent); }
  .operador-box .role { font-size: 8.5px; color: var(--ink-soft); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .operador-box .badge {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #1f6a3f;
    background: #e3f2e8;
    border: 1px solid #bfe0cb;
    padding: 3px 8px;
    border-radius: 20px;
    white-space: nowrap;
  }

  .sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .sig-box {
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 5px 9px 5px;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .sig-box .cap { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint); font-weight: 800; }
  .sig-line { border-bottom: 1.5px solid var(--ink-soft); height: 15px; }
  .sig-box .name-hint { font-size: 9px; color: var(--ink-soft); font-weight: 600; }

  .stamp-area {
    border: 1.5px dashed var(--stamp-border);
    border-radius: 4px;
    min-height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink-soft);
    font-size: 8px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    color: var(--ink-faint);
    font-size: 7.5px;
    font-weight: 600;
    padding-top: 2px;
    border-top: 1px solid var(--rule);
  }

  .sheets { display: flex; flex-direction: column; gap: 24px; align-items: center; }

  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none; }
    .sheets { gap: 0; }
    .sheet {
      box-shadow: none;
      border: none;
      width: 192mm;
      max-width: none;
      min-height: auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet:not(:last-child) {
      break-after: page;
      page-break-after: always;
    }
    @page { size: A4; margin: 5mm 9mm; }
  }
`;
