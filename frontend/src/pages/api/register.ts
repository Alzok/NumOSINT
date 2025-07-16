import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.INTERNAL_API_URL || 'http://localhost:5001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return res.status(backendRes.status).json(data);
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('Register API route error:', error);
    return res.status(500).json({ message: 'An internal server error occurred' });
  }
}