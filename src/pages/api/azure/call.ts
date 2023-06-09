import type { NextApiRequest, NextApiResponse } from 'next'
import { modelGPT35Turbo } from './common'

export default async function AzureCall(req: NextApiRequest, res: NextApiResponse<any>) {
    // res.status(200).json({ name: 'John Doe' })
    console.log(`model===>`, modelGPT35Turbo)
    if (req.method === 'POST') {
        const modelResult = await modelGPT35Turbo.call(
            'What would be a good company name a company that makes colorful socks?',
            { timeout: 10000 }
        )
        console.log(`${req.method}`, { modelResult })
        return res.status(200).json({ modelResult })
    }
    if (req.method === 'GET') {
        const modelResult = await modelGPT35Turbo.call(
            'What would be a good company name a company that makes colorful socks?',
            {
                timeout: 30000,
            }
        )
        console.log(`AzureCall`, { modelResult })
        return res.status(200).json({ modelResult })
    }
}
