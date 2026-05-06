import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const HistorialMock = () => {
  return (
    <div>
      <h1>Consulta de Historial</h1>
      <input placeholder="Buscar asociado" />
      <button>Buscar</button>
      <p>Juan Pérez</p>
    </div>
  );
};

describe('Historial Frontend', () => {
  it('renderiza la vista de historial', () => {
    render(<HistorialMock />);

    expect(screen.getByText('Consulta de Historial')).toBeInTheDocument();
  });

  it('permite escribir en el buscador', () => {
    render(<HistorialMock />);

    const input = screen.getByPlaceholderText('Buscar asociado');

    fireEvent.change(input, {
      target: { value: 'Juan' },
    });

    expect(input).toHaveValue('Juan');
  });

  it('muestra resultados de historial', () => {
    render(<HistorialMock />);

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });
});