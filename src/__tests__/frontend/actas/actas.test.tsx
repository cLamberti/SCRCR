import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ActasPage from "@/app/actas/page";
import { vi, describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/SideBar", () => ({
  default: () =>
    React.createElement("div", { "data-testid": "sidebar" }, "Sidebar Mock"),
}));

describe("ActasPage — pruebas de frontend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [] }),
    } as Response);
  });

  it("renderiza cabecera, pestañas y botón Nueva Acta", async () => {
    await act(async () => {
      render(React.createElement(ActasPage));
    });

    expect(screen.getByRole("heading", { name: "Actas" })).toBeInTheDocument();
    expect(
      screen.getByText("Registro de sesiones y asistencia")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Actas de Asociación" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Actas de Junta Directiva" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Nueva Acta/i }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("muestra estado vacío cuando no hay actas", async () => {
    await act(async () => {
      render(React.createElement(ActasPage));
    });

    await waitFor(() => {
      expect(
        screen.getByText("No hay actas registradas")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Crea la primera acta de Asociación/i)
    ).toBeInTheDocument();
  });

  it("al cambiar a Junta Directiva actualiza el mensaje de estado vacío", async () => {
    await act(async () => {
      render(React.createElement(ActasPage));
    });

    await waitFor(() => {
      expect(
        screen.getByText("No hay actas registradas")
      ).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Actas de Junta Directiva" })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Crea la primera acta de Junta Directiva/i)
      ).toBeInTheDocument();
    });
  });

  it("abre el modal de nueva acta al hacer clic en Nueva Acta", async () => {
    await act(async () => {
      render(React.createElement(ActasPage));
    });

    await waitFor(() => {
      expect(
        screen.getByText("No hay actas registradas")
      ).toBeInTheDocument();
    });

    const btnNueva = screen.getAllByRole("button", {
      name: /Nueva Acta/i,
    })[0];
    await act(async () => {
      fireEvent.click(btnNueva);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: /Nueva Acta de Asociación/i,
        })
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Fecha *")).toBeInTheDocument();
    expect(screen.getByText("Tipo de Sesión *")).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeTruthy();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("lista actas y muestra acciones cuando hay datos", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: 1,
            fecha: "2026-05-10T00:00:00.000Z",
            tipoSesion: "ordinaria",
            urlActa: null,
            nombreArchivo: null,
            createdAt: "2026-05-10T00:00:00.000Z",
            totalAsistentes: 4,
            totalAusentes: 2,
          },
        ],
      }),
    } as Response);

    await act(async () => {
      render(React.createElement(ActasPage));
    });

    await waitFor(() => {
      expect(screen.getAllByText("10/05/2026").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText("Ordinaria").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: /Asistencia/i }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("muestra diálogo de confirmación al eliminar", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: 7,
            fecha: "2026-04-01T00:00:00.000Z",
            tipoSesion: "extraordinaria",
            urlActa: null,
            nombreArchivo: null,
            createdAt: "2026-04-01T00:00:00.000Z",
            totalAsistentes: 1,
            totalAusentes: 0,
          },
        ],
      }),
    } as Response);

    await act(async () => {
      render(React.createElement(ActasPage));
    });

    await waitFor(() => {
      expect(screen.getAllByText("01/04/2026").length).toBeGreaterThanOrEqual(1);
    });

    const trashBtn = screen
      .getAllByRole("button")
      .find((b) => b.className.includes("bg-red-50"));
    expect(trashBtn).toBeTruthy();
    await act(async () => {
      fireEvent.click(trashBtn!);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "¿Eliminar acta?" })
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
  });
});
