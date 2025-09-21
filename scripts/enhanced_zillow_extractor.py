"""
Selenium-Based Zillow Image URL Extractor

This script uses Selenium as the primary method for extracting image URLs from Zillow properties.
It provides robust extraction by simulating real browser behavior and handling JavaScript-rendered content.
"""

# Suppress urllib3 OpenSSL warning
import warnings
import urllib3
urllib3.disable_warnings(urllib3.exceptions.NotOpenSSLWarning)

import json
import os
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from pathlib import Path
from typing import List, Dict, Optional
import signal
import sys
from tqdm import tqdm

# Import Selenium components
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from webdriver_manager.chrome import ChromeDriverManager
    import re
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False


class SeleniumZillowImageExtractor:
    """
    Selenium-based image URL extractor for Zillow properties
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = self._load_config(config)
        self.processing_stats = {
            'total_properties': 0,
            'processed_properties': 0,
            'successful_extractions': 0,
            'failed_extractions': 0,
            'selenium_used': 0,
            'total_images_found': 0
        }
        self._setup_logging()
        self._setup_signal_handlers()
        self.lock = threading.Lock()
        
        if not SELENIUM_AVAILABLE:
            raise RuntimeError("Selenium is required. Install with: pip install selenium webdriver-manager")
    
    def _load_config(self, config: Optional[Dict] = None) -> Dict:
        """Load configuration for Selenium-based extraction"""
        default_config = {
            'max_workers': 1,           # Use single worker for Selenium stability
            'delay_between_sites': 5.0, # Seconds between properties
            'page_load_timeout': 30,    # Selenium page load timeout
            'max_images_per_property': 200,  # Increased to get more images
            'selenium_headless': True,  # Run Selenium in background
            'selenium_delay': 8,        # Extra delay for page loading
            'user_agents': [
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ],
            'log_level': 'INFO'
        }
        
        if config:
            default_config.update(config)
        return default_config
    
    def _setup_logging(self):
        """Setup logging"""
        log_format = '%(asctime)s - %(levelname)s - %(message)s'
        
        console_handler = logging.StreamHandler()
        console_handler.setLevel(getattr(logging, self.config['log_level']))
        console_handler.setFormatter(logging.Formatter(log_format))
        
        # Create log directory if it doesn't exist
        script_dir = Path(__file__).parent
        log_dir = script_dir.parent / 'logs'
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / 'enhanced_image_extraction.log'
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(logging.Formatter(log_format))
        
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.DEBUG)
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)
    
    def _setup_signal_handlers(self):
        """Setup graceful shutdown"""
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.info(f"Received signal {signum}. Shutting down gracefully...")
        self._print_stats()
        sys.exit(0)
    
    def _extract_images_selenium(self, url: str) -> List[str]:
        """Extract images using Selenium as fallback"""
        if not SELENIUM_AVAILABLE:
            return []
        
        chrome_options = Options()
        if self.config['selenium_headless']:
            chrome_options.add_argument('--headless')
        
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument(f'--user-agent={self.config["user_agents"][0]}')
        
        driver = None
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            self.logger.debug(f"Selenium loading: {url}")
            driver.get(url)
            
            WebDriverWait(driver, self.config['page_load_timeout']).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            
            time.sleep(self.config['selenium_delay'])
            
            # Wait a bit more for dynamic content to load
            time.sleep(3)
            
            # Check for GalleryIntersectionNotifier class and log all gallery-related elements
            gallery_elements_info = driver.execute_script("""
                // Find elements with GalleryIntersectionNotifier
                var galleryNotifier = document.querySelectorAll('[class*="GalleryIntersectionNotifier"]');
                
                // Also check for StyledGallerySeeAllPhotosButton as backup
                var styledButton = document.querySelectorAll('[class*="StyledGallerySeeAllPhotosButton"]');
                
                // Find any gallery-related elements for debugging
                var galleryElements = document.querySelectorAll('[class*="gallery" i], [class*="photos" i], [class*="see-all" i], [data-testid*="gallery"], [data-testid*="photos"], [class*="GalleryIntersectionNotifier"]');
                
                return {
                    galleryNotifierFound: galleryNotifier.length > 0,
                    galleryNotifierCount: galleryNotifier.length,
                    styledButtonFound: styledButton.length > 0,
                    styledButtonCount: styledButton.length,
                    galleryElementsFound: Array.from(galleryElements).map(el => ({
                        tagName: el.tagName,
                        className: el.className,
                        testId: el.getAttribute('data-testid'),
                        textContent: el.textContent ? el.textContent.substring(0, 50) : ''
                    }))
                };
            """)
            
            if gallery_elements_info['galleryNotifierFound']:
                self.logger.info(f"✅ Found {gallery_elements_info['galleryNotifierCount']} GalleryIntersectionNotifier element(s) for {url}")
            elif gallery_elements_info['styledButtonFound']:
                self.logger.info(f"✅ Found {gallery_elements_info['styledButtonCount']} StyledGallerySeeAllPhotosButton element(s) for {url}")
            else:
                self.logger.info(f"❌ No GalleryIntersectionNotifier or StyledGallerySeeAllPhotosButton found for {url}")
                
            if gallery_elements_info['galleryElementsFound']:
                self.logger.debug(f"Found {len(gallery_elements_info['galleryElementsFound'])} gallery-related elements total")
                for element in gallery_elements_info['galleryElementsFound'][:5]:  # Log first 5
                    self.logger.debug(f"  - {element['tagName']}: class='{element['className'][:80]}', testid='{element['testId']}'")
            
            # Continue with extraction regardless of button presence
            self.logger.debug(f"Proceeding with image extraction for {url}")
            
            # Scroll to trigger lazy loading of images
            self.logger.debug(f"Scrolling to load images for {url}")
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)
            driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(2)
            
            image_urls = set()
            
            # Extract URLs specifically from photos.zillowstatic.com/fp in page source
            self.logger.debug(f"Extracting photos.zillowstatic.com/fp URLs from page source")
            page_source = driver.page_source
            
            # Enhanced regex patterns specifically for photos.zillowstatic.com/fp
            patterns = [
                # Direct URL patterns for /fp/ folder
                r'https://photos\.zillowstatic\.com/fp/[^"\'\\s]+',
                # Quoted URL patterns
                r'"(https://photos\.zillowstatic\.com/fp/[^"]*)"',
                r"'(https://photos\.zillowstatic\.com/fp/[^']*)'",
                # JSON-style patterns (common in React apps)
                r'https:\\/\\/photos\\.zillowstatic\\.com\\/fp\\/[^"\'\\s]+',
                # Escaped patterns in JavaScript
                r'\\"(https://photos\\.zillowstatic\\.com/fp/[^"]*)\\"'
            ]
            
            for pattern in patterns:
                found_urls = re.findall(pattern, page_source, re.IGNORECASE)
                self.logger.debug(f"Pattern '{pattern[:50]}...' found {len(found_urls)} matches")
                
                for url_match in found_urls:
                    # Handle tuple results from capture groups
                    url = url_match[0] if isinstance(url_match, tuple) else url_match
                    
                    # Only process URLs that are specifically from /fp/ folder
                    if url.startswith('http') and 'photos.zillowstatic.com/fp/' in url:
                        # Clean up escaped characters and trailing slashes
                        clean_url = (url.replace('\\u003d', '=')
                                      .replace('\\u0026', '&')
                                      .replace('\\"', '')
                                      .replace('\\/', '/')
                                      .replace('\\.', '.')  # Fix escaped dots
                                      .rstrip('\\')  # Remove trailing backslashes
                                      .rstrip('/'))  # Remove trailing forward slashes
                        
                        # Filter to only include specific uncropped scaled webp images
                        if (clean_url and 
                            clean_url.startswith('https://photos.zillowstatic.com/fp/') and
                            clean_url.endswith('-uncropped_scaled_within_1344_1008.webp') and
                            not any(skip in clean_url.lower() for skip in ['logo', 'icon', 'avatar', 'zillow_web'])):
                            image_urls.add(clean_url)
            
            with self.lock:
                self.processing_stats['selenium_used'] += 1
            
            # Final cleanup of all URLs before returning
            cleaned_urls = []
            for url in image_urls:
                final_clean_url = (url.replace('\\u003d', '=')
                                     .replace('\\u0026', '&')
                                     .replace('\\"', '')
                                     .replace('\\/', '/')
                                     .rstrip('\\')  # Remove trailing backslashes
                                     .rstrip('/'))  # Remove trailing forward slashes
                if final_clean_url and final_clean_url.startswith('http'):
                    cleaned_urls.append(final_clean_url)
            
            return sorted(list(set(cleaned_urls)))  # Remove duplicates and sort
            
        except Exception as e:
            self.logger.error(f"Selenium error for {url}: {e}")
            return []
        finally:
            if driver:
                try:
                    driver.quit()
                except:
                    pass
    
    def _process_single_property(self, property_data: Dict) -> List[str]:
        """Process single property using Selenium"""
        url = property_data['addressOrUrlFromInput']
        
        try:
            self.logger.info(f"Processing: {url}")
            
            # Use Selenium as primary method
            self.logger.debug(f"Using Selenium for {url}")
            image_urls = self._extract_images_selenium(url)
            
            # Limit and clean URLs
            image_urls = image_urls[:self.config['max_images_per_property']]
            
            if image_urls:
                self.logger.info(f"Found {len(image_urls)} images for {url}")
                with self.lock:
                    self.processing_stats['successful_extractions'] += 1
                    self.processing_stats['total_images_found'] += len(image_urls)
            else:
                self.logger.warning(f"No images found for {url}")
                with self.lock:
                    self.processing_stats['failed_extractions'] += 1
            
            time.sleep(self.config['delay_between_sites'])
            
            with self.lock:
                self.processing_stats['processed_properties'] += 1
            
            return image_urls
            
        except Exception as e:
            self.logger.error(f"Error processing {url}: {e}")
            with self.lock:
                self.processing_stats['failed_extractions'] += 1
                self.processing_stats['processed_properties'] += 1
            return []
    
    def load_properties_from_json(self, json_file_path: str) -> tuple:
        """Load properties from JSON file"""
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            properties_to_process = []
            for item in data:
                if 'addressOrUrlFromInput' in item and item['addressOrUrlFromInput']:
                    url = item['addressOrUrlFromInput'].strip()
                    if url.startswith('http'):
                        if 'images' not in item or not item['images']:
                            properties_to_process.append(item)
            
            self.logger.info(f"Loaded {len(properties_to_process)} properties to process")
            return data, properties_to_process
            
        except Exception as e:
            self.logger.error(f"Error loading JSON: {e}")
            return [], []
    
    def extract_and_save_image_urls(self, json_file_path: str, start_index: int = 0, max_properties: Optional[int] = None):
        """Main extraction method"""
        try:
            all_properties, properties_to_process = self.load_properties_from_json(json_file_path)
            
            if not properties_to_process:
                self.logger.info("No properties need processing")
                return
            
            properties_to_process = properties_to_process[start_index:]
            if max_properties:
                properties_to_process = properties_to_process[:max_properties]
            
            self.processing_stats['total_properties'] = len(properties_to_process)
            
            self.logger.info(f"Processing {len(properties_to_process)} properties")
            self.logger.info(f"Selenium available: {SELENIUM_AVAILABLE}")
            
            # Process with limited threading (Selenium needs this)
            with ThreadPoolExecutor(max_workers=self.config['max_workers']) as executor:
                future_to_property = {
                    executor.submit(self._process_single_property, prop): prop 
                    for prop in properties_to_process
                }
                
                with tqdm(total=len(properties_to_process), desc="Processing properties") as pbar:
                    for future in as_completed(future_to_property):
                        property_data = future_to_property[future]
                        try:
                            image_urls = future.result()
                            property_data['images'] = image_urls
                            
                            pbar.set_postfix({
                                'Found': self.processing_stats['total_images_found'],
                                'Success': self.processing_stats['successful_extractions'],
                                'Selenium': self.processing_stats['selenium_used']
                            })
                        except Exception as e:
                            self.logger.error(f"Future failed: {e}")
                            property_data['images'] = []
                        finally:
                            pbar.update(1)
            
            # Save results
            self._save_updated_json(all_properties, json_file_path)
            self._print_stats()
            
        except Exception as e:
            self.logger.error(f"Fatal error: {e}")
            raise
    
    def _save_updated_json(self, data: List[Dict], json_file_path: str):
        """Save updated JSON with backup"""
        try:
            backup_path = f"{json_file_path}.enhanced_backup"
            if not os.path.exists(backup_path):
                import shutil
                shutil.copy2(json_file_path, backup_path)
                self.logger.info(f"Created backup: {backup_path}")
            
            with open(json_file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Updated JSON saved: {json_file_path}")
            
        except Exception as e:
            self.logger.error(f"Error saving JSON: {e}")
            raise
    
    def _print_stats(self):
        """Print extraction statistics"""
        stats = self.processing_stats
        self.logger.info("=== Enhanced Extraction Statistics ===")
        self.logger.info(f"Total properties: {stats['total_properties']}")
        self.logger.info(f"Processed: {stats['processed_properties']}")
        self.logger.info(f"Successful: {stats['successful_extractions']}")
        self.logger.info(f"Failed: {stats['failed_extractions']}")
        self.logger.info(f"Selenium used: {stats['selenium_used']}")
        self.logger.info(f"Total images: {stats['total_images_found']}")
        
        if stats['processed_properties'] > 0:
            success_rate = (stats['successful_extractions'] / stats['processed_properties'] * 100)
            avg_images = (stats['total_images_found'] / stats['successful_extractions'] 
                         if stats['successful_extractions'] > 0 else 0)
            self.logger.info(f"Success rate: {success_rate:.1f}%")
            self.logger.info(f"Avg images per property: {avg_images:.1f}")


def main():
    """Main function with Selenium-based extraction"""
    
    config = {
        'max_workers': 1,              # Single worker for Selenium stability
        'delay_between_sites': 5.0,    # Longer delays for politeness
        'page_load_timeout': 30,       # Selenium timeout
        'max_images_per_property': 200,  # Increased to get more images
        'selenium_headless': True,     # Run Selenium in background
        'selenium_delay': 8,           # Wait for page load
        'log_level': 'DEBUG'
    }
    
    extractor = SeleniumZillowImageExtractor(config)
    
    # Configuration - Ready for production!
    script_dir = Path(__file__).parent
    json_file_path = script_dir.parent / "data" / "items.json"  # Main production file
    start_index = 0      # Start from beginning (or resume from specific index)
    max_properties = None  # Process all properties (or set limit for testing)
    
    try:
        extractor.extract_and_save_image_urls(
            json_file_path=json_file_path,
            start_index=start_index,
            max_properties=max_properties
        )
    except KeyboardInterrupt:
        extractor.logger.info("Extraction interrupted by user")
    except Exception as e:
        extractor.logger.error(f"Extraction failed: {e}")


if __name__ == "__main__":
    main()