export interface InferenceResult {
  status: string;
  source: {
    filename: string;
    width: number;
    height: number;
    crs: string;
    bands: number;
  };
  model: {
    checkpoint: string;
    architecture: string;
    input_channels: number;
  };
  inference: {
    tile_size: number;
    stride: number;
    threshold: number;
    device: string;
  };
  detection: {
    oil_spill_detected: boolean;
    object_count: number;
  };
  objects: any[]; // Using any for simplicity in this integration
  output_mask?: string;
}

export const runInference = async (file: File): Promise<InferenceResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/v1/inference', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Failed to run inference';
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMessage = errorData.detail;
    } catch (e) {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
