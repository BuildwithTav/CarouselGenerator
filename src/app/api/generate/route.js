import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('KEY EXISTS:', !!process.env.ANTHROPIC_API_KEY);
  try {
    const body = await request.json();
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    console.log('Anthropic response status:', response.status);
    console.log('Anthropic response body:', text);
    
    return NextResponse.json({ status: response.status, body: text });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
