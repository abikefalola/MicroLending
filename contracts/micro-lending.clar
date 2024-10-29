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

(define-private (calculate-repayment-amount (principal uint) (interest-rate uint) (duration uint))
    (let (
        (interest-amount (/ (* principal (* interest-rate duration)) u10000))
    )
    (+ principal interest-amount))
)

;; Public Functions
(define-public (request-loan (amount uint) (interest-rate uint) (duration uint) (purpose (string-ascii 50)))
    (let (
        (loan-id (var-get loan-nonce))
        (credit-score (default-to u0 (get score (map-get? CreditScores {user: tx-sender}))))
    )
    (try! (asserts! (>= credit-score u600) (err u105)))
    (map-set Loans
        {loan-id: loan-id}
        {
            borrower: tx-sender,
            amount: amount,
            interest-rate: interest-rate,
            duration: duration,
            start-height: block-height,
            end-height: (+ block-height duration),
            status: "PENDING",
            purpose: purpose,
            credit-score: credit-score
        }
    )
    (var-set loan-nonce (+ loan-id u1))
    (ok loan-id))
)

(define-public (fund-loan (loan-id uint))
    (let (
        (loan (unwrap! (map-get? Loans {loan-id: loan-id}) err-loan-not-found))
        (amount (get amount loan))
    )
    (asserts! (is-eq (get status loan) "PENDING") err-already-funded)
    (try! (transfer-stx amount tx-sender (get borrower loan)))
    (map-set Loans
        {loan-id: loan-id}
        (merge loan {status: "ACTIVE"})
    )
    (ok true))
)

(define-public (repay-loan (loan-id uint))
    (let (
        (loan (unwrap! (map-get? Loans {loan-id: loan-id}) err-loan-not-found))
        (repayment-amount (calculate-repayment-amount
            (get amount loan)
            (get interest-rate loan)
            (get duration loan)))
    )
    (asserts! (is-eq (get borrower loan) tx-sender) err-unauthorized)
    (try! (transfer-stx repayment-amount tx-sender contract-owner))
    (map-set Loans
        {loan-id: loan-id}
        (merge loan {status: "REPAID"})
    )
    (ok true))
)
