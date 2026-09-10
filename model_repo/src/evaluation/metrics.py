import torch

def calculate_metrics(preds: torch.Tensor, targets: torch.Tensor, threshold: float = 0.5) -> dict:
    """
    Calculates Dice, IoU, Precision, Recall, and False Positive Rate for binary segmentation.
    
    Args:
        preds: Predicted probabilities (B, C, H, W).
        targets: Ground truth masks (B, C, H, W).
        threshold: Threshold for binarizing predictions.
        
    Returns:
        Dictionary of metrics.
    """
    preds_bin = (preds > threshold).float()
    
    # Flatten tensors
    preds_flat = preds_bin.view(-1)
    targets_flat = targets.view(-1)
    
    # Calculate True Positives, False Positives, False Negatives, True Negatives
    tp = torch.sum(preds_flat * targets_flat)
    fp = torch.sum(preds_flat * (1 - targets_flat))
    fn = torch.sum((1 - preds_flat) * targets_flat)
    tn = torch.sum((1 - preds_flat) * (1 - targets_flat))
    
    # Dice Coefficient
    dice = (2.0 * tp) / (2.0 * tp + fp + fn + 1e-7)
    
    # Intersection over Union (IoU)
    iou = tp / (tp + fp + fn + 1e-7)
    
    # Precision
    precision = tp / (tp + fp + 1e-7)
    
    # Recall (Sensitivity)
    recall = tp / (tp + fn + 1e-7)
    
    # False Positive Rate
    fpr = fp / (fp + tn + 1e-7)
    
    return {
        "dice": dice.item(),
        "iou": iou.item(),
        "precision": precision.item(),
        "recall": recall.item(),
        "fpr": fpr.item()
    }

class AverageMeter:
    """Computes and stores the average and current value"""
    def __init__(self):
        self.reset()

    def reset(self):
        self.val = 0
        self.avg = 0
        self.sum = 0
        self.count = 0

    def update(self, val, n=1):
        self.val = val
        self.sum += val * n
        self.count += n
        self.avg = self.sum / self.count
