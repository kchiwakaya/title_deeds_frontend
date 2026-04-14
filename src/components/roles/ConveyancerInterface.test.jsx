import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ConveyancerInterface from './ConveyancerInterface'
import axios from 'axios'

vi.mock('axios')

describe('ConveyancerInterface', () => {
    const mockSelectedApp = {
        id: 1,
        farmer: 'John Doe',
        farmer_details: { national_id: '12-345678-A-12' },
        farm_name: 'Test Farm',
        official_farm_name: 'Official Test Farm',
        farm_extent: '100.0000',
        official_hectarage: '99.5000',
        valuation_amount: '50000.00',
        application_fee_paid: false,
        survey_fee_paid: false,
        survey_fee_amount: '1000.00'
    }

    const mockOnClose = vi.fn()
    const mockOnSuccess = vi.fn()
    const mockOnError = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the conveyancer interface correctly', () => {
        render(
            <ConveyancerInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        expect(screen.getByText(/Conveyancer - Agreement Preparation/i)).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('12-345678-A-12')).toBeInTheDocument()
    })

    it('calculates total correctly when fees are unpaid', () => {
        render(
            <ConveyancerInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        // Total should be: 50000 (valuation) + 10 (app fee) + 1000 (survey fee) = 51010
        expect(screen.getByText('$51010.00')).toBeInTheDocument()
    })

    it('calculates total correctly when fees are paid', () => {
        const paidApp = {
            ...mockSelectedApp,
            application_fee_paid: true,
            survey_fee_paid: true
        }

        render(
            <ConveyancerInterface
                selectedApp={paidApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        // Total should be only valuation amount
        expect(screen.getAllByText('$50000.00')[0]).toBeInTheDocument()
    })

    it('allows entering notes', () => {
        render(
            <ConveyancerInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const textarea = screen.getByPlaceholderText(/Add any notes about the agreement/i)
        fireEvent.change(textarea, { target: { value: 'Test notes' } })
        expect(textarea.value).toBe('Test notes')
    })

    it('calls onClose when cancel button is clicked', () => {
        render(
            <ConveyancerInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        fireEvent.click(screen.getByText('Cancel'))
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('prepares agreement successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <ConveyancerInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const prepareButton = screen.getByText(/Prepare Agreement & Approve/i)
        fireEvent.click(prepareButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/prepare_agreement/`,
                { notes: '' }
            )
            expect(mockOnSuccess).toHaveBeenCalledWith('Agreement prepared and application approved!')
        })
    })

    it('handles API error gracefully', async () => {
        axios.post.mockRejectedValueOnce({
            response: { data: { error: 'API Error' } }
        })

        render(
            <ConveyancerInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const prepareButton = screen.getByText(/Prepare Agreement & Approve/i)
        fireEvent.click(prepareButton)

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('API Error')
        })
    })

    it('disables button while processing', async () => {
        axios.post.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)))

        render(
            <ConveyancerInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const prepareButton = screen.getByText(/Prepare Agreement & Approve/i)
        fireEvent.click(prepareButton)

        expect(prepareButton).toBeDisabled()
    })
})
