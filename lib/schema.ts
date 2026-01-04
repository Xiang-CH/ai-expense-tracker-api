import { z } from 'zod'

// Define the expense schema
export const ExpenseSchema = z.object({
  merchantName: z.string().describe('Name of the merchant or vendor'),
  amount: z.number().describe('Total amount of the expense'),
  currency: z.string().describe('Currency code (e.g., HKD, CNY, USD), Default is HKD'),
  datetime: z.iso
    .datetime()
    .nullable()
    .describe('Datetime of the transaction (ISO format or as shown on receipt)'),
  category: z
    .enum([
      'Food',
      'Transportation',
      'Entertainment',
      'Shopping',
      'Utilities',
      'Rent',
      'Education',
      'Healthcare',
      'Travel',
      'Other',
    ])
    .nullable()
    .describe('Category of expense (e.g., Food, Transportation, Entertainment)'),
  items: z.string().nullable().describe('List of items purchased, if available'),
  paymentMethod: z
    .enum([
      'Cash',
      'Credit Card',
      'Debit Card',
      'Alipay Wallet',
      'WeChat Wallet',
      '余额宝',
      '零钱通',
      'Other',
    ])
    .nullable()
    .describe('Payment method used (e.g., Cash, Credit Card)'),
  paymentPlatform: z
    .enum(['Alipay', 'WeChat Pay', 'Apple Pay', 'Stripe', 'N/A', 'Other'])
    .describe('Platform used for payment (e.g., Alipay, WeChat Pay)'),
  notes: z
    .string()
    .nullable()
    .describe(
      'Any additional notes or observations, **keep it empty**, unless if there are information not captured in the fields above'
    ),
})

export type Expense = z.infer<typeof ExpenseSchema>
