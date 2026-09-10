import numpy as np

# SYNTHETIC TEST FIXTURE — NOT REAL SAR DATA

def get_single_compact_spill() -> np.ndarray:
    """
    Creates a 100x100 mask with a 20x20 square in the center.
    Area: 400 pixels
    Bounding Box: (40, 40, 60, 60)
    Centroid: (49.5, 49.5)
    """
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[40:60, 40:60] = 1
    return mask

def get_elongated_spill() -> np.ndarray:
    """
    Creates a 100x100 mask with an elongated 10x40 rectangle.
    Area: 400 pixels
    Bounding Box: (30, 45, 70, 55)
    Centroid: (49.5, 49.5)
    """
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[30:70, 45:55] = 1
    return mask

def get_fragmented_spills() -> np.ndarray:
    """
    Creates a 100x100 mask with two separate 10x10 squares.
    Object 1: (10, 10, 20, 20) -> Area 100
    Object 2: (70, 70, 80, 80) -> Area 100
    """
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[10:20, 10:20] = 1
    mask[70:80, 70:80] = 1
    return mask

def get_noisy_spill() -> np.ndarray:
    """
    Creates a mask with one 20x20 valid object and a few 1x1 noise pixels.
    Noise should be removed by processing.
    """
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[40:60, 40:60] = 1
    
    # Noise pixels
    mask[10, 10] = 1
    mask[90, 80] = 1
    mask[5, 95] = 1
    return mask

def get_empty_mask() -> np.ndarray:
    """
    Creates a 100x100 empty mask.
    """
    return np.zeros((100, 100), dtype=np.uint8)
