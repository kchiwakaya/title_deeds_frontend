import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X } from 'lucide-react'

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
    useEffect(() => {
        if (isOpen) {
            // Lock body scroll
            const originalOverflow = document.body.style.overflow
            document.body.style.overflow = 'hidden'

            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') onClose()
            }
            document.addEventListener('keydown', handleEscape)

            return () => {
                document.body.style.overflow = originalOverflow
                document.removeEventListener('keydown', handleEscape)
            }
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    console.log('Modal rendering, isOpen:', isOpen, 'title:', title)
    const modalRoot = document.getElementById('modal-root') || document.body
    console.log('Modal root element:', modalRoot)

    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999999,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideUp {
                    from { transform: translateY(20px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
            `}</style>
            <div
                className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth}`}
                style={{
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    position: 'relative',
                    animation: 'modalSlideUp 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Flag Accent Stripe */}
                <div className="flex h-[4px] w-full overflow-hidden">
                    <div className="flex-1 bg-[#319B42]" />
                    <div className="flex-1 bg-[#FFD200]" />
                    <div className="flex-1 bg-[#DE2010]" />
                    <div className="flex-1 bg-[#000000]" />
                </div>

                {/* Header */}
                <div className="px-6 py-5 bg-emerald-800 flex justify-between items-center sticky top-0 z-10 shadow-lg">
                    <h3 className="text-xl font-extrabold text-white tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all text-white border border-white border-opacity-10 shadow-sm"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>,
        modalRoot
    )
}

export default Modal
