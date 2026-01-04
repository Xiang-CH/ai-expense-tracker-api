import { Client } from '@notionhq/client'
import { Expense } from './schema'

async function getNotion(userId: string): Promise<{ notionClient: Client; dataSourceId: string }> {
  const users = process.env.USER_INFO
  if (!users) {
    throw new Error('USER_INFO is not defined in environment variables')
  }
  const userData = JSON.parse(users)[userId]

  if (!userData) {
    throw new Error(`No Notion integration found for userId: ${userId}`)
  }

  const notion = new Client({
    auth: userData.notionApiKey,
  })

  return {
    notionClient: notion,
    dataSourceId: userData.dataSourceId,
  }
}

export async function addToNotion(userId: string, expense: Expense) {
  const { notionClient, dataSourceId } = await getNotion(userId)

  const properties: any = {
    'Merchant Name': {
      rich_text: [
        {
          text: {
            content: expense.merchantName,
          },
        },
      ],
    },
    Amount: {
      number: expense.amount,
    },
    Currency: {
      select: {
        name: expense.currency,
      },
    },
    Datetime: {
      date: expense.datetime ? { start: expense.datetime } : null,
    },
    Category: {
      select: expense.category ? { name: expense.category } : null,
    },
    'Payment Method': {
      select: expense.paymentMethod ? { name: expense.paymentMethod } : null,
    },
    'Payment Platform': {
      select: {
        name: expense.paymentPlatform,
      },
    },
    Items: {
      rich_text: [
        {
          text: {
            content: expense.items || '',
          },
        },
      ],
    },
    Notes: {
      rich_text: [
        {
          text: {
            content: expense.notes || '',
          },
        },
      ],
    },
  }

  try {
    await notionClient.pages.create({
      parent: { data_source_id: dataSourceId },
      properties,
    })
  } catch (error) {
    // If error is due to missing properties, try to create them first
    if (error instanceof Error && error.message.includes('property')) {
      try {
        // Update database schema with required properties
        await createDatabaseProperties(notionClient, dataSourceId)
        // Retry creating the page
        await notionClient.pages.create({
          parent: { data_source_id: dataSourceId },
          properties,
        })
      } catch (retryError) {
        console.error('Failed to create database properties or page:', retryError)
        throw retryError
      }
    } else {
      throw error
    }
  }
}

async function createDatabaseProperties(notionClient: Client, databaseId: string) {
  await notionClient.dataSources.update({
    data_source_id: databaseId,
    properties: {
      'Merchant Name': { rich_text: {} },
      Amount: { number: {} },
      Currency: { select: {} },
      Datetime: { date: {} },
      Category: { select: {} },
      'Payment Method': { select: {} },
      'Payment Platform': { select: {} },
      Items: { rich_text: {} },
      Notes: { rich_text: {} },
    },
  })
}
