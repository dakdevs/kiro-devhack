const HUGGINGFACE_MODEL_ID = 'BAAI/bge-base-en-v1.5';

const HUGGINGFACE_API_URL =  `https://api-inference.huggingface.co/pipeline/feature-extraction/${HUGGINGFACE_MODEL_ID}`;

export async function embedOne(input: string): Promise<number[]> {
	try{
		const response = await fetch(HUGGINGFACE_API_URL,{
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
				'content-type': 'application/json',
			},

			body: JSON.stringify({
				inputs: input,
			}),

		});

		if (!response.ok){
			const errorBody = await response.text();
			throw new Error(`Hugging face api reqest failed with status ${response.status}: ${errorBody}`);
		}

		const result = await response.json();

		if (result && Array.isArray(result) && result.length > 0){
			return result[0];
		}else {
			throw new Error ('Invalud response strucutre from HuggingFace api.');
		}

	} catch (error) {
		console.error('Failed to get embedding from hugging face', error);
		return []
	}
}

