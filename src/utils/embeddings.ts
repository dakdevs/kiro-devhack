const HUGGINGFACE_MODEL_ID = 'BAAI/bge-base-en-v1.5';

const HUGGINGFACE_API_URL = `https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL_ID}`;

export async function embedOne(input: string): Promise<number[]> {
	console.log('\n\n\n🔄 EMBEDDING GENERATION');
	console.log('📝 Input:', input.substring(0, 50) + '...');
	console.log('🔗 Using HuggingFace API URL:', HUGGINGFACE_API_URL);
	console.log('🔑 API Token available:', !!process.env.HUGGINGFACE_API_TOKEN);

	try {
		const response = await fetch(HUGGINGFACE_API_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
				'content-type': 'application/json',
			},

			body: JSON.stringify({
				inputs: input,
			}),

		});

		console.log('📡 HuggingFace API response status:', response.status);

		if (!response.ok) {
			const errorBody = await response.text();
			console.error('❌ HuggingFace API error body:', errorBody);
			throw new Error(`Hugging face api reqest failed with status ${response.status}: ${errorBody}`);
		}

		const result = await response.json();
		console.log('📊 HuggingFace API result type:', typeof result);
		console.log('📊 HuggingFace API result is array:', Array.isArray(result));
		console.log('📊 HuggingFace API result length:', Array.isArray(result) ? result.length : 'N/A');

		if (result && Array.isArray(result)) {
			// Check if it's a nested array (result[0] is the embedding)
			if (result.length > 0 && Array.isArray(result[0])) {
				console.log('✅ Embedding generated successfully (nested), dimensions:', result[0].length);
				return result[0];
			}
			// Check if it's a direct array (result is the embedding)
			else if (typeof result[0] === 'number') {
				console.log('✅ Embedding generated successfully (direct), dimensions:', result.length);
				return result;
			}
		}

		console.error('❌ Invalid response structure from HuggingFace API:', result);
		throw new Error('Invalid response structure from HuggingFace API.');

	} catch (error) {
		console.error('❌ Failed to get embedding from hugging face', error);
		return []
	}
}

