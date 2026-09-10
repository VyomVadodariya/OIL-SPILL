import numpy as np
from scipy import ndimage
from typing import Tuple

def process_mask(
    mask: np.ndarray,
    min_area_pixels: int = 0,
    morph_closing_size: int = 0,
    morph_opening_size: int = 0
) -> np.ndarray:
    """
    Process a binary segmentation mask.
    
    Operations in order:
    1. Binarize (ensure boolean)
    2. Morphological Closing (fill small holes in spills)
    3. Morphological Opening (remove tiny isolated noise)
    4. Size thresholding (remove connected components smaller than min_area)
    """
    processed = mask > 0
    
    if morph_closing_size > 0:
        structure = np.ones((morph_closing_size, morph_closing_size), dtype=bool)
        processed = ndimage.binary_closing(processed, structure=structure)
        
    if morph_opening_size > 0:
        structure = np.ones((morph_opening_size, morph_opening_size), dtype=bool)
        processed = ndimage.binary_opening(processed, structure=structure)
        
    if min_area_pixels > 0:
        # Label components and filter by size
        labeled_mask, num_features = ndimage.label(processed)
        if num_features > 0:
            sizes = ndimage.sum(processed, labeled_mask, range(1, num_features + 1))
            # Find labels to keep
            labels_to_keep = np.where(sizes >= min_area_pixels)[0] + 1
            # Reconstruct mask
            processed = np.isin(labeled_mask, labels_to_keep)
            
    return processed.astype(np.uint8)

def label_connected_components(mask: np.ndarray) -> Tuple[np.ndarray, int]:
    """
    Label connected components in a binary mask.
    Returns the labeled mask and the number of features found.
    """
    # Ensure binary
    binary_mask = mask > 0
    labeled_mask, num_features = ndimage.label(binary_mask)
    return labeled_mask, num_features
