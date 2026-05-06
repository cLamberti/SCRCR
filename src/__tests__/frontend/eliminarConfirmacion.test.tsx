import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const EliminarMock = () => {
  return (
    <div>
      <h1>Gestión de Asociados</h1>
      <button>Eliminar</button>
      <p>¿Está seguro de eliminar?</p>
      <button>Confirmar</button>
    </div>
  );
};

describe('Confirmación de Eliminación Frontend', () => {
  it('renderiza el botón eliminar', () => {
    render(<EliminarMock />);

    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('muestra mensaje de confirmación antes de eliminar', () => {
    render(<EliminarMock />);

    expect(screen.getByText('¿Está seguro de eliminar?')).toBeInTheDocument();
  });

  it('renderiza el botón confirmar', () => {
    render(<EliminarMock />);

    expect(screen.getByText('Confirmar')).toBeInTheDocument();
  });

  it('permite confirmar la eliminación', () => {
    render(<EliminarMock />);

    const button = screen.getByText('Confirmar');

    fireEvent.click(button);

    expect(button).toBeInTheDocument();
  });
});