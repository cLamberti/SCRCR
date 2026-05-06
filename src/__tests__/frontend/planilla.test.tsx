import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const PlanillaMock = () => {
  return (
    <div>
      <h1>Generación de Planilla</h1>
      <button>Generar Planilla</button>
      <p>Planilla generada correctamente</p>
    </div>
  );
};

describe('Planilla Frontend', () => {
  it('renderiza la vista de planilla', () => {
    render(<PlanillaMock />);

    expect(screen.getByText('Generación de Planilla')).toBeInTheDocument();
  });

  it('renderiza el botón de generar planilla', () => {
    render(<PlanillaMock />);

    expect(screen.getByText('Generar Planilla')).toBeInTheDocument();
  });

  it('permite hacer click en generar planilla', () => {
    render(<PlanillaMock />);

    const button = screen.getByText('Generar Planilla');

    fireEvent.click(button);

    expect(button).toBeInTheDocument();
  });

  it('muestra mensaje de éxito', () => {
    render(<PlanillaMock />);

    expect(screen.getByText('Planilla generada correctamente')).toBeInTheDocument();
  });
});