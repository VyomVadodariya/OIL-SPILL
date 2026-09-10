import os
import argparse
import json
import logging
import random
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from pathlib import Path
from tqdm import tqdm
import time
import numpy as np

from src.data.dataset import GulfOfMexicoPatchDataset, TestSceneDataset, get_training_transforms, get_validation_transforms
from src.models.unet import create_unet_model
from src.evaluation.metrics import calculate_metrics, AverageMeter

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def compute_pos_weight(dataset, num_samples=1000):
    """Estimate pos_weight for BCEWithLogitsLoss from training dataset."""
    logging.info(f"Estimating class imbalance from up to {num_samples} samples...")
    pos_pixels = 0
    neg_pixels = 0
    
    indices = list(range(len(dataset)))
    random.shuffle(indices)
    
    for i in tqdm(indices[:num_samples], desc="Computing pos_weight"):
        _, mask = dataset[i]
        pos_pixels += mask.sum().item()
        neg_pixels += (mask == 0).sum().item()
        
    if pos_pixels == 0:
        return torch.tensor([1.0])
        
    weight = neg_pixels / pos_pixels
    logging.info(f"Estimated pos_weight: {weight:.2f}")
    return torch.tensor([weight])

def evaluate(model, dataloader, criterion, device):
    model.eval()
    losses = AverageMeter()
    metrics_sum = {"dice": 0, "iou": 0, "precision": 0, "recall": 0}
    num_batches = 0
    
    with torch.no_grad():
        for images, masks in dataloader:
            images, masks = images.to(device), masks.to(device)
            outputs = model(images)
            
            loss = criterion(outputs, masks)
            losses.update(loss.item(), images.size(0))
            
            # Use sigmoid for metrics
            preds = torch.sigmoid(outputs)
            batch_metrics = calculate_metrics(preds, masks, threshold=0.5)
            
            for k in metrics_sum.keys():
                metrics_sum[k] += batch_metrics[k]
            num_batches += 1
            
    avg_metrics = {k: v / num_batches for k, v in metrics_sum.items()}
    avg_metrics["loss"] = losses.avg
    return avg_metrics

def evaluate_test_scenes(model, test_dir, mask_dir, device):
    """Evaluate full test scenes using TestSceneDataset grid extraction."""
    logging.info("Evaluating on held-out test scenes...")
    model.eval()
    
    test_images = sorted(list(Path(test_dir).glob("*.tif*")))
    metrics_sum = {"dice": 0, "iou": 0, "precision": 0, "recall": 0}
    scene_metrics = {}
    
    for img_path in test_images:
        mask_path = Path(mask_dir) / img_path.name
        if not mask_path.exists():
            continue
            
        dataset = TestSceneDataset(str(img_path), str(mask_path))
        dataloader = DataLoader(dataset, batch_size=16, shuffle=False)
        
        scene_metric_sum = {"dice": 0, "iou": 0, "precision": 0, "recall": 0}
        num_batches = 0
        
        with torch.no_grad():
            for images, masks in dataloader:
                images, masks = images.to(device), masks.to(device)
                outputs = model(images)
                preds = torch.sigmoid(outputs)
                
                b_metrics = calculate_metrics(preds, masks, threshold=0.5)
                for k in scene_metric_sum.keys():
                    scene_metric_sum[k] += b_metrics[k]
                num_batches += 1
                
        if num_batches > 0:
            avg_scene = {k: v / num_batches for k, v in scene_metric_sum.items()}
            scene_metrics[img_path.name] = avg_scene
            
            for k in metrics_sum.keys():
                metrics_sum[k] += avg_scene[k]
                
    if len(scene_metrics) > 0:
        overall_avg = {k: v / len(scene_metrics) for k, v in metrics_sum.items()}
    else:
        overall_avg = metrics_sum
        
    return overall_avg, scene_metrics

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--data_root", type=str, default="data/processed/gulf_of_mexico")
    parser.add_argument("--smoke_test", action="store_true")
    args = parser.parse_args()
    
    set_seed(args.seed)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logging.info(f"Using device: {device}")
    
    data_root = Path(args.data_root)
    train_csv = data_root / "train" / "dataframe_train_dataset_256_90.csv"
    val_csv = data_root / "train" / "dataframe_val_dataset_256_90.csv"
    
    train_imgs = data_root / "train" / "images"
    train_masks = data_root / "train" / "masks"
    
    test_imgs = data_root / "test" / "images"
    test_masks = data_root / "test" / "masks"
    
    # Init datasets
    train_dataset = GulfOfMexicoPatchDataset(
        str(train_csv), str(train_imgs), str(train_masks), 
        transform=get_training_transforms()
    )
    val_dataset = GulfOfMexicoPatchDataset(
        str(val_csv), str(train_imgs), str(train_masks), 
        transform=get_validation_transforms()
    )
    
    if args.smoke_test:
        train_dataset.samples = train_dataset.samples[:32]
        val_dataset.samples = val_dataset.samples[:32]
        args.epochs = 1
        
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
    
    # Calculate class imbalance
    pos_weight = compute_pos_weight(train_dataset, num_samples=100 if args.smoke_test else 1000)
    pos_weight = pos_weight.to(device)
    
    model = create_unet_model().to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)
    
    # Setup artifact dirs
    os.makedirs("models", exist_ok=True)
    os.makedirs("reports", exist_ok=True)
    
    best_val_dice = -1.0
    history = []
    
    logging.info(f"Starting training for {args.epochs} epochs. Train samples: {len(train_dataset)}, Val samples: {len(val_dataset)}")
    
    start_time = time.time()
    for epoch in range(args.epochs):
        model.train()
        train_losses = AverageMeter()
        
        pbar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{args.epochs} [Train]")
        for images, masks in pbar:
            images, masks = images.to(device), masks.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, masks)
            loss.backward()
            optimizer.step()
            
            train_losses.update(loss.item(), images.size(0))
            pbar.set_postfix({"loss": f"{train_losses.avg:.4f}"})
            
        val_metrics = evaluate(model, val_loader, criterion, device)
        logging.info(f"Epoch {epoch+1} Val - Loss: {val_metrics['loss']:.4f}, Dice: {val_metrics['dice']:.4f}, IoU: {val_metrics['iou']:.4f}")
        
        epoch_hist = {
            "epoch": epoch + 1,
            "train_loss": train_losses.avg,
            "val_metrics": val_metrics
        }
        history.append(epoch_hist)
        
        if val_metrics["dice"] > best_val_dice:
            best_val_dice = val_metrics["dice"]
            torch.save(model.state_dict(), "models/best_model.pth")
            logging.info(f"Saved new best model (Dice: {best_val_dice:.4f})")
            
    total_time = time.time() - start_time
    logging.info(f"Training completed in {total_time:.2f}s")
    
    torch.save(model.state_dict(), "models/last_model.pth")
    
    # Load best model for testing
    if os.path.exists("models/best_model.pth"):
        model.load_state_dict(torch.load("models/best_model.pth"))
        
    test_overall, test_per_scene = evaluate_test_scenes(model, test_imgs, test_masks, device)
    
    logging.info(f"Test Overall - Dice: {test_overall['dice']:.4f}, IoU: {test_overall['iou']:.4f}")
    
    # Save artifacts
    report = {
        "config": vars(args),
        "class_imbalance": {"pos_weight": pos_weight.item()},
        "history": history,
        "test_overall": test_overall,
        "test_per_scene": test_per_scene
    }
    
    with open("reports/stage2_results.json", "w") as f:
        json.dump(report, f, indent=4)
        
if __name__ == "__main__":
    main()
