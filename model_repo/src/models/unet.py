import torch
import torch.nn as nn
import segmentation_models_pytorch as smp

def create_unet_model(
    encoder_name: str = "resnet34",
    encoder_weights: str = "imagenet",
    in_channels: int = 1,
    classes: int = 1,
    activation: str = None
) -> nn.Module:
    """
    Creates a U-Net architecture using segmentation_models_pytorch.
    
    Args:
        encoder_name: Name of the encoder backbone (e.g., 'resnet34', 'efficientnet-b4').
        encoder_weights: Pre-trained weights to use (default: 'imagenet').
        in_channels: Number of input channels (1 for standard SAR VV).
        classes: Number of output classes (1 for binary Oil vs Background).
        activation: Activation function for the last layer (e.g., 'sigmoid' for binary).
        
    Returns:
        PyTorch model.
    """
    model = smp.Unet(
        encoder_name=encoder_name,
        encoder_weights=encoder_weights,
        in_channels=in_channels,
        classes=classes,
        activation=activation
    )
    
    return model
