import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ValuationInterface from './ValuationInterface'
import axios from 'axios'

vi.mock('axios')

describe('ValuationInterface', () => {
    const mockSelectedApp = {
        id: 1,
        farmer: 'John Doe',
        farmer_details: { national_id: '12-345678-A-12' },
        farm_name: 'Test Farm',
        official_farm_name: 'Official Test Farm',
        farm_extent: '100.0000',
        official_hectarage: '99.5000'
    }

    const mockOnClose = vi.fn()
    const mockOnSuccess = vi.fn()
    const mockOnError = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the valuation interface correctly', () => {
        render(
            <ValuationInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        expect(screen.getByText(/Valuation Officer/i)).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('allows entering valuation amount', () => {
        render(
            <ValuationInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const input = screen.getByPlaceholderText(/Enter valuation amount/i)
        fireEvent.change(input, { target: { value: '50000' } })
        expect(input.value).toBe('50000')
    })

    it('allows entering valuation notes', () => {
        render(
            <ValuationInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const textarea = screen.getByPlaceholderText(/Add valuation notes/i)
        fireEvent.change(textarea, { target: { value: 'Test notes' } })
        expect(textarea.value).toBe('Test notes')
    })

    it('submits valuation successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <ValuationInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const input = screen.getByPlaceholderText(/Enter valuation amount/i)
        fireEvent.change(input, { target: { value: '50000' } })

        const submitButton = screen.getByText(/Confirm Valuation/i)
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/set_valuation/`,
                expect.objectContaining({
                    valuation_amount: 50000
                })
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('shows error when amount is empty', async () => {
        render(
            <ValuationInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const submitButton = screen.getByText(/Set Valuation/i)
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('Valuation amount is required')
        })
    })

    it('handles API error gracefully', async () => {
        axios.post.mockRejectedValueOnce({
            response: { data: { error: 'API Error' } }
        })

        render(
            <ValuationInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const input = screen.getByPlaceholderText(/Enter valuation amount/i)
        fireEvent.change(input, { target: { value: '50000' } })

        const submitButton = screen.getByText(/Confirm Valuation/i)
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('API Error')
        })
    })
})
