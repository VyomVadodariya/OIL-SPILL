import numpy as np

def convert_linear_to_db(image: np.ndarray, min_db: float = -30.0, max_db: float = 0.0) -> np.ndarray:
    """
    Converts linear SAR amplitude/power to decibels (dB) and normalizes to [0, 1].
    
    Args:
        image: Linear scale SAR image array.
        min_db: Minimum dB value for clipping (noise floor).
        max_db: Maximum dB value for clipping.
        
    Returns:
        Normalized image in [0, 1] range.
    """
    # Avoid log of zero
    image_safe = np.clip(image, a_min=1e-10, a_max=None)
    
    # Assuming power scale (if amplitude, it would be 20 * log10)
    img_db = 10 * np.log10(image_safe)
    
    # Clip to desired range
    img_db = np.clip(img_db, min_db, max_db)
    
    # Normalize to [0, 1]
    normalized = (img_db - min_db) / (max_db - min_db)
    
    return normalized

def apply_lee_filter(image: np.ndarray, window_size: int = 5) -> np.ndarray:
    """
    Applies a basic Lee filter for speckle reduction.
    (Placeholder for standard SAR preprocessing pipeline).
    """
    # In a full pipeline, scipy.ndimage or cv2 would be used here.
    # For now, we return the image as-is to keep dependencies minimal if not needed.
    return image

def preprocess_sentinel1_grd(image: np.ndarray, is_db: bool = True) -> np.ndarray:
    """
    Standard preprocessing for Sentinel-1 GRD imagery before feeding to ML model.
    """
    if not is_db:
        image = convert_linear_to_db(image)
    else:
        # If already in dB (like Trujillo), just normalize
        # Assuming typical range -30 to 0 dB
        image = np.clip(image, -30.0, 0.0)
        image = (image - (-30.0)) / (0.0 - (-30.0))
        
    return image.astype(np.float32)
