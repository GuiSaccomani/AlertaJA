import React from 'react';
import { NivelRisco } from '../types';

interface RiskBadgeProps {
  nivel: NivelRisco;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ nivel }) => {
  const getClasse = () => {
    switch (nivel) {
      case 'ATENCAO':
        return 'risk-atencao';
      case 'ALERTA':
        return 'risk-alerta';
      case 'PERIGO':
        return 'risk-perigo';
      case 'NORMAL':
      default:
        return 'risk-normal';
    }
  };

  const getRotulo = () => {
    switch (nivel) {
      case 'ATENCAO':
        return 'Atenção';
      case 'ALERTA':
        return 'Alerta';
      case 'PERIGO':
        return 'Perigo Crítico';
      case 'NORMAL':
      default:
        return 'Normal';
    }
  };

  return (
    <span className={`risk-badge ${getClasse()}`}>
      <span className="risk-dot" />
      {getRotulo()}
    </span>
  );
};
