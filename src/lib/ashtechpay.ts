// Ashtechpay Payment Integration
// ALL operations go through Supabase Edge Functions for security
// The API key is stored in Supabase Edge Function secrets, NOT in frontend code

import { supabase } from './supabase';
import { COUNTRIES } from './config';

export interface PaymentRequest {
  amount: number;
  currency: string;
  phone: string;
  operator: string;
  country_code: string;
  reference?: string;
  otp?: string;
  notify_url?: string;
  order_id?: string;
}

export interface PaymentResponse {
  type: 'ussd_push' | 'otp_sms' | 'otp_ussd' | 'wave';
  transaction_id?: string;
  wave_url?: string;
  ussd_code?: string;
  otp_required?: boolean;
  message?: string;
  status?: string;
  amount?: number;
  credited_amount?: number;
  fee_amount?: number;
}

export interface TransactionStatus {
  transaction_id: string;
  reference: string;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  credited_amount: number;
  fee_amount: number;
  currency: string;
  phone: string;
  created_at: string;
  confirmed_at?: string;
}

export interface FeeSchedule {
  country_code: string;
  country_name: string;
  currency: string;
  deposit_fee_pct: number;
  withdrawal_fee_pct: number;
  transfer_fee_pct: number;
  total_fee_pct: number;
}

// Get countries from Edge Function (falls back to static data)
export async function getCountries() {
  try {
    const { data, error } = await supabase.functions.invoke('ashtechpay-countries');
    if (error) throw error;
    return data;
  } catch (error) {
    return COUNTRIES;
  }
}

// Get fees from Edge Function
export async function getFees(): Promise<FeeSchedule[]> {
  try {
    const { data, error } = await supabase.functions.invoke('ashtechpay-fees');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching fees:', error);
    return [];
  }
}

// Calculate net amount after fees
export function computeNetAmount(grossAmount: number, countryCode: string, fees: FeeSchedule[]) {
  const fee = fees.find(f => f.country_code === countryCode);
  if (!fee) return { gross: grossAmount, fee: 0, net: grossAmount, fee_pct: 0 };
  const feeAmount = Math.round(grossAmount * fee.total_fee_pct / 100);
  return {
    gross: grossAmount,
    fee: feeAmount,
    net: grossAmount - feeAmount,
    fee_pct: fee.total_fee_pct,
  };
}

// Initiate payment via Edge Function
export async function initiatePayment(params: PaymentRequest): Promise<PaymentResponse> {
  const { data, error } = await supabase.functions.invoke('ashtechpay-collect', {
    body: params,
  });

  if (error) throw new Error(error.message || 'Payment initiation failed');
  if (data.error) throw new Error(data.message || 'Payment failed');

  return data as PaymentResponse;
}

// Check transaction status via Edge Function
export async function getTransactionStatus(transactionId: string): Promise<TransactionStatus> {
  const { data, error } = await supabase.functions.invoke('ashtechpay-status', {
    body: { transaction_id: transactionId },
  });

  if (error) throw new Error('Failed to fetch transaction status');
  return data as TransactionStatus;
}

// Poll transaction status until final
export async function pollTransactionStatus(
  transactionId: string,
  maxAttempts: number = 30,
  intervalMs: number = 5000
): Promise<TransactionStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getTransactionStatus(transactionId);
    if (status.status === 'success' || status.status === 'failed') {
      return status;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error('Transaction status check timed out');
}
