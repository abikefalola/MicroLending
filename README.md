# Stacks Micro-lending Platform

A decentralized peer-to-peer micro-lending platform built on the Stacks blockchain. This smart contract enables users to request loans, fund loans, and build credit history in a transparent and trustless manner.

## Features

- 🤝 Peer-to-peer lending without intermediaries
- 💳 Credit score system
- 🔒 Secure STX transfers
- 📈 Dynamic interest rate calculation
- 🏦 Loan lifecycle management
- 👥 User balance tracking

## Smart Contract Functions

### For Borrowers

#### Request Loan
```clarity
(request-loan amount interest-rate duration purpose)
```
- Creates a new loan request
- Requirements:
    - Credit score must be >= 600
    - Valid purpose description
    - Reasonable interest rate and duration
- Returns the loan ID upon success

#### Repay Loan
```clarity
(repay-loan loan-id)
```
- Repays an active loan with interest
- Can only be called by the original borrower
- Automatically calculates the total repayment amount

### For Lenders

#### Fund Loan
```clarity
(fund-loan loan-id)
```
- Funds a pending loan request
- Transfers STX from lender to borrower
- Changes loan status to "ACTIVE"

### Read-Only Functions

- `(get-loan loan-id)`: Retrieve loan details
- `(get-credit-score user)`: Check user's credit score
- `(get-user-balance user)`: Get user's current balance

### Administrative Functions

#### Update Credit Score
```clarity
(update-credit-score user new-score)
```
- Only callable by contract owner
- Updates user's credit score based on repayment history

## Data Structures

### Loans Map
Stores all loan information:
- Borrower address
- Loan amount
- Interest rate
- Duration
- Start and end block heights
- Status (PENDING, ACTIVE, REPAID)
- Purpose
- Borrower's credit score

### Credit Scores Map
Maintains user credit scores:
- User principal
- Credit score value

### User Balances Map
Tracks user balances:
- User principal
- Current balance

## Error Codes

- `u100`: Owner-only function called by non-owner
- `u101`: Insufficient balance
- `u102`: Loan not found
- `u103`: Unauthorized access
- `u104`: Loan already funded
- `u105`: Credit score too low

## Getting Started

1. Deploy the contract to the Stacks blockchain
2. Initialize credit scores for users
3. Users can begin requesting loans
4. Lenders can browse and fund loan requests
5. Monitor loan statuses and repayments

## Security Considerations

- All transfers are protected with balance checks
- Only contract owner can update credit scores
- Loan repayments are enforced through smart contract logic
- Credit score requirements prevent high-risk lending

## Future Improvements

- Implement collateralized loans
- Add loan refinancing options
- Create a liquidation mechanism
- Implement a governance system
- Add multiple token support
- Develop a reputation system

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements.

## Disclaimer

This is a smart contract for educational and experimental purposes. Use at your own risk. Always audit smart contracts before deploying them to mainnet.
