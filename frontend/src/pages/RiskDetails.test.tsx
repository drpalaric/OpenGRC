import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RiskDetails from './RiskDetails';

/**
 * Risk Details Page Tests - TDD Implementation
 * Tests for risk view/edit functionality with control linking
 */

// Mock fetch globally
global.fetch = vi.fn();

const mockRisk = {
  id: 'risk-uuid-123',
  riskId: 'RISK-001',
  title: 'Data Breach',
  description: 'Risk of unauthorized data access',
  inherentLikelihood: 'high',
  inherentImpact: 'critical',
  residualLikelihood: 'medium',
  residualImpact: 'low',
  treatment: 'Mitigate',
  threats: 'External attackers, insider threats',
  linkedControls: ['CTRL-001', 'CTRL-002'],
  stakeholders: ['CISO', 'CTO'],
  creator: 'John Doe',
  businessUnit: 'IT Department',
  riskOwner: 'CISO',
  assets: 'Customer database, payment systems',
};

const mockControls = [
  {
    id: 'ctrl-1',
    requirementId: 'CTRL-001',
    title: 'Access Control',
    description: 'Implement access controls',
  },
  {
    id: 'ctrl-2',
    requirementId: 'CTRL-002',
    title: 'Encryption',
    description: 'Encrypt sensitive data',
  },
];

describe('Risk Details Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Loading and Display', () => {
    it('should fetch and display risk data on load', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('RISK-001')).toBeInTheDocument();
        expect(screen.getByText('Data Breach')).toBeInTheDocument();
      });
    });

    it('should display all risk fields in view mode', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Risk of unauthorized data access')).toBeInTheDocument();
        expect(screen.getByText('CISO')).toBeInTheDocument();
        expect(screen.getByText('External attackers, insider threats')).toBeInTheDocument();
      });
    });

    it('should display linked controls', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/CTRL-001/)).toBeInTheDocument();
        expect(screen.getByText(/Access Control/)).toBeInTheDocument();
      });
    });
  });

  describe('View Mode (Default)', () => {
    it('should render Edit button in view mode', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });

    it('should display Back to Risks link', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Back to Risks/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should enable editing when Edit button clicked', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('should show editable input fields in edit mode', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        });

      const { container } = render(
        <BrowserRouter>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </BrowserRouter>,
        { initialEntries: ['/risks/risk-uuid-123'] } as any
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit'));
      });

      await waitFor(() => {
        const inputs = container.querySelectorAll('input, textarea, select');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('should allow modifying risk fields', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit'));
      });

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Data Breach');
        fireEvent.change(titleInput, { target: { value: 'Updated Risk Title' } });
        expect(screen.getByDisplayValue('Updated Risk Title')).toBeInTheDocument();
      });
    });
  });

  describe('Save Functionality', () => {
    it('should save changes when Save button clicked', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { ...mockRisk, title: 'Updated Risk' } }),
      });

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        })
        .mockImplementationOnce(mockUpdate);

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit'));
      });

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Data Breach');
        fireEvent.change(titleInput, { target: { value: 'Updated Risk' } });
        fireEvent.click(screen.getByText('Save'));
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('should exit edit mode after successful save', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { ...mockRisk, title: 'Updated' } }),
        });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save'));
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should revert changes when Cancel button clicked', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit'));
      });

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Data Breach');
        fireEvent.change(titleInput, { target: { value: 'Should Not Save' } });
        fireEvent.click(screen.getByText('Cancel'));
      });

      await waitFor(() => {
        expect(screen.getByText('Data Breach')).toBeInTheDocument();
        expect(screen.queryByText('Should Not Save')).not.toBeInTheDocument();
      });
    });

    it('should exit edit mode when Cancel clicked', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisk }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControls }),
        });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Cancel'));
      });

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      });
    });
  });
});
