import os
from pathlib import Path
from typing import List, Dict, Tuple, Callable
import random

def default_scene_extractor(filename: str) -> str:
    """
    Extracts a parent scene ID from a patch filename.
    By default, if filename is like 'S1A_IW_GRDH_..._patch_01.tif', 
    it extracts the 'S1A_IW_GRDH_...' part.
    If no recognizable pattern, falls back to the whole filename.
    """
    if "_patch_" in filename:
        return filename.split("_patch_")[0]
    # For Trujillo dataset where files are like 00642.tif, we can't easily infer parent scenes.
    # In a real scenario with Trujillo, we use their explicit Part I vs Part III splits.
    # Here we return the filename itself as a fallback.
    return filename

def create_leakage_safe_splits(
    image_dir: str, 
    val_ratio: float = 0.2, 
    test_ratio: float = 0.1, 
    seed: int = 42,
    scene_extractor: Callable[[str], str] = default_scene_extractor
) -> Tuple[List[str], List[str], List[str]]:
    """
    Splits image filenames into train, validation, and test sets strictly by parent scene.
    This prevents data leakage where patches from the same SAR scene end up in both 
    train and test sets.
    
    Returns:
        Tuple of (train_files, val_files, test_files)
    """
    image_dir_path = Path(image_dir)
    if not image_dir_path.exists():
        return [], [], []
        
    all_files = [f.name for f in image_dir_path.glob('*.tif*')]
    
    # Group files by parent scene
    scenes_dict: Dict[str, List[str]] = {}
    for fname in all_files:
        scene_id = scene_extractor(fname)
        if scene_id not in scenes_dict:
            scenes_dict[scene_id] = []
        scenes_dict[scene_id].append(fname)
        
    # Shuffle scenes, not patches
    unique_scenes = list(scenes_dict.keys())
    random.seed(seed)
    random.shuffle(unique_scenes)
    
    n_scenes = len(unique_scenes)
    test_count = max(1, int(n_scenes * test_ratio)) if n_scenes > 0 else 0
    val_count = max(1, int(n_scenes * val_ratio)) if n_scenes > 0 else 0
    
    test_scenes = unique_scenes[:test_count]
    val_scenes = unique_scenes[test_count:test_count+val_count]
    train_scenes = unique_scenes[test_count+val_count:]
    
    train_files, val_files, test_files = [], [], []
    
    for scene in train_scenes:
        train_files.extend(scenes_dict[scene])
    for scene in val_scenes:
        val_files.extend(scenes_dict[scene])
    for scene in test_scenes:
        test_files.extend(scenes_dict[scene])
        
    return train_files, val_files, test_files

def save_split_manifest(train_files: List[str], val_files: List[str], test_files: List[str], out_dir: str):
    """Saves the splits to text files for reproducibility."""
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    with open(out_path / "train_split.txt", "w") as f:
        f.write("\n".join(train_files))
    with open(out_path / "val_split.txt", "w") as f:
        f.write("\n".join(val_files))
    with open(out_path / "test_split.txt", "w") as f:
        f.write("\n".join(test_files))
