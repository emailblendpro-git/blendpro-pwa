import { Fragment, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Via, estilos } from './comprovante/ComprovanteShared';

export default function ComprovantesLote() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [itens, setItens] = useState(null);
    const [falhas, setFalhas] = useState([]);

    const seriais = (searchParams.get('seriais') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    useEffect(() => {
        if (seriais.length === 0) {
            setItens([]);
            return;
        }

        Promise.allSettled(
            seriais.map((serial) =>
                Promise.all([
                    api.get(`/maquinas/${serial}`),
                    api.post('/comprovantes/abastecimento', { numero_serie: serial }),
                ]).then(([maquinaRes, comprovanteRes]) => ({
                    maquina: maquinaRes.data,
                    comprovante: comprovanteRes.data,
                }))
            )
        ).then((resultados) => {
            const ok = [];
            const erros = [];
            resultados.forEach((r, i) => {
                if (r.status === 'fulfilled') ok.push(r.value);
                else erros.push(seriais[i]);
            });
            setItens(ok);
            setFalhas(erros);
        });
    }, [searchParams]);

    if (seriais.length === 0) {
        return (
            <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: '#ef4444' }}>
                Nenhuma máquina selecionada. <button onClick={() => navigate('/maquinas')}>Voltar</button>
            </div>
        );
    }

    if (!itens) {
        return <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: '#64748b' }}>Gerando {seriais.length} comprovante{seriais.length > 1 ? 's' : ''}...</div>;
    }

    return (
        <>
            <style>{estilos}</style>
            <div className="toolbar">
                <span>
                    {itens.length} comprovante{itens.length !== 1 ? 's' : ''} · 2 vias por máquina, uma por folha ({itens.length * 2} páginas)
                    {falhas.length > 0 && (
                        <span style={{ color: '#c0392b' }}> · falhou pra: {falhas.join(', ')}</span>
                    )}
                </span>
                <button className="print-btn" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
            </div>
            <div className="sheets">
                {itens.map(({ maquina, comprovante }) => (
                    <Fragment key={maquina.numero_serie}>
                        <div className="sheet">
                            <Via tag="1ª via — local / cliente" maquina={maquina} numero={comprovante.numero} geradoEm={comprovante.gerado_em} />
                        </div>
                        <div className="sheet">
                            <Via tag="2ª via — Alquimis" maquina={maquina} numero={comprovante.numero} geradoEm={comprovante.gerado_em} />
                        </div>
                    </Fragment>
                ))}
            </div>
        </>
    );
}
