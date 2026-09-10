import os
import torch
from src.models.unet import create_unet_model

# Ensure models directory exists
os.makedirs("models", exist_ok=True)

# Create a dummy model
model = create_unet_model(
    encoder_name="resnet34",
    in_channels=1,
    classes=1,
    activation=None
)

# Save the state dict
torch.save(model.state_dict(), "models/best_model.pth")
print("Dummy model saved to models/best_model.pth")
