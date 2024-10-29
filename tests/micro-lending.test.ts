import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  Client,
  Provider,
  ProviderRegistry,
  Result,
} from '@stacks/transactions';
import { principalCV, uintCV, stringAsciiCV } from '@stacks/transactions/dist/clarity/types/principalCV';

// Mock contract details
const CONTRACT_NAME = 'micro-lending';
const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const DEPLOYER_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const BORROWER_ADDRESS = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
const LENDER_ADDRESS = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';

// Mock provider
const provider = {
  makeContract: vi.fn(),
  makeReadOnlyCall: vi.fn(),
};

describe('Micro-lending Contract Tests', () => {
  let client: Client;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup client
    client = new Client(provider as any);
    ProviderRegistry.registerProvider(provider);
  });
  
  describe('Request Loan', () => {
    test('should successfully create a loan request', async () => {
      const amount = uintCV(1000);
      const interestRate = uintCV(500); // 5%
      const duration = uintCV(144); // ~1 day in blocks
      const purpose = stringAsciiCV('Business expansion');
      
      // Mock credit score check
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: { score: uintCV(700) },
      });
      
      // Mock the contract call
      provider.makeContract.mockReturnValueOnce({
        callPublic: vi.fn().mockResolvedValueOnce({
          success: true,
          value: uintCV(0), // First loan ID
        }),
      });
      
      const result = await client.callPublic(CONTRACT_ADDRESS, CONTRACT_NAME, 'request-loan', [
        amount,
        interestRate,
        duration,
        purpose,
      ]);
      
      expect(result.success).toBe(true);
      expect(result.value).toEqual(uintCV(0));
    });
    
    test('should fail if credit score is too low', async () => {
      // Mock low credit score
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: { score: uintCV(500) },
      });
      
      const amount = uintCV(1000);
      const interestRate = uintCV(500);
      const duration = uintCV(144);
      const purpose = stringAsciiCV('Business expansion');
      
      await expect(
          client.callPublic(CONTRACT_ADDRESS, CONTRACT_NAME, 'request-loan', [
            amount,
            interestRate,
            duration,
            purpose,
          ])
      ).rejects.toThrow();
    });
  });
  
  describe('Fund Loan', () => {
    test('should successfully fund a pending loan', async () => {
      const loanId = uintCV(0);
      
      // Mock loan data
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: {
          borrower: principalCV(BORROWER_ADDRESS),
          amount: uintCV(1000),
          status: stringAsciiCV('PENDING'),
        },
      });
      
      // Mock the funding transaction
      provider.makeContract.mockReturnValueOnce({
        callPublic: vi.fn().mockResolvedValueOnce({
          success: true,
        }),
      });
      
      const result = await client.callPublic(CONTRACT_ADDRESS, CONTRACT_NAME, 'fund-loan', [
        loanId,
      ]);
      
      expect(result.success).toBe(true);
    });
    
    test('should fail to fund an already funded loan', async () => {
      const loanId = uintCV(0);
      
      // Mock already funded loan
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: {
          status: stringAsciiCV('ACTIVE'),
        },
      });
      
      await expect(
          client.callPublic(CONTRACT_ADDRESS, CONTRACT_NAME, 'fund-loan', [loanId])
      ).rejects.toThrow();
    });
  });
  
  describe('Repay Loan', () => {
    test('should successfully repay a loan', async () => {
      const loanId = uintCV(0);
      
      // Mock loan data
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: {
          borrower: principalCV(BORROWER_ADDRESS),
          amount: uintCV(1000),
          interestRate: uintCV(500),
          duration: uintCV(144),
          status: stringAsciiCV('ACTIVE'),
        },
      });
      
      // Mock the repayment transaction
      provider.makeContract.mockReturnValueOnce({
        callPublic: vi.fn().mockResolvedValueOnce({
          success: true,
        }),
      });
      
      const result = await client.callPublic(CONTRACT_ADDRESS, CONTRACT_NAME, 'repay-loan', [
        loanId,
      ]);
      
      expect(result.success).toBe(true);
    });
    
    test('should fail if caller is not the borrower', async () => {
      const loanId = uintCV(0);
      
      // Mock loan data with different borrower
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: {
          borrower: principalCV(LENDER_ADDRESS), // Different address
          status: stringAsciiCV('ACTIVE'),
        },
      });
      
      await expect(
          client.callPublic(CONTRACT_ADDRESS, CONTRACT_NAME, 'repay-loan', [loanId])
      ).rejects.toThrow();
    });
  });
  
  describe('Credit Score Management', () => {
    test('should successfully update credit score as contract owner', async () => {
      const user = principalCV(BORROWER_ADDRESS);
      const newScore = uintCV(750);
      
      // Mock the contract owner check
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: principalCV(DEPLOYER_ADDRESS),
      });
      
      // Mock the update transaction
      provider.makeContract.mockReturnValueOnce({
        callPublic: vi.fn().mockResolvedValueOnce({
          success: true,
        }),
      });
      
      const result = await client.callPublic(CONTRACT_ADDRESS, CONTRACT_NAME, 'update-credit-score', [
        user,
        newScore,
      ]);
      
      expect(result.success).toBe(true);
    });
    
    test('should fail to update credit score as non-owner', async () => {
      const user = principalCV(BORROWER_ADDRESS);
      const newScore = uintCV(750);
      
      // Mock non-owner check
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: principalCV(BORROWER_ADDRESS), // Different address than deployer
      });
      
      await expect(
          client.callPublic(CONTRACT_ADDRESS, CONTRACT_NAME, 'update-credit-score', [
            user,
            newScore,
          ])
      ).rejects.toThrow();
    });
  });
  
  describe('Read-Only Functions', () => {
    test('should get loan details', async () => {
      const loanId = uintCV(0);
      const mockLoanData = {
        borrower: principalCV(BORROWER_ADDRESS),
        amount: uintCV(1000),
        interestRate: uintCV(500),
        duration: uintCV(144),
        status: stringAsciiCV('ACTIVE'),
        purpose: stringAsciiCV('Business expansion'),
        creditScore: uintCV(700),
      };
      
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: mockLoanData,
      });
      
      const result = await client.callReadOnly(CONTRACT_ADDRESS, CONTRACT_NAME, 'get-loan', [
        loanId,
      ]);
      
      expect(result.data).toEqual(mockLoanData);
    });
    
    test('should get credit score', async () => {
      const user = principalCV(BORROWER_ADDRESS);
      const mockScore = {
        score: uintCV(700),
      };
      
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: mockScore,
      });
      
      const result = await client.callReadOnly(CONTRACT_ADDRESS, CONTRACT_NAME, 'get-credit-score', [
        user,
      ]);
      
      expect(result.data).toEqual(mockScore);
    });
    
    test('should get user balance', async () => {
      const user = principalCV(BORROWER_ADDRESS);
      const mockBalance = {
        balance: uintCV(5000),
      };
      
      provider.makeReadOnlyCall.mockResolvedValueOnce({
        data: mockBalance,
      });
      
      const result = await client.callReadOnly(CONTRACT_ADDRESS, CONTRACT_NAME, 'get-user-balance', [
        user,
      ]);
      
      expect(result.data).toEqual(mockBalance);
    });
  });
});
