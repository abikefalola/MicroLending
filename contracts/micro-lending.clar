;; micro-lending
;; A peer-to-peer micro-lending platform on Stacks blockchain

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-insufficient-balance (err u101))
(define-constant err-loan-not-found (err u102))
(define-constant err-unauthorized (err u103))
(define-constant err-already-funded (err u104))

;; Data Maps
(define-map Loans
    { loan-id: uint }
    {
        borrower: principal,
        amount: uint,
        interest-rate: uint,
        duration: uint,
        start-height: uint,
        end-height: uint,
        status: (string-ascii 20),
        purpose: (string-ascii 50),
        credit-score: uint
    }
)
