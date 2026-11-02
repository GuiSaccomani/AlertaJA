import React from 'react';
import { NivelRisco } from '../types';

interface RiskBadgeProps {
  nivel: NivelRisco;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ nivel, size = 'md' }) => {
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
        return 'ATENÇÃO';
      case 'ALERTA':
        return 'ALERTA';
      case 'PERIGO':
        return 'PERIGO';
      case 'NORMAL':
      default:
        return 'NORMAL';
    }
  };

  const extraStyles: React.CSSProperties = size === 'sm' 
    ? { fontSize: '0.68rem', padding: '0.15rem 0.45rem' } 
    : size === 'lg' 
    ? { fontSize: '0.85rem', padding: '0.35rem 0.85rem' } 
    : {};

  return (
    <span className={`risk-indicator ${getClasse()}`} style={extraStyles}>
      <span className="risk-dot" />
      {getRotulo()}
    </span>
  );
};
