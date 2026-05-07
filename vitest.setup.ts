import React from 'react';
import { beforeAll, vi, expect } from 'vitest';
import { config } from 'dotenv';
import '@testing-library/jest-dom/vitest';

beforeAll(() => {
    config({ path: '.env.local' });
});

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), 
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock de Next.js Image
vi.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => React.createElement('img', props),
}));

// Mock de react-icons/fa (Universal y SILENCIOSO)
vi.mock('react-icons/fa', () => {
    const Icon = () => null;
    return {
        FaUsers: Icon, FaUserPlus: Icon, FaSearch: Icon, FaEdit: Icon, FaTrash: Icon,
        FaChevronLeft: Icon, FaChevronRight: Icon, FaExclamationTriangle: Icon,
        FaTimes: Icon, FaSave: Icon, FaPlus: Icon, FaFilter: Icon,
        FaImage: Icon, FaDownload: Icon, FaPrint: Icon, FaCheck: Icon, FaInfoCircle: Icon,
        FaBook: Icon, FaFileAlt: Icon, FaExclamationCircle: Icon, FaChevronDown: Icon,
        FaExternalLinkAlt: Icon, FaUpload: Icon, FaSpinner: Icon,
    };
});

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
    default: {
        fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
    },
}));

// Mock de react-hot-toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

// Mock de fetch global
global.fetch = vi.fn();
