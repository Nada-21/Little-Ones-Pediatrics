import torch
import pydicom
import numpy as np
from PIL import Image
import cv2
from torchvision import transforms
from torch.utils.data import Dataset, DataLoader
import timm
import torch.optim as optim
import torch.nn as nn
from tqdm import tqdm
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score
import torchvision.models as models

class Xception(nn.Module):
    def __init__(self, num_classes=6, pretrained=True):
        super(Xception, self).__init__()
        self.xception = timm.create_model('xception', pretrained=pretrained)
        num_ftrs = self.xception.fc.in_features
        self.xception.fc = nn.Linear(num_ftrs, num_classes)

    def forward(self, x):
        return self.xception(x)
        
class ResNet(nn.Module):
    def __init__(self, num_classes=6):
        super(ResNet, self).__init__()
        self.resnet = models.resnet50(pretrained=True)
        in_features = self.resnet.fc.in_features
        self.resnet.fc = nn.Linear(in_features, num_classes)

    def forward(self, x):
        return self.resnet(x)

class EfficientNet(nn.Module):
    def __init__(self, num_classes=6):
        super(EfficientNet, self).__init__()
        self.efficientnet = timm.create_model('efficientnet_b0', pretrained=True)
        num_ftrs = self.efficientnet.classifier.in_features
        self.efficientnet.classifier = nn.Linear(num_ftrs, num_classes)

    def forward(self, x):
        return self.efficientnet(x)
        
class VGG19(nn.Module):
    def __init__(self, num_classes=6):
        super(VGG19, self).__init__()
        self.vgg19 = models.vgg19(pretrained=True)
        in_features = self.vgg19.classifier[6].in_features
        self.vgg19.classifier[6] = nn.Linear(in_features, num_classes)

    def forward(self, x):
        return self.vgg19(x)

# Gaussian noise reduction
class FilterTransform(object):
    def __init__(self):
        pass
    
    def __call__(self, image):
        return self.apply_filters(image)

    def apply_filters(self, image):
        # Apply filters to image
        filtered_image = self.remove_noise(image)
        return filtered_image

    def remove_noise(self, image):
        # Apply Gaussian noise reduction
        denoised_image = cv2.fastNlMeansDenoisingColored(np.array(image), None, 10, 10, 7, 21)
        return Image.fromarray(denoised_image)

def load_model(model_class, model_path, num_classes=6):
    model = model_class(num_classes=num_classes)
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cuda' if torch.cuda.is_available() else 'cpu')))
    model.eval()
    return model

def preprocess_dicom(dicom_path, crop_params):
    dicom = pydicom.dcmread(dicom_path)
    image = dicom.pixel_array
    image = image / np.max(image)
    image = Image.fromarray((image * 255).astype(np.uint8)).convert('RGB')
    
    # Apply cropping if crop parameters are provided
    if crop_params:
        top_left_x, top_left_y, width, height = crop_params
        image = image.crop((top_left_x, top_left_y, top_left_x + width, top_left_y + height))
    
    transform = transforms.Compose([
        transforms.Resize((150, 150)),
        FilterTransform(),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    image = transform(image).unsqueeze(0)  # Add batch dimension
    return image

# Classify a DICOM file using the loaded model
def classify_dicom(model, dicom_path, class_labels, crop_params=None):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    image = preprocess_dicom(dicom_path, crop_params).to(device)
    with torch.no_grad():
        output = model(image)
    predicted_class = torch.argmax(output, dim=1).item()
    resultant_label = class_labels[predicted_class]
    print(f'Classified as: {resultant_label}')
    return resultant_label

def ModelClassification(path):
    class_labels = {0: 'Normal', 1: 'Other disease', 2: 'Pneumonia', 3: 'Bronchitis', 4: 'Bronchiolitis', 5: 'Brocho-pneumonia'}
    model_path = 'VGG19.pt'
    model_VGG19_loaded = load_model(VGG19, model_path, num_classes=6)
   
    crop_params = (0, 75, 1236, 1151)
    result = classify_dicom(model_VGG19_loaded, path, class_labels, crop_params)
    return result

# dicom_path = r'files/Normal.dicom'
# ModelClassification(dicom_path)
