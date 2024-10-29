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

(define-map UserBalances
    { user: principal }
    { balance: uint }
)

(define-map CreditScores
    { user: principal }
    { score: uint }
)

;; Data Variables
(define-data-var loan-nonce uint u0)

;; Private Functions
(define-private (transfer-stx (amount uint) (sender principal) (recipient principal))
    (if (>= (stx-get-balance sender) amount)
        (try! (stx-transfer? amount sender recipient))
        err-insufficient-balance
    )
)
