import React from 'react';
import { AlertCircle, Radio } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <aside className="ccom-banner" role="complementary" aria-label="Aviso Legal de Simulação">
      <div className="ccom-banner-left">
        <span className="ccom-tag-amber">PROTOCOLO SIMULADO</span>
        <AlertCircle size={13} style={{ color: '#facc15' }} />
        <span>
          <strong>AMBIENTE DE SIMULAÇÃO EDUCATIVA | DADOS FICTÍCIOS | NÃO UTILIZAR COMO DEFESA CIVIL OFICIAL</strong>
        </span>
      </div>
      <div className="ccom-banner-right">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <Radio size={12} style={{ color: 'var(--cyan-telemetry)' }} />
          CANAL DE TELEMETRIA IoT ATIVO
        </span>
      </div>
    </aside>
  );
};
