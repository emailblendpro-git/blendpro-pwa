import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Via, estilos } from './comprovante/ComprovanteShared';

export default function ComprovanteAbastecimento() {
    const { serial } = useParams();
    const navigate = useNavigate();
    const [maquina, setMaquina] = useState(null);
    const [comprovante, setComprovante] = useState(null);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get(`/maquinas/${serial}`)
            .then((res) => setMaquina(res.data))
            .catch(() => setErro('Não foi possível carregar os dados desta máquina.'));

        api.post('/comprovantes/abastecimento', { numero_serie: serial })
            .then((res) => setComprovante(res.data))
            .catch(() => setErro('Não foi possível gerar o número do comprovante.'));
    }, [serial]);

    if (erro) {
        return (
            <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: '#ef4444' }}>
                {erro} <button onClick={() => navigate('/maquinas')}>Voltar</button>
            </div>
        );
    }

    if (!maquina || !comprovante) {
        return <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', color: '#64748b' }}>Carregando comprovante...</div>;
    }

    return (
        <>
            <style>{estilos}</style>
            <div className="toolbar">
                <span>Comprovante Nº {String(comprovante.numero).padStart(6, '0')} · {maquina.numero_serie} · 2 vias, uma por folha</span>
                <button className="print-btn" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
            </div>
            <div className="sheets">
                <div className="sheet">
                    <Via tag="1ª via — local / cliente" maquina={maquina} numero={comprovante.numero} geradoEm={comprovante.gerado_em} />
                </div>
                <div className="sheet">
                    <Via tag="2ª via — Alquimis" maquina={maquina} numero={comprovante.numero} geradoEm={comprovante.gerado_em} />
                </div>
            </div>
        </>
    );
}
