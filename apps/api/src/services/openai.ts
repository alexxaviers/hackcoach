import fetch from 'node-fetch';

export async function generateAssistantReply({ systemPrompt, memoryBlock, messages }: {systemPrompt: string, memoryBlock?: string, messages: {role:string,content:string}[]}){
  const apiKey = process.env.OPENAI_API_KEY;
  if(!apiKey) throw new Error('OpenAI API key not set');

  const systemMsgs = [{role:'system', content: systemPrompt}];
  if(memoryBlock) systemMsgs.push({role:'system', content: memoryBlock});

  const payload = {
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    messages: [ ...systemMsgs, ...messages.slice(-20) ],
    max_tokens: 600,
    temperature: 0.7
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  return text;
}
