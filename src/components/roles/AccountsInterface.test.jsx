import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AccountsInterface from './AccountsInterface'
import axios from 'axios'

vi.mock('axios')

describe('AccountsInterface', () => {
    const mockSelectedApp = {
        id: 1,
        farmer: 'John Doe',
        farmer_details: { national_id: '12-345678-A-12' },
        farm_name: 'Test Farm',
        district: 'Harare'
    }

    const mockOnClose = vi.fn()
    const mockOnSuccess = vi.fn()
    const mockOnError = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the accounts interface correctly', () => {
        render(
            <AccountsInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        expect(screen.getByText(/Accounts Officer/i)).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('confirms application fee successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <AccountsInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const confirmButton = screen.getByText(/Fee Paid - Confirmed/i)
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/confirm_application_fee/`,
                expect.any(Object)
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('marks fee as unpaid successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <AccountsInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const unpaidButton = screen.getByText(/Mark as Unpaid/i)
        fireEvent.click(unpaidButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/mark_fee_unpaid/`,
                expect.any(Object)
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('handles API error gracefully', async () => {
        axios.post.mockRejectedValueOnce({
            response: { data: { error: 'API Error' } }
        })

        render(
            <AccountsInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const confirmButton = screen.getByText(/Fee Paid - Confirmed/i)
        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('API Error')
        })
    })
})
