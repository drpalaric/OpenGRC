import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ControlDetail from '../pages/ControlDetail';

/**
 * Control Detail Page Tests - TDD Implementation
 * Tests for control view/edit functionality with linked risks
 */

// Mock fetch globally
global.fetch = vi.fn();

const mockControl = {
  id: 'control-uuid-123',
  controlId: 'AST-01',
  source: 'NIST CSF',
  name: 'Asset Management',
  description: 'Maintain inventory of organizational assets',
  domain: 'Asset Management',
  procedure: 'Document all assets in CMDB',
  maturity: 'Level 3',
  nist80053: 'CM-8',
  evidence: 'CMDB reports',
  policy: 'Asset Management Policy v2.0',
};

const mockRisks = [
  {
    id: 'risk-uuid-1',
    riskId: 'RISK-001',
    title: 'Data Breach Risk',
    inherentLikelihood: 'high',
    inherentImpact: 'critical',
    treatment: 'Mitigate',
    linkedControls: ['control-uuid-123', 'other-control-uuid'], // Use UUIDs - contains control-uuid-123
  },
  {
    id: 'risk-uuid-2',
    riskId: 'RISK-002',
    title: 'Unauthorized Access',
    inherentLikelihood: 'medium',
    inherentImpact: 'high',
    treatment: 'Mitigate',
    linkedControls: ['control-uuid-123'], // Use UUIDs - contains control-uuid-123
  },
  {
    id: 'risk-uuid-3',
    riskId: 'RISK-003',
    title: 'System Failure',
    inherentLikelihood: 'low',
    inherentImpact: 'medium',
    treatment: 'Accept',
    linkedControls: ['different-control-uuid'], // Use UUIDs - does NOT contain control-uuid-123
  },
];

describe('Control Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Linked Risks Display', () => {
    it('should display risks that have this control linked', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControl }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisks }),
        });

      render(
        <MemoryRouter initialEntries={['/controls/control-uuid-123']}>
          <Routes>
            <Route path="/controls/:controlId" element={<ControlDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        // Should show the two risks that have AST-01 linked
        expect(screen.getByText('RISK-001')).toBeInTheDocument();
        expect(screen.getByText('Data Breach Risk')).toBeInTheDocument();
        expect(screen.getByText('RISK-002')).toBeInTheDocument();
        expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();
      });
    });

    it('should not display risks that do not have this control linked', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControl }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisks }),
        });

      render(
        <MemoryRouter initialEntries={['/controls/control-uuid-123']}>
          <Routes>
            <Route path="/controls/:controlId" element={<ControlDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        // RISK-003 has DCH-03 linked, not AST-01
        expect(screen.queryByText('RISK-003')).not.toBeInTheDocument();
        expect(screen.queryByText('System Failure')).not.toBeInTheDocument();
      });
    });

    it('should display correct count of linked risks', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockControl }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisks }),
        });

      render(
        <MemoryRouter initialEntries={['/controls/control-uuid-123']}>
          <Routes>
            <Route path="/controls/:controlId" element={<ControlDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        // Should show count of 2 (RISK-001 and RISK-002)
        expect(screen.getByText(/Linked Risks \(2\)/)).toBeInTheDocument();
      });
    });

    it('should show message when no risks are linked', async () => {
      // Use a different UUID that doesn't match any risks
      const controlWithNoRisks = { ...mockControl, id: 'unlinked-control-uuid', controlId: 'UNLINKED-01' };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: controlWithNoRisks }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockRisks }),
        });

      render(
        <MemoryRouter initialEntries={['/controls/unlinked-control-uuid']}>
          <Routes>
            <Route path="/controls/:controlId" element={<ControlDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No risks linked to this control')).toBeInTheDocument();
        expect(screen.getByText(/Linked Risks \(0\)/)).toBeInTheDocument();
      });
    });
  });
});
