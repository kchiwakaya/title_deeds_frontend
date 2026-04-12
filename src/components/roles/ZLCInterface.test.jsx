import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ZLCInterface from './ZLCInterface'
import axios from 'axios'

vi.mock('axios')

describe('ZLCInterface', () => {
    const mockSelectedApp = {
        id: 1,
        farmer: 'John Doe',
        farmer_details: { national_id: '12-345678-A-12' },
        farm_name: 'Test Farm',
        farm_extent: '100.0000',
        district: 'Harare'
    }

    const mockOnClose = vi.fn()
    const mockOnSuccess = vi.fn()
    const mockOnError = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the ZLC interface correctly', () => {
        render(
            <ZLCInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        expect(screen.getByText(/ZLC Officer/i)).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('verifies ZLC clear successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <ZLCInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const verifyButton = screen.getByText(/No Disputes - Clear/i)
        fireEvent.click(verifyButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/verify_zlc_clear/`,
                expect.any(Object)
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('flags dispute successfully', async () => {
        axios.post.mockResolvedValueOnce({ data: {} })

        render(
            <ZLCInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        // Switch to dispute mode
        const flagDisputeButton = screen.getByText(/Flag Dispute/i)
        fireEvent.click(flagDisputeButton)

        // Select dispute type
        const disputeTypeSelect = screen.getByRole('combobox')
        fireEvent.change(disputeTypeSelect, { target: { value: 'boundary' } })

        // Enter details
        const detailsTextarea = screen.getByPlaceholderText(/Provide detailed information about the dispute/i)
        fireEvent.change(detailsTextarea, { target: { value: 'Boundary issue with neighbor' } })

        const submitButton = screen.getByText(/Confirm Dispute Flag/i)
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                `/api/applications/${mockSelectedApp.id}/flag_zlc_dispute/`,
                expect.objectContaining({
                    dispute_type: 'boundary',
                    dispute_details: 'Boundary issue with neighbor'
                })
            )
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('validates required fields for dispute', async () => {
        render(
            <ZLCInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const flagDisputeButton = screen.getByText(/Flag Dispute/i)
        fireEvent.click(flagDisputeButton)

        const submitButton = screen.getByText(/Confirm Dispute Flag/i)
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('Please select dispute type and provide details')
        })
    })

    it('handles API error gracefully', async () => {
        axios.post.mockRejectedValueOnce({
            response: { data: { error: 'API Error' } }
        })

        render(
            <ZLCInterface
                selectedApp={mockSelectedApp}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                onError={mockOnError}
            />
        )

        const verifyButton = screen.getByText(/No Disputes - Clear/i)
        fireEvent.click(verifyButton)

        await waitFor(() => {
            expect(mockOnError).toHaveBeenCalledWith('API Error')
        })
    })
})
