import 'dotenv/config';
import OpenAI from 'openai';

const qwenClient = new OpenAI({
	apiKey: process.env.DASHSCOPE_API_KEY,
	baseURL: 'https://dashscope-intl.aliyunics.com/compatible-mode/v1',
});


export async function embedOne(
	input: string,
	model = 'Qwen/Qwen3-Embedding-0.6B'
):Proomise<number[]> {
	const response = await qwenClient.embeddings.create({model, input});
	return response.data[0].embedding;
}
