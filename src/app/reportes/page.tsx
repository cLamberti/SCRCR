'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  FaHome,
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSpinner,
  FaEdit,
} from 'react-icons/fa';

interface Asociado {
  id: number;
  nombreCompleto: string;
  cedula: string;
  telefono?: string;
  ministerio?: string;
}

interface Evento {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha: string;
  hora?: string;
}

interface RegistroAsistencia {
  id: number;
  eventoId: number;
  asociadoId: number;
  estado: 'presente' | 'ausente' | 'justificado';
  fecha: string;
  horaRegistro?: string;
  justificacion?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportesPage() {
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [eventoId, setEventoId] = useState<number>(0);
  const [cargandoAsociados, setCargandoAsociados] = useState(true);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);
  const [procesando, setProcesando] = useState<Set<number>>(new Set());

  // Cargar asociados
  useEffect(() => {
    cargarAsociados();
    cargarEventos();
  }, []);

  // Cargar registros cuando cambia el evento
  useEffect(() => {
    if (eventoId > 0) {
      cargarRegistros();
    }
  }, [eventoId]);

  const cargarAsociados = async () => {
    try {
      setCargandoAsociados(true);
      const res = await fetch('/api/asociados');
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setAsociados(data.data);
      } else {
        toast.error('No se pudieron cargar los asociados');
        setAsociados([]);
      }
    } catch (error) {
      console.error('Error cargando asociados:', error);
      toast.error('Error de conexión al cargar asociados');
      setAsociados([]);
    } finally {
      setCargandoAsociados(false);
    }
  };

  const cargarEventos = async () => {
    try {
      setCargandoEventos(true);
      const res = await fetch('/api/eventos');
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setEventos(data.data);
        if (data.data.length > 0) {
          setEventoId(data.data[0].id);
        }
      } else {
        toast.error('No se pudieron cargar los eventos');
        setEventos([]);
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
      toast.error('Error de conexión al cargar eventos');
      setEventos([]);
    } finally {
      setCargandoEventos(false);
    }
  };

  const cargarRegistros = async () => {
    try {
      setCargandoRegistros(true);
      const res = await fetch(`/api/reporte-asistencia?eventoId=${eventoId}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setRegistros(data.data);
      } else {
        setRegistros([]);
      }
    } catch (error) {
      console.error('Error cargando registros:', error);
      toast.error('Error al cargar registros de asistencia');
      setRegistros([]);
    } finally {
      setCargandoRegistros(false);
    }
  };

  const registrarAsistencia = async (
    asociadoId: number,
    estado: 'presente' | 'ausente' | 'justificado',
    justificacion?: string
  ) => {
    setProcesando(prev => new Set(prev).add(asociadoId));
    const toastId = toast.loading('Registrando asistencia...');

    try {
      const res = await fetch('/api/reporte-asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventoId,
          asociadoId,
          estado,
          fecha: new Date().toISOString().split('T')[0],
          justificacion,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Recargar los registros desde el servidor
        await cargarRegistros();
        
        toast.success(
          estado === 'presente' ? '✓ Presente' :
          estado === 'ausente' ? '✗ Ausente' :
          '⚠ Justificado',
          { id: toastId, duration: 1500 }
        );
      } else {
        toast.error(data.message || 'Error al registrar', { id: toastId });
      }
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      toast.error('Error de conexión', { id: toastId });
    } finally {
      setProcesando(prev => {
        const next = new Set(prev);
        next.delete(asociadoId);
        return next;
      });
    }
  };

  const actualizarAsistencia = async (
    registroId: number,
    asociadoId: number,
    nuevoEstado: 'presente' | 'ausente' | 'justificado',
    justificacion?: string
  ) => {
    setProcesando(prev => new Set(prev).add(asociadoId));
    const toastId = toast.loading('Actualizando asistencia...');

    try {
      const res = await fetch(`/api/reporte-asistencia?id=${registroId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: nuevoEstado,
          justificacion,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Recargar los registros desde el servidor
        await cargarRegistros();
        
        toast.success(
          nuevoEstado === 'presente' ? '✓ Actualizado a Presente' :
          nuevoEstado === 'ausente' ? '✗ Actualizado a Ausente' :
          '⚠ Actualizado a Justificado',
          { id: toastId, duration: 1500 }
        );
      } else {
        toast.error(data.message || 'Error al actualizar', { id: toastId });
      }
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
      toast.error('Error de conexión', { id: toastId });
    } finally {
      setProcesando(prev => {
        const next = new Set(prev);
        next.delete(asociadoId);
        return next;
      });
    }
  };

  const manejarCambioEstado = async (
    asociadoId: number,
    nuevoEstado: 'presente' | 'ausente' | 'justificado'
  ) => {
    const registroExistente = registros.find(r => r.asociadoId === asociadoId);
    
    if (!registroExistente) {
      // Si no existe registro, crear uno nuevo
      if (nuevoEstado === 'justificado') {
        const { value: justificacion } = await Swal.fire({
          title: 'Justificación',
          input: 'textarea',
          inputLabel: 'Por favor, ingrese la justificación:',
          inputPlaceholder: 'Escriba la justificación aquí...',
          inputAttributes: {
            'aria-label': 'Escriba la justificación aquí'
          },
          showCancelButton: true,
          confirmButtonText: 'Registrar',
          cancelButtonText: 'Cancelar',
          reverseButtons: true,
          inputValidator: (value) => {
            if (!value) {
              return 'La justificación es obligatoria';
            }
            return null;
          }
        });

        if (justificacion !== undefined) {
          await registrarAsistencia(asociadoId, nuevoEstado, justificacion);
        }
      } else {
        await registrarAsistencia(asociadoId, nuevoEstado);
      }
      return;
    }

    // Si ya existe registro, confirmar cambio
    const estadoActualTexto = 
      registroExistente.estado === 'presente' ? 'Presente' :
      registroExistente.estado === 'ausente' ? 'Ausente' :
      'Justificado';

    const nuevoEstadoTexto = 
      nuevoEstado === 'presente' ? 'Presente' :
      nuevoEstado === 'ausente' ? 'Ausente' :
      'Justificado';

    const result = await Swal.fire({
      title: '¿Cambiar estado de asistencia?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Estado actual:</strong> ${estadoActualTexto}</p>
          <p class="mb-2"><strong>Nuevo estado:</strong> ${nuevoEstadoTexto}</p>
          ${registroExistente.justificacion ? `<p class="mb-2 text-sm text-gray-600"><strong>Justificación anterior:</strong> ${registroExistente.justificacion}</p>` : ''}
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    // Si el nuevo estado es justificado, pedir justificación
    if (nuevoEstado === 'justificado') {
      const { value: justificacion } = await Swal.fire({
        title: 'Nueva Justificación',
        input: 'textarea',
        inputLabel: 'Por favor, ingrese la nueva justificación:',
        inputPlaceholder: 'Escriba la justificación aquí...',
        inputAttributes: {
          'aria-label': 'Escriba la justificación aquí'
        },
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        inputValidator: (value) => {
          if (!value) {
            return 'La justificación es obligatoria';
          }
          return null;
        }
      });

      if (justificacion !== undefined) {
        await actualizarAsistencia(registroExistente.id, asociadoId, nuevoEstado, justificacion);
      }
    } else {
      await actualizarAsistencia(registroExistente.id, asociadoId, nuevoEstado);
    }
  };

  const resetearAsistencia = async () => {
    const result = await Swal.fire({
      title: '¿Resetear todas la asistencias?',
      html: `
        <div class="text-left">
          <p class="mb-2">Esta acción eliminará todos los registros de asistencia del evento seleccionado.</p>
          <p class="mb-2 text-red-600 font-semibold">⚠️ Esta acción no se puede deshacer</p>
          <div class="mt-4 p-3 bg-gray-100 rounded">
            <p class="text-sm"><strong>Registros a eliminar:</strong></p>
            <ul class="text-sm mt-2">
              <li>• Presentes: ${estadisticas.presentes}</li>
              <li>• Ausentes: ${estadisticas.ausentes}</li>
              <li>• Justificados: ${estadisticas.justificados}</li>
              <li class="font-bold mt-1">Total: ${registros.length} registros</li>
            </ul>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, resetear todo',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      return;
    }

    const toastId = toast.loading('Reseteando asistencia...');

    try {
      const res = await fetch(`/api/reporte-asistencia?eventoId=${eventoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (data.success) {
        // Limpiar el estado local inmediatamente
        setRegistros([]);
        
        toast.success('✓ Asistencia reseteada exitosamente', { 
          id: toastId, 
          duration: 2000 
        });
        
        await Swal.fire({
          title: '¡Reseteado!',
          text: 'Todos los registros de asistencia han sido eliminados.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        toast.error(data.message || 'Error al resetear', { id: toastId });
      }
    } catch (error) {
      console.error('Error reseteando asistencia:', error);
      toast.error('Error de conexión', { id: toastId });
    }
  };

  const obtenerEstadoAsociado = (asociadoId: number) => {
    return registros.find(r => r.asociadoId === asociadoId)?.estado;
  };

  const getEstadoIcon = (estado?: string) => {
    switch (estado) {
      case 'presente':
        return <FaCheckCircle className="text-green-600" />;
      case 'ausente':
        return <FaTimesCircle className="text-red-600" />;
      case 'justificado':
        return <FaExclamationCircle className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const getEstadoBadge = (estado?: string) => {
    switch (estado) {
      case 'presente':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            Presente
          </span>
        );
      case 'ausente':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
            Ausente
          </span>
        );
      case 'justificado':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            Justificado
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
            Sin registro
          </span>
        );
    }
  };

  const contarEstados = () => {
    const presentes = registros.filter(r => r.estado === 'presente').length;
    const ausentes = registros.filter(r => r.estado === 'ausente').length;
    const justificados = registros.filter(r => r.estado === 'justificado').length;
    const sinRegistro = asociados.length - registros.length;

    return { presentes, ausentes, justificados, sinRegistro };
  };

  const estadisticas = contarEstados();

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      {/* Header */}
      <header className="bg-[#003366] text-white shadow-lg">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-3xl" />
              <div>
                <h1 className="text-2xl font-bold">Reportes de Asistencia</h1>
                <p className="text-sm opacity-90">
                  Registra y consulta la asistencia de los asociados
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FaHome /> Inicio
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Asistencia de Asociados</h2>
            <div className="flex items-center gap-2">
              <FaUsers className="text-gray-600" />
              <span className="text-gray-700 font-medium">
                Total: {asociados.length} asociados
              </span>
            </div>
          </div>

          {/* Selector de evento */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Seleccionar Evento
                </label>
                <select
                  value={eventoId}
                  onChange={(e) => setEventoId(Number(e.target.value))}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {cargandoEventos ? (
                    <option>Cargando eventos...</option>
                  ) : eventos.length > 0 ? (
                    eventos.map(evento => (
                      <option key={evento.id} value={evento.id}>
                        {evento.nombre} - {evento.fecha}
                      </option>
                    ))
                  ) : (
                    <option>No hay eventos disponibles</option>
                  )}
                </select>
              </div>
              
              {/* Botón de Reset */}
              <button
                onClick={resetearAsistencia}
                disabled={registros.length === 0 || cargandoRegistros}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                  registros.length === 0 || cargandoRegistros
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={registros.length === 0 ? 'No hay registros para resetear' : 'Resetear toda la asistencia'}
              >
                <FaTimesCircle />
                Resetear Asistencia
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-800">{asociados.length}</div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-800">{estadisticas.presentes}</div>
              <div className="text-sm text-green-600">Presentes</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-800">{estadisticas.ausentes}</div>
              <div className="text-sm text-red-600">Ausentes</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-800">{estadisticas.justificados}</div>
              <div className="text-sm text-yellow-600">Justificados</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-800">{estadisticas.sinRegistro}</div>
              <div className="text-sm text-gray-600">Sin Registrar</div>
            </div>
          </div>

          {/* Tabla de asistencia */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left text-gray-700 font-semibold">Nombre</th>
                  <th className="py-3 px-4 border-b text-left text-gray-700 font-semibold">Cédula</th>
                  <th className="py-3 px-4 border-b text-left text-gray-700 font-semibold">Ministerio</th>
                  <th className="py-3 px-4 border-b text-left text-gray-700 font-semibold">Estado</th>
                  <th className="py-3 px-4 border-b text-left text-gray-700 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargandoAsociados ? (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin" />
                        Cargando asociados...
                      </div>
                    </td>
                  </tr>
                ) : asociados.length > 0 ? (
                  asociados.map(asociado => {
                    const estado = obtenerEstadoAsociado(asociado.id);
                    return (
                      <tr key={asociado.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b">{asociado.nombreCompleto}</td>
                        <td className="py-3 px-4 border-b">{asociado.cedula}</td>
                        <td className="py-3 px-4 border-b">{asociado.ministerio || 'N/A'}</td>
                        <td className="py-3 px-4 border-b">
                          {getEstadoBadge(estado)}
                        </td>
                        <td className="py-3 px-4 border-b">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => manejarCambioEstado(asociado.id, 'presente')}
                              disabled={procesando.has(asociado.id) || estado === 'presente'}
                              className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                                procesando.has(asociado.id)
                                  ? 'bg-gray-300 cursor-not-allowed'
                                  : estado === 'presente'
                                  ? 'bg-green-300 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {procesando.has(asociado.id) ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaCheckCircle />
                              )}
                              Presente
                            </button>
                            <button
                              onClick={() => manejarCambioEstado(asociado.id, 'ausente')}
                              disabled={procesando.has(asociado.id) || estado === 'ausente'}
                              className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                                procesando.has(asociado.id)
                                  ? 'bg-gray-300 cursor-not-allowed'
                                  : estado === 'ausente'
                                  ? 'bg-red-300 cursor-not-allowed'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              {procesando.has(asociado.id) ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaTimesCircle />
                              )}
                              Ausente
                            </button>
                            <button
                              onClick={() => manejarCambioEstado(asociado.id, 'justificado')}
                              disabled={procesando.has(asociado.id) || estado === 'justificado'}
                              className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                                procesando.has(asociado.id)
                                  ? 'bg-gray-300 cursor-not-allowed'
                                  : estado === 'justificado'
                                  ? 'bg-yellow-300 cursor-not-allowed'
                                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              }`}
                            >
                              {procesando.has(asociado.id) ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaExclamationCircle />
                              )}
                              Justificado
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                      No hay asociados registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="toast-container"></div>
      </div>
    </div>
  );
}