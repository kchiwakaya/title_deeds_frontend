import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LIMSInterface from './LIMSInterface'
import axios from 'axios'

vi.mock('axios')

describe('LIMSInterface', () => {
    const mockSelectedApp = {
        id: 1,
        farmer: 'John Doe',
        farmer_details: { national_id: '12-345678-A-12' },
        farm_name: 'Test Farm',
        farm_extent: '100.0000',
        district: 'Harare',
        farm_id: 'FRM-001'
    }

    const mockOnClose = vi.fn()
    const mockOnSuccess = vi.fn()
    const mockOnError = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the LIMS interface correctly', () => {
        render(
            <LIMSInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        expect(screen.getByText(/LIMS Officer/i)).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('verifies LIMS successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <LIMSInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const verifyButton = screen.getByText(/Verify - Farm Found/i)
        fireEvent.click(verifyButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/verify_lims/`,
                expect.any(Object)
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('rejects application successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <LIMSInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        // Switch to reject mode
        const rejectButton = screen.getByText(/Reject/i)
        fireEvent.click(rejectButton)

        // Select rejection type
        const rejectionTypeSelect = screen.getByRole('combobox')
        fireEvent.change(rejectionTypeSelect, { target: { value: 'not_found' } })

        const submitButton = screen.getByText(/Confirm Rejection/i)
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/reject_lims/`,
                expect.objectContaining({
                    rejection_type: 'not_found'
                })
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('validates rejection type is selected', async () => {
        render(
            <LIMSInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const rejectButton = screen.getByText(/Reject/i)
        fireEvent.click(rejectButton)

        const submitButton = screen.getByText(/Confirm Rejection/i)
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('Please select a rejection reason')
        })
    })

    it('handles API error gracefully', async () => {
        axios.post.mockRejectedValueOnce({
            response: { data: { error: 'API Error' } }
        })

        render(
            <LIMSInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const verifyButton = screen.getByText(/Verify - Farm Found/i)
        fireEvent.click(verifyButton)

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('API Error')
        })
    })
})
