#!/usr/bin/env python3
"""
Example script showing how to use the image URLs extracted by zillow_image_downloader.py

This script demonstrates:
1. Loading the updated JSON file with image URLs
2. Filtering properties that have images
3. Downloading selected images
4. Creating organized folders per property
"""

import json
import requests
import os
from pathlib import Path
from urllib.parse import urlparse
import time

def download_images_from_urls(json_file_path: str, output_dir: str = "downloaded_images", max_properties: int = 10):
    """Download images using the URLs extracted by the main script"""
    
    # Load the JSON file with extracted image URLs
    with open(json_file_path, 'r') as f:
        properties = json.load(f)
    
    # Filter properties that have images
    properties_with_images = [p for p in properties if p.get('images') and len(p['images']) > 0]
    
    print(f"Found {len(properties_with_images)} properties with image URLs")
    print(f"Processing first {min(max_properties, len(properties_with_images))} properties")
    
    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    })
    
    for i, property_data in enumerate(properties_with_images[:max_properties], 1):
        # Create folder name from address
        address = property_data.get('address', {})
        folder_name = f"{address.get('streetAddress', 'Unknown')}_{address.get('city', '')}_{address.get('state', '')}"
        folder_name = "".join(c for c in folder_name if c.isalnum() or c in (' ', '-', '_')).strip().replace(' ', '_')[:50]
        
        property_dir = Path(output_dir) / folder_name
        property_dir.mkdir(exist_ok=True)
        
        print(f"\n[{i}/{min(max_properties, len(properties_with_images))}] Processing: {folder_name}")
        print(f"Found {len(property_data['images'])} image URLs")
        
        downloaded = 0
        for j, img_url in enumerate(property_data['images'], 1):
            try:
                # Get image filename from URL
                parsed_url = urlparse(img_url)
                filename = Path(parsed_url.path).name
                if not filename or '.' not in filename:
                    filename = f"image_{j}.jpg"
                
                output_path = property_dir / f"{j:02d}_{filename}"
                
                # Skip if already exists
                if output_path.exists():
                    print(f"  Skipping existing: {filename}")
                    continue
                
                # Download image
                print(f"  Downloading {j}/{len(property_data['images'])}: {filename}")
                response = session.get(img_url, timeout=15)
                response.raise_for_status()
                
                # Save image
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                
                downloaded += 1
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                print(f"  Error downloading {img_url}: {e}")
        
        print(f"  Downloaded {downloaded}/{len(property_data['images'])} images")
        time.sleep(1)  # Delay between properties

def analyze_image_urls(json_file_path: str):
    """Analyze the extracted image URLs to show statistics"""
    
    with open(json_file_path, 'r') as f:
        properties = json.load(f)
    
    total_properties = len(properties)
    properties_with_images = [p for p in properties if p.get('images') and len(p['images']) > 0]
    properties_without_images = [p for p in properties if not p.get('images') or len(p['images']) == 0]
    
    total_images = sum(len(p.get('images', [])) for p in properties)
    
    print("=== Image URL Analysis ===")
    print(f"Total properties: {total_properties}")
    print(f"Properties with images: {len(properties_with_images)}")
    print(f"Properties without images: {len(properties_without_images)}")
    print(f"Total image URLs found: {total_images}")
    
    if properties_with_images:
        avg_images = total_images / len(properties_with_images)
        print(f"Average images per property (with images): {avg_images:.1f}")
        
        # Show some example URLs
        print(f"\nExample image URLs:")
        for i, prop in enumerate(properties_with_images[:3]):
            if prop['images']:
                print(f"  Property {i+1}: {prop['images'][0]}")

if __name__ == "__main__":
    json_file_path = "/Users/jasonshao/Downloads/items.json"  # Update this path
    
    print("Choose an action:")
    print("1. Analyze extracted image URLs")
    print("2. Download images from URLs (first 10 properties)")
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "1":
        analyze_image_urls(json_file_path)
    elif choice == "2":
        download_images_from_urls(json_file_path, max_properties=10)
    else:
        print("Invalid choice")