import Link from 'next/link';
import Image from 'next/image';
import { FaChurch } from 'react-icons/fa'; 

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4] font-['Segoe_UI',_sans-serif]">
      {/* Navbar */}
      <nav className="bg-[#003366] shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            {/* Logo y Marca */}
            <Link 
              href="/" 
              className="text-white text-xl font-bold p-2 rounded transition-colors hover:bg-[#005599] flex items-center" 
              id="head"
            >
              <FaChurch className="inline mr-2" /> SCRCR
            </Link>
            
            {/* Botones de Navegación */}
            <div className="flex gap-4">
              <Link
                href="/login" // Pendiente la ruta /login
                className="text-white font-bold py-2 px-4 rounded border border-white hover:bg-white hover:text-[#003366] transition duration-300"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro-asociados" // registro-asociados
                className="text-white font-bold py-2 px-4 rounded border border-white hover:bg-white hover:text-[#003366] transition duration-300"
              >
                Registro
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-5 text-center bg-gradient-to-r from-[#003366] to-[#17609c] text-white">
        <h1 className="text-4xl sm:text-5xl font-bold mb-5">
          Bienvenido al Sistema SCRCR
        </h1>
        <p className="text-lg max-w-3xl mx-auto">
          Este sistema permite gestionar los registros de asociados, congregados y recursos humanos de manera eficiente para la Iglesia Bíblica Emanuel.
        </p>
      </section>

      {/* Content Section con Imagen y Botones */}
      <div className="content container mx-auto px-4 py-12 flex-grow flex flex-col items-center">
        
        {/* Imagen Central: logo-iglesia.png */}
        <div className="mb-10 w-full max-w-md sm:max-w-lg lg:max-w-xl">
          <Image
            src="/logo-iglesia.png" 
            alt="Logo de la Iglesia Bíblica Emanuel"
            width={700} // Corresponde al max-width de #logo
            height={400} 
            className="w-full h-auto object-contain"
            priority // Carga prioritaria para la imagen principal
          />
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-auto bg-[#003366] text-white text-center py-4">
        <div className="container mx-auto px-4">
          <p className="text-sm">
            Sistema de Control y Registro de Asociados, Congregados y Recursos Humanos (SCRCR) | Iglesia Bíblica Emanuel
          </p>
        </div>
      </footer>
    </div>
  );
}