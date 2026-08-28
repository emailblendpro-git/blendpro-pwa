import { Fragment, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Quantas colunas de dia de abastecimento aparecem em cada linha
const COLUNAS_ABASTECIMENTO = ['1º', '2º', '3º', '4º', '5º'];

export default function FolhaAbastecimento() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState('');

    const operadorParam = searchParams.get('operador');
    const mesParam = parseInt(searchParams.get('mes'), 10);
    const anoParam = parseInt(searchParams.get('ano'), 10);

    const mesInicial = Number.isInteger(mesParam) && mesParam >= 1 && mesParam <= 12
        ? MESES[mesParam - 1]
        : MESES[new Date().getMonth()];
    const anoInicial = Number.isInteger(anoParam) ? anoParam : new Date().getFullYear();

    useEffect(() => {
        api.get('/maquinas/folha-abastecimento', {
            params: operadorParam ? { operador: operadorParam } : {},
        })
            .then((res) => setDados(res.data))
            .catch((e) => setErro(e.response?.data?.erro || 'Erro ao carregar a folha.'));
    }, [operadorParam]);

    if (erro) {
        return (
            <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: '#c0392b' }}>
                {erro} <button onClick={() => navigate('/maquinas')}>Voltar</button>
            </div>
        );
    }

    if (!dados) {
        return <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: '#64748b' }}>Gerando folha...</div>;
    }

    const { operador, maquinas } = dados;

    return (
        <>
            <style>{estilos}</style>

            <div className="toolbar">
                <span>
                    {maquinas.length} máquina{maquinas.length !== 1 ? 's' : ''} · o mês e o ano no título são editáveis antes de imprimir
                </span>
                <button className="print-btn" onClick={() => window.print()}>Imprimir</button>
            </div>

            <div className="folha">
                <header className="cabecalho">
                    <h1 className="titulo">
                        Controle de Abastecimento do mês de{' '}
                        <span className="editavel" contentEditable suppressContentEditableWarning spellCheck={false}>
                            {mesInicial}
                        </span>{' '}
                        /{' '}
                        <span className="editavel" contentEditable suppressContentEditableWarning spellCheck={false}>
                            {anoInicial}
                        </span>
                    </h1>
                    <div className="operador">
                        <span className="operador-label">Operador responsável</span>
                        <span className="operador-nome">{operador.nome}</span>
                    </div>
                </header>

                {maquinas.length === 0 ? (
                    <p className="vazio">Nenhuma máquina vinculada a este operador.</p>
                ) : (
                    <table className="grade">
                        <thead>
                            <tr>
                                <th className="col-num">#</th>
                                <th className="col-serie">Nº de Série</th>
                                <th className="col-cliente">Cliente / Local</th>
                                {COLUNAS_ABASTECIMENTO.map((c) => (
                                    <Fragment key={c}>
                                        <th className="col-gap" />
                                        <th className="col-dia">{c}</th>
                                    </Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {maquinas.map((m, i) => (
                                <tr key={m.numero_serie}>
                                    <td className="col-num">{i + 1}</td>
                                    <td className="col-serie">{m.numero_serie}</td>
                                    <td className="col-cliente">{m.nome_cliente || '—'}</td>
                                    {COLUNAS_ABASTECIMENTO.map((c) => (
                                        <Fragment key={c}>
                                            <td className="col-gap" />
                                            <td className="col-dia" />
                                        </Fragment>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <p className="legenda">
                    Anote em cada quadrado o <strong>dia</strong> em que a máquina foi abastecida.
                </p>
            </div>
        </>
    );
}

const estilos = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }

  body {
    background: #e7e9ec;
    color: #101215;
    font-family: Arial, Helvetica, sans-serif;
    padding: 32px 16px 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .toolbar {
    width: 210mm;
    max-width: 794px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #2f333a;
    font-size: 12.5px;
    position: sticky;
    top: 0;
  }

  .print-btn {
    border: 1px solid #82878f;
    background: #fff;
    color: #2f333a;
    font: inherit;
    font-size: 12px;
    padding: 6px 14px;
    border-radius: 4px;
    cursor: pointer;
  }
  .print-btn:hover { border-color: #17475e; color: #17475e; }

  .folha {
    width: 210mm;
    max-width: 794px;
    min-height: 297mm;
    background: #fdfdfb;
    border: 1px solid #d8d6ce;
    box-shadow: 0 1px 2px rgba(0,0,0,0.08), 0 18px 40px -12px rgba(0,0,0,0.35);
    padding: 14mm 14mm 12mm;
    display: flex;
    flex-direction: column;
  }

  .cabecalho {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    border-bottom: 2px solid #17475e;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }

  .titulo {
    font-size: 16px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: #101215;
    margin: 0;
    line-height: 1.35;
  }

  .editavel {
    display: inline-block;
    min-width: 2ch;
    padding: 0 4px;
    border-bottom: 1.5px dashed #82878f;
    outline: none;
  }
  .editavel:focus { border-bottom-color: #17475e; background: #eef4f7; }

  .operador {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    white-space: nowrap;
  }
  .operador-label {
    font-size: 8.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #5c6068;
  }
  .operador-nome {
    font-size: 15px;
    font-weight: 800;
    color: #17475e;
  }

  .grade {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
  }
  .grade thead { display: table-header-group; }
  .grade tr { page-break-inside: avoid; }

  /* Bloco de identificação (células contíguas) */
  .col-num, .col-serie, .col-cliente {
    border: 1px solid #82878f;
    border-right: none;
    padding: 0 6px;
    height: 12mm;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .col-cliente { border-right: 1px solid #82878f; }
  tbody tr + tr .col-num,
  tbody tr + tr .col-serie,
  tbody tr + tr .col-cliente { border-top: none; }

  thead th {
    background: #e4edf1;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #17475e;
    height: 20px;
    text-align: center;
  }
  thead .col-num, thead .col-serie, thead .col-cliente { height: 20px; }

  .col-num { width: 8mm; text-align: center; color: #5c6068; }
  .col-serie { width: 32mm; font-weight: 700; }
  .col-cliente { width: auto; }

  /* Espaçador entre / antes das células das semanas */
  .col-gap { width: 3mm; border: none; background: transparent; }

  /* Células das semanas — cada uma uma caixa separada */
  .col-dia {
    width: 15mm;
    height: 12mm;
    border: 1px solid #82878f;
    border-radius: 2px;
    background: #fbfcfd;
    text-align: center;
  }

  .legenda { font-size: 10.5px; color: #5c6068; margin: 8px 0 0; }
  .vazio { font-size: 13px; color: #c0392b; margin: 24px 0; }

  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none; }
    .folha {
      box-shadow: none;
      border: none;
      width: 210mm;
      max-width: none;
      min-height: auto;
      padding: 12mm 12mm 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .editavel { border-bottom-color: transparent; }
    @page { size: A4 portrait; margin: 0; }
  }
`;
