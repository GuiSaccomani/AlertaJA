import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="disclaimer-banner">
      <span className="disclaimer-tag">Ambiente Acadêmico</span>
      <AlertTriangle size={15} style={{ verticalAlign: 'middle' }} />
      <span>
        <strong>AVISO:</strong> Plataforma de demonstração com telemetria e leituras simuladas. Não representa alertas oficiais da Defesa Civil.
      </span>
    </div>
  );
};
