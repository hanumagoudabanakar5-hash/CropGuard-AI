
import json
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms, models
from torchvision.models import MobileNet_V2_Weights


# ==========================================
# 1. CONFIGURATION
# ==========================================

DATASET_PATH = Path(
    r"C:\Users\anith\Downloads\archive\plantvillage dataset\color"
)

OUTPUT_PATH = Path(__file__).resolve().parent

IMAGE_SIZE = 224
BATCH_SIZE = 16
EPOCHS = 10
LEARNING_RATE = 0.0001

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ==========================================
# 2. GPU INFORMATION
# ==========================================

print("\n===================================")
print("       LEAF LOGIC AI TRAINING")
print("===================================")

print("Device:", DEVICE)

if DEVICE.type == "cuda":
    print("GPU:", torch.cuda.get_device_name(0))
    print("GPU Memory:", round(
        torch.cuda.get_device_properties(0).total_memory / 1024**3, 2
    ), "GB")


# ==========================================
# 3. IMAGE TRANSFORMATIONS
# ==========================================

weights = MobileNet_V2_Weights.DEFAULT

mean = weights.transforms().mean
std = weights.transforms().std

train_transform = transforms.Compose([
    transforms.RandomResizedCrop(IMAGE_SIZE),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(
        brightness=0.15,
        contrast=0.15,
        saturation=0.15
    ),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)
])

val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean, std)
])


# ==========================================
# 4. LOAD DATASET
# ==========================================

print("\nLoading PlantVillage dataset...")

if not DATASET_PATH.exists():
    raise FileNotFoundError(
        f"Dataset folder not found: {DATASET_PATH}"
    )

train_full = datasets.ImageFolder(
    DATASET_PATH,
    transform=train_transform
)

val_full = datasets.ImageFolder(
    DATASET_PATH,
    transform=val_transform
)

class_names = train_full.classes
total_images = len(train_full)

if len(class_names) != 38:
    raise ValueError(
        f"Expected 38 categories, found {len(class_names)}"
    )

print("Total images:", total_images)
print("Total categories:", len(class_names))

# Save category names
with open(OUTPUT_PATH / "class_names.json", "w") as file:
    json.dump(class_names, file, indent=4)


# ==========================================
# 5. TRAIN / VALIDATION SPLIT
# ==========================================

torch.manual_seed(42)

indices = torch.randperm(total_images).tolist()

train_count = int(total_images * 0.80)

train_indices = indices[:train_count]
val_indices = indices[train_count:]

train_dataset = Subset(train_full, train_indices)
val_dataset = Subset(val_full, val_indices)

print("\nTraining images:", len(train_dataset))
print("Validation images:", len(val_dataset))

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=0,
    pin_memory=(DEVICE.type == "cuda")
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0,
    pin_memory=(DEVICE.type == "cuda")
)


# ==========================================
# 6. LOAD MOBILENETV2
# ==========================================

print("\nLoading pretrained MobileNetV2...")

model = models.mobilenet_v2(weights=weights)

model.classifier[1] = nn.Linear(
    model.last_channel,
    len(class_names)
)

model = model.to(DEVICE)

criterion = nn.CrossEntropyLoss()

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=LEARNING_RATE
)

scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode="max",
    factor=0.5,
    patience=2
)

scaler = torch.cuda.amp.GradScaler(
    enabled=(DEVICE.type == "cuda")
)


# ==========================================
# 7. TRAINING FUNCTION
# ==========================================

def train_one_epoch():

    model.train()

    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in train_loader:

        images = images.to(DEVICE, non_blocking=True)
        labels = labels.to(DEVICE, non_blocking=True)

        optimizer.zero_grad(set_to_none=True)

        with torch.cuda.amp.autocast(
            enabled=(DEVICE.type == "cuda")
        ):

            outputs = model(images)
            loss = criterion(outputs, labels)

        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

        running_loss += loss.item() * images.size(0)

        predictions = outputs.argmax(dim=1)

        correct += (predictions == labels).sum().item()
        total += labels.size(0)

    epoch_loss = running_loss / total
    accuracy = 100 * correct / total

    return epoch_loss, accuracy


# ==========================================
# 8. VALIDATION FUNCTION
# ==========================================

def validate():

    model.eval()

    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(DEVICE, non_blocking=True)
            labels = labels.to(DEVICE, non_blocking=True)

            with torch.cuda.amp.autocast(
                enabled=(DEVICE.type == "cuda")
            ):

                outputs = model(images)
                loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)

            predictions = outputs.argmax(dim=1)

            correct += (predictions == labels).sum().item()
            total += labels.size(0)

    val_loss = running_loss / total
    val_accuracy = 100 * correct / total

    return val_loss, val_accuracy


# ==========================================
# 9. START TRAINING
# ==========================================

best_accuracy = 0.0

start_time = time.time()

print("\n===================================")
print("       TRAINING STARTED")
print("===================================")

for epoch in range(EPOCHS):

    epoch_start = time.time()

    train_loss, train_accuracy = train_one_epoch()

    val_loss, val_accuracy = validate()

    scheduler.step(val_accuracy)

    epoch_time = time.time() - epoch_start

    print(f"\nEpoch [{epoch + 1}/{EPOCHS}]")
    print(f"Training Loss: {train_loss:.4f}")
    print(f"Training Accuracy: {train_accuracy:.2f}%")
    print(f"Validation Loss: {val_loss:.4f}")
    print(f"Validation Accuracy: {val_accuracy:.2f}%")
    print(f"Time: {epoch_time / 60:.2f} minutes")

    # Save best model
    if val_accuracy > best_accuracy:

        best_accuracy = val_accuracy

        torch.save({
            "model_state_dict": model.state_dict(),
            "class_names": class_names,
            "num_classes": len(class_names),
            "image_size": IMAGE_SIZE,
            "model_name": "MobileNetV2",
            "validation_accuracy": best_accuracy
        }, OUTPUT_PATH / "best_model.pth")

        print("Best model saved!")

    if DEVICE.type == "cuda":
        torch.cuda.empty_cache()


# ==========================================
# 10. TRAINING COMPLETED
# ==========================================

total_time = (time.time() - start_time) / 60

print("\n===================================")
print("       TRAINING COMPLETED")
print("===================================")

print(f"Best Validation Accuracy: {best_accuracy:.2f}%")
print(f"Total Training Time: {total_time:.2f} minutes")

print("\nSaved files:")
print(OUTPUT_PATH / "best_model.pth")
print(OUTPUT_PATH / "class_names.json")

print("\nLEAF LOGIC AI model training finished!")
