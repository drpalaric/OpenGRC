import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RiskDetails from '../pages/RiskDetails';

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
  linkedControls: ['ctrl-1', 'ctrl-2'], // Use UUIDs instead of business IDs
  stakeholders: ['CISO', 'CTO'],
  creator: 'John Doe',
  businessUnit: 'IT Department',
  riskOwner: 'CISO',
  assets: 'Customer database, payment systems',
};

const mockControls = [
  {
    id: 'ctrl-1',
    controlId: 'CTRL-001',
    name: 'Access Control',
    domain: 'Identity & Access Control',
    description: 'Implement access controls',
  },
  {
    id: 'ctrl-2',
    controlId: 'CTRL-002',
    name: 'Encryption',
    domain: 'Data Protection',
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
        expect(screen.getAllByText('RISK-001').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Data Breach').length).toBeGreaterThan(0);
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
        expect(screen.getAllByText(/CTRL-001/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Access Control/).length).toBeGreaterThan(0);
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
        expect(screen.getAllByText('Data Breach').length).toBeGreaterThan(0);
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

    it('should display linked controls with controlId, name, and domain fields', async () => {
      const updatedControls = [
        {
          id: 'uuid-1',
          controlId: 'AST-01',
          name: 'Asset Inventory',
          domain: 'Asset Management',
          description: 'Maintain asset inventory',
        },
        {
          id: 'uuid-2',
          controlId: 'IAC-02',
          name: 'Access Control Policy',
          domain: 'Identity & Access Control',
          description: 'Define access control policy',
        },
      ];

      const riskWithNewControls = {
        ...mockRisk,
        linkedControls: ['uuid-1', 'uuid-2'], // Use UUIDs instead of business IDs
      };

      let callCount = 0;
      (global.fetch as any).mockImplementation((url: string) => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: riskWithNewControls }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: updatedControls }),
        });
      });

      render(
        <MemoryRouter initialEntries={['/risks/risk-uuid-123']}>
          <Routes>
            <Route path="/risks/:id" element={<RiskDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('AST-01')).toBeInTheDocument();
        expect(screen.getByText('Asset Inventory')).toBeInTheDocument();
        expect(screen.getByText('Asset Management')).toBeInTheDocument();
      });
    });
  });
});
