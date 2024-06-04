import numpy as np
import os
import pydicom
from pydicom.pixel_data_handlers.util import apply_voi_lut
import cv2
import matplotlib.pyplot as plt
from PIL import Image
from io import BytesIO
import matplotlib
matplotlib.use('Agg')  # Use Agg backend to avoid GUI


os.makedirs('static/assets/images', exist_ok=True)

def read_xray(path, voi_lut=True, fix_monochrome=True, apply_clahe=True, clipLimit=3.0, tileGridSize=(8,8)):
    dicom = pydicom.dcmread(path)
    
    if voi_lut:
        data = apply_voi_lut(dicom.pixel_array, dicom)
    else:
        data = dicom.pixel_array
    
    if fix_monochrome and dicom.PhotometricInterpretation == "MONOCHROME1":
        data = np.amax(data) - data
        
    data = data - np.min(data)
    data = data / np.max(data)
    data = (data * 255).astype(np.uint8)
    
    if apply_clahe:
        data = apply_clahe_to_image(data, clipLimit=clipLimit, tileGridSize=tileGridSize)
    
    resized_data = cv2.resize(data, (512,512), interpolation=cv2.INTER_LINEAR)
    
    return resized_data

def apply_clahe_to_image(image, clipLimit=3.0, tileGridSize=(6,6)):
    clahe = cv2.createCLAHE(clipLimit=clipLimit, tileGridSize=tileGridSize)
    clahe_image = clahe.apply(image)
    return clahe_image

def convert_to_jpg(image_array):
    fig, ax = plt.subplots()
    ax.imshow(image_array, cmap='gray')
    ax.axis('off')
    
    buf = BytesIO()
    plt.savefig(buf, format='jpg', bbox_inches='tight', pad_inches=0, dpi=100)
    plt.close(fig)
    
    buf.seek(0)
    image = Image.open(buf)
    return image

def dicom_to_jpg(dicom_file_path):
    img = read_xray(dicom_file_path)
    jpg_image = convert_to_jpg(img)
    return jpg_image

def save_jpg_image(dicom_file_path):
    jpg_image = dicom_to_jpg(dicom_file_path)
    output_path = 'static/assets/images/patientimage.jpg'
    jpg_image.save(output_path)
    image = 'static/assets/images/patientimage.jpg'
    return image


# path="uploads/1716130980_98a6530140c422a03cf1a10c8c490ad9.dicom"
# save_jpg_image(path)