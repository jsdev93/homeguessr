#!/usr/bin/env python3
"""
ZenRows-Based Zillow Image URL Extractor - JSON Batch Processor
"""

import json
import os
import re
import sys
import requests

def extract_images_zenrows(url, api_key='16f88ed97617b9495818b212821e91a5ebf39e49', wait_time=500):
    """Extract image URLs using ZenRows API"""
    print(f"🌐 Extracting images from: {url}")
    
    params = {
        'url': url,
        'apikey': api_key,
        'js_render': 'false',
        'premium_proxy': 'false',
        # 'wait': str(wait_time),
        'device': 'desktop',
    }
    
    try:
        print("📡 Making ZenRows API request...")
        response = requests.get('https://api.zenrows.com/v1/', params=params, timeout=60)
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📄 Response Length: {len(response.text):,} characters")
        
        if response.status_code != 200:
            print(f"❌ ZenRows API error: {response.status_code}")
            return []
        
        images = parse_images_from_html(response.text)
        return images
        
    except Exception as e:
        print(f"❌ ZenRows request failed: {e}")
        return []

def parse_images_from_html(html_content):
    """Parse and extract image URLs from HTML content"""
    image_urls = set()
    
    # Pattern to match only the specific format: https://photos.zillowstatic.com/fp/[id]-uncropped_scaled_within_1536_1152.webp
    pattern = r'https://photos\.zillowstatic\.com/fp/[^"\'>\s]+-uncropped_scaled_within_1536_1152\.webp'
    
    matches = re.findall(pattern, html_content, re.IGNORECASE)
    print(f"🔍 Found {len(matches)} matches with specific pattern")
    
    # Clean URLs and ensure no duplicates using set
    for url in matches:
        cleaned_url = url.replace('\\/', '/').replace('\\', '')
        if 'photos.zillowstatic.com/fp/' in cleaned_url and 'uncropped_scaled_within_1536_1152.webp' in cleaned_url:
            image_urls.add(cleaned_url)
    
    # Convert set to list to maintain order and remove duplicates
    unique_urls = list(image_urls)
    print(f"🎯 Extracted {len(unique_urls)} unique image URLs")
    return unique_urls

def process_items_json(json_file_path, start_index=None, end_index=None):
    """Process items.json file and add images to each item, with optional index range"""
    
    # Load the JSON data
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            items = json.load(f)
        print(f"📂 Loaded {len(items)} items from {json_file_path}")
    except Exception as e:
        print(f"❌ Error loading JSON file: {e}")
        return
    
    # Apply index range if specified
    total_items = len(items)
    if start_index is not None or end_index is not None:
        start = start_index if start_index is not None else 0
        end = end_index + 1 if end_index is not None else total_items
        print(f"🔢 Processing range: {start} to {end-1} (inclusive)")
        items_to_process = list(enumerate(items))[start:end]
    else:
        items_to_process = list(enumerate(items))

    successful_extractions = 0
    failed_extractions = 0
    
    for i, item in items_to_process:
        # Check if item has the required field
        if 'addressOrUrlFromInput' not in item:
            print(f"⚠️  Item {i}: No 'addressOrUrlFromInput' field found, skipping...")
            continue
            
        url = item['addressOrUrlFromInput']
        
        # Skip if not a Zillow URL
        if not url or 'zillow.com' not in url.lower():
            print(f"⚠️  Item {i}: Not a valid Zillow URL, skipping...")
            continue
        
        # Skip if images already exist
        if 'images' in item and item['images']:
            print(f"✅ Item {i}: Images already exist, skipping...")
            continue
        
        print(f"\n🏠 Processing item {i}/{total_items}")
        print(f"🌐 URL: {url}")
        
        try:
            # Extract images
            images = extract_images_zenrows(url)
            
            # Add images to the item
            item['images'] = images
            
            if images:
                print(f"✅ SUCCESS: Added {len(images)} images to item {i}")
                successful_extractions += 1
            else:
                print(f"⚠️  No images found for item {i}")
                failed_extractions += 1
                
        except Exception as e:
            print(f"❌ Error processing item {i}: {e}")
            item['images'] = []
            failed_extractions += 1
    
    # Save the updated JSON
    try:
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(items, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Updated JSON file saved: {json_file_path}")
    except Exception as e:
        print(f"❌ Error saving JSON file: {e}")
        return
    
    # Summary
    print(f"\n📊 Processing Summary:")
    print(f"✅ Successful extractions: {successful_extractions}")
    print(f"❌ Failed extractions: {failed_extractions}")
    print(f"📁 Total items processed: {successful_extractions + failed_extractions}")

def main():
    # Default to the data/items.json file relative to the script's parent directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_json_path = os.path.join(os.path.dirname(script_dir), 'data', 'items.json')
    
    # Allow custom JSON file path as argument
    json_file_path = default_json_path
    start_index = None
    end_index = None
    if len(sys.argv) > 1:
        json_file_path = sys.argv[1]
    if len(sys.argv) > 2:
        try:
            start_index = int(sys.argv[2])
        except ValueError:
            print(f"❌ Invalid start_index: {sys.argv[2]}")
            sys.exit(1)
    if len(sys.argv) > 3:
        try:
            end_index = int(sys.argv[3])
        except ValueError:
            print(f"❌ Invalid end_index: {sys.argv[3]}")
            sys.exit(1)
    
    # Check if file exists
    if not os.path.exists(json_file_path):
        print(f"❌ Error: JSON file not found: {json_file_path}")
        print(f"Usage: python enhanced_zillow_extractor.py [json_file_path] [start_index] [end_index]")
        print(f"Default: {default_json_path}")
        sys.exit(1)
    
    print("🌐 ZenRows Zillow Image Extractor - JSON Batch Processor")
    print("="*60)
    print(f"📂 Input file: {json_file_path}")
    if start_index is not None or end_index is not None:
        print(f"🔢 Index range: {start_index} to {end_index}")
    print()
    
    try:
        process_items_json(json_file_path, start_index, end_index)
    except KeyboardInterrupt:
        print("\n⏹️  Process interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
