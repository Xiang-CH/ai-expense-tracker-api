import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

import { generateText, UserModelMessage, Output } from 'ai'
import { encodeBase64 } from 'hono/utils/encode'
import { ExpenseSchema } from '../lib/schema'
import { addToNotion } from '../lib/addToNotion'

import { NodeSDK } from '@opentelemetry/sdk-node'
import { LangfuseSpanProcessor } from '@langfuse/otel'

const telemetry = new NodeSDK({
  spanProcessors: [new LangfuseSpanProcessor()],
})

const app = new Hono()
telemetry.start()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables')
}

app.use('/api/*', jwt({ secret: process.env.JWT_SECRET }))

app.post('/api/track', async (c) => {
  const data = await c.req.formData()
  if (!data) {
    return c.json({ error: 'No data provided' }, 400)
  }

  const userId = c.get('jwtPayload')?.userId
  if (!userId) {
    return c.json({ error: 'Invalid JWT' }, 401)
  }

  const image = data.get('image') as Blob
  if (!image) {
    return c.json({ error: 'No image provided' }, 400)
  }

  const userMessage: UserModelMessage = {
    role: 'user',
    content: [
      {
        type: 'text',
        text: `Today is ${new Date().toISOString().split('T')[0]}.`,
      },
      {
        type: 'image',
        image: encodeBase64(await image.arrayBuffer()),
      },
    ],
  }

  try {
    const result = await generateText({
      model: 'openai/gpt-5-mini',
      system: `You are an AI expense tracker. Extract information from the receipt image or payment screenshot provided by the user. Be accurate and extract all visible details.`,
      prompt: [userMessage],
      output: Output.object({
        schema: ExpenseSchema,
      }),
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'track',
        metadata: {
          userId,
          isDev: process.env.NODE_ENV === 'development',
        },
      },
    })

    console.log('Extracted expense data:', result.output)

    try {
      await addToNotion(userId, result.output)
    } catch (error) {
      console.error('Error adding expense to Notion:', error)
      return c.json(
        {
          success: false,
          error: 'Failed to add expense to Notion. Please check your Notion integration settings.',
        },
        500
      )
    }

    return c.json({
      success: true,
      data: result.output,
    })
  } catch (error) {
    console.error('Error processing image:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to process the image. Please try again.',
      },
      500
    )
  }
})

export default app
