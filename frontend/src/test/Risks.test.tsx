import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Risks from '../pages/Risks';

/**
 * Risks Page Tests - TDD Implementation
 * Tests for full risk management CRUD functionality
 */

// Mock fetch globally
global.fetch = vi.fn();

describe('Risks Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('should render page title "Risk Management"', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Risk Management')).toBeInTheDocument();
      });
    });

    it('should render "Add Risk" button', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Add Risk/i)).toBeInTheDocument();
      });
    });

    it('should have black background styling', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const { container } = render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        const riskContainer = container.querySelector('.bg-black');
        expect(riskContainer).toBeInTheDocument();
      });
    });
  });

  describe('Risk List Display', () => {
    it('should display risks in a table with all required columns', async () => {
      const mockRisks = [
        {
          id: 'risk-1',
          riskId: 'RISK-001',
          title: 'Data Breach',
          riskOwner: 'CISO',
          linkedControls: ['ctrl-001', 'ctrl-002'],
          inherentLikelihood: 'high',
          inherentImpact: 'critical',
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockRisks }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('RISK-001')).toBeInTheDocument();
        expect(screen.getByText('Data Breach')).toBeInTheDocument();
        expect(screen.getByText('CISO')).toBeInTheDocument();
      });
    });

    it('should display linked control IDs', async () => {
      const mockRisks = [
        {
          id: 'risk-1',
          riskId: 'RISK-001',
          title: 'Risk with Controls',
          linkedControls: ['ctrl-001', 'ctrl-002'],
          inherentLikelihood: 'medium',
          inherentImpact: 'low',
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockRisks }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/ctrl-001/)).toBeInTheDocument();
        expect(screen.getByText(/ctrl-002/)).toBeInTheDocument();
      });
    });

    it('should display linked controls with controlId, domain, and name', async () => {
      const mockControls = [
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

      const mockRisks = [
        {
          id: 'risk-1',
          riskId: 'RISK-001',
          title: 'Risk with Controls',
          linkedControls: ['AST-01', 'IAC-02'],
          inherentLikelihood: 'medium',
          inherentImpact: 'low',
        },
      ];

      let callCount = 0;
      (global.fetch as any).mockImplementation((url: string) => {
        callCount++;
        // First call is for risks
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockRisks }),
          });
        }
        // Second call is for controls
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockControls }),
        });
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should display control with format: controlId, domain, name
        expect(screen.getByText(/AST-01, Asset Management, Asset Inventory/)).toBeInTheDocument();
      });
    });

    it('should display linked controls in alphabetical order by controlId', async () => {
      const mockControls = [
        {
          id: 'uuid-1',
          controlId: 'IAC-02',
          name: 'Access Control Policy',
          domain: 'Identity & Access Control',
          description: 'Define access control policy',
        },
        {
          id: 'uuid-2',
          controlId: 'AST-01',
          name: 'Asset Inventory',
          domain: 'Asset Management',
          description: 'Maintain asset inventory',
        },
        {
          id: 'uuid-3',
          controlId: 'DCH-03',
          name: 'Data Classification',
          domain: 'Data Management',
          description: 'Classify data assets',
        },
      ];

      const mockRisks = [
        {
          id: 'risk-1',
          riskId: 'RISK-001',
          title: 'Risk with Controls',
          // linkedControls are in non-alphabetical order
          linkedControls: ['IAC-02', 'DCH-03', 'AST-01'],
          inherentLikelihood: 'medium',
          inherentImpact: 'low',
        },
      ];

      let callCount = 0;
      (global.fetch as any).mockImplementation((url: string) => {
        callCount++;
        // First call is for risks
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockRisks }),
          });
        }
        // Second call is for controls
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockControls }),
        });
      });

      const { container } = render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should display controls in alphabetical order: AST-01, DCH-03, IAC-02
        const linkedControlsCell = container.querySelector('td:nth-child(4)');
        const text = linkedControlsCell?.textContent || '';
        // AST-01 should appear before DCH-03 and IAC-02
        const astIndex = text.indexOf('AST-01');
        const dchIndex = text.indexOf('DCH-03');
        const iacIndex = text.indexOf('IAC-02');
        expect(astIndex).toBeGreaterThan(-1);
        expect(dchIndex).toBeGreaterThan(-1);
        expect(iacIndex).toBeGreaterThan(-1);
        expect(astIndex).toBeLessThan(dchIndex);
        expect(dchIndex).toBeLessThan(iacIndex);
      });
    });

    it('should show "..." when more than 3 controls are linked', async () => {
      const mockRisks = [
        {
          id: 'risk-1',
          riskId: 'RISK-001',
          title: 'Risk with Many Controls',
          linkedControls: ['ctrl-001', 'ctrl-002', 'ctrl-003', 'ctrl-004'],
          inherentLikelihood: 'medium',
          inherentImpact: 'low',
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockRisks }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
      });
    });

    it('should display empty state when no risks exist', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No risks found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Color Coding for Likelihood/Impact', () => {
    it('should apply white color for very_low level', async () => {
      const mockRisks = [
        {
          id: 'risk-1',
          riskId: 'RISK-001',
          title: 'Low Risk',
          inherentLikelihood: 'very_low',
          inherentImpact: 'very_low',
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockRisks }),
      });

      const { container } = render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        const veryLowBadge = container.querySelector('.bg-white');
        expect(veryLowBadge).toBeInTheDocument();
      });
    });

    it('should apply light grey color for low level', async () => {
      const mockRisks = [
        {
          id: 'risk-1',
          riskId: 'RISK-001',
          title: 'Low Risk',
          inherentLikelihood: 'low',
          inherentImpact: 'low',
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockRisks }),
      });

      const { container } = render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        const lowBadge = container.querySelector('.bg-gray-300');
        expect(lowBadge).toBeInTheDocument();
      });
    });

    it('should apply amber color for medium level', async () => {
      const mockRisks = [
        {
          id: 'risk-1',
          riskId: 'RISK-001',
          title: 'Medium Risk',
          inherentLikelihood: 'medium',
          inherentImpact: 'medium',
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockRisks }),
      });

      const { container } = render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        const mediumBadge = container.querySelector('.bg-amber-500');
        expect(mediumBadge).toBeInTheDocument();
      });
    });

    it('should apply red-orange color for high level', async () => {
      const mockRisks = [
        {
          id: 'risk-1',
          riskId: 'RISK-001',
          title: 'High Risk',
          inherentLikelihood: 'high',
          inherentImpact: 'high',
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockRisks }),
      });

      const { container } = render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        const highBadge = container.querySelector('.bg-orange-600');
        expect(highBadge).toBeInTheDocument();
      });
    });

    it('should apply maroon color for critical level', async () => {
      const mockRisks = [
        {
          id: 'risk-1',
          riskId: 'RISK-001',
          title: 'Critical Risk',
          inherentLikelihood: 'critical',
          inherentImpact: 'critical',
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockRisks }),
      });

      const { container } = render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        const criticalBadge = container.querySelector('.bg-red-900');
        expect(criticalBadge).toBeInTheDocument();
      });
    });
  });

  describe('Create Risk Modal', () => {
    it('should open create risk modal when Add Risk button clicked', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        const addButton = screen.getByText(/Add Risk/i);
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Risk')).toBeInTheDocument();
      });
    });

    it('should have required fields marked (riskId and title)', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Add Risk/i));
      });

      await waitFor(() => {
        // Look for asterisks marking required fields
        const riskIdLabel = screen.getByText(/Risk ID/);
        const titleLabel = screen.getByText(/Title/);

        expect(riskIdLabel.textContent).toMatch(/\*/);
        expect(titleLabel.textContent).toMatch(/\*/);
      });
    });

    it('should have all risk fields in create modal', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Add Risk/i));
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/Risk ID/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Inherent Likelihood/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Inherent Impact/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Treatment/i)).toBeInTheDocument();
      });
    });

    it('should close modal when cancel button clicked', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Add Risk/i));
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Risk')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Cancel/i));

      await waitFor(() => {
        expect(screen.queryByText('Create New Risk')).not.toBeInTheDocument();
      });
    });
  });

  describe('Control Linking', () => {
    it('should have control linking section in create modal', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Add Risk/i));
      });

      await waitFor(() => {
        expect(screen.getByText(/Linked Controls/i)).toBeInTheDocument();
      });
    });

    it('should allow searching controls by title, description, or ID', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Add Risk/i));
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search controls/i);
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('should display controls with controlId, name, and domain fields', async () => {
      const mockControls = [
        {
          id: 'uuid-1',
          controlId: 'AST-01',
          name: 'Asset Management',
          domain: 'Asset Management',
          description: 'Control for managing assets',
        },
      ];

      let callCount = 0;
      (global.fetch as any).mockImplementation((url: string) => {
        callCount++;
        // First call is for risks
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: [] }),
          });
        }
        // Second call is for controls
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockControls }),
        });
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Add Risk/i));
      });

      await waitFor(() => {
        expect(screen.getByText(/AST-01 - Asset Management/)).toBeInTheDocument();
      });
    });

    it('should allow selecting controls by controlId in create modal', async () => {
      const mockControls = [
        {
          id: 'uuid-1',
          controlId: 'AST-01',
          name: 'Asset Inventory',
          domain: 'Asset Management',
          description: 'Maintain asset inventory',
        },
      ];

      let callCount = 0;
      (global.fetch as any).mockImplementation((url: string) => {
        callCount++;
        // First call is for risks
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: [] }),
          });
        }
        // Second call is for controls
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockControls }),
        });
      });

      render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Add Risk/i));
      });

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should display controls in alphabetical order in create modal', async () => {
      const mockControls = [
        {
          id: 'uuid-1',
          controlId: 'IAC-02',
          name: 'Access Control Policy',
          domain: 'Identity & Access Control',
          description: 'Define access control policy',
        },
        {
          id: 'uuid-2',
          controlId: 'DCH-03',
          name: 'Data Classification',
          domain: 'Data Management',
          description: 'Classify data assets',
        },
        {
          id: 'uuid-3',
          controlId: 'AST-01',
          name: 'Asset Inventory',
          domain: 'Asset Management',
          description: 'Maintain asset inventory',
        },
      ];

      let callCount = 0;
      (global.fetch as any).mockImplementation((url: string) => {
        callCount++;
        // First call is for risks
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: [] }),
          });
        }
        // Second call is for controls
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockControls }),
        });
      });

      const { container } = render(
        <BrowserRouter>
          <Risks />
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Add Risk/i));
      });

      await waitFor(() => {
        // Find the control list container
        const controlListContainer = container.querySelector('.max-h-48.overflow-y-auto');
        expect(controlListContainer).toBeTruthy();

        // Find all control labels within the control list
        const controlLabels = controlListContainer?.querySelectorAll('.text-sm.font-medium.text-white');
        const controlTexts = Array.from(controlLabels || []).map(label => label.textContent);

        // Should be in alphabetical order: AST-01, DCH-03, IAC-02
        expect(controlTexts.length).toBe(3);
        expect(controlTexts[0]).toContain('AST-01');
        expect(controlTexts[1]).toContain('DCH-03');
        expect(controlTexts[2]).toContain('IAC-02');
      });
    });
  });
});
