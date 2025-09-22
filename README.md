# Zillow Image URL Extractor

A professional-grade Python script for extracting image URLs from Zillow property listings and adding them to your JSON data file.

## Features

✅ **All Recommended Best Practices:**

- Rate limiting and respectful request throttling (2s between properties)
- Concurrent processing with thread safety (configurable workers)
- Robust error handling and automatic retries
- Progress tracking with visual progress bars
- Comprehensive logging (console + file)
- Session management with connection pooling
- User-Agent rotation to avoid blocking
- Graceful shutdown handling

✅ **Zillow-Specific Optimizations:**

- Targeted CSS selectors for high-quality property images
- Automatic image quality filtering and prioritization
- Handles responsive image formats (srcset)
- Avoids thumbnails and low-quality images
- Extracts URLs without downloading (much faster!)

✅ **Production Ready:**

- Adds image URLs directly to your items.json file
- Creates automatic backup before modifying
- Resume capability (start from any property index)
- Skips properties that already have images
- Optional URL validation (can verify each image exists)
- Detailed statistics and success rate tracking

## Installation

1. **Install Python dependencies:**

```bash
pip install -r requirements.txt
```

2. **Verify your JSON file path:**
   Make sure `/Users/jasonshao/Downloads/items.json` exists and contains Zillow URLs.

## Usage

### Basic Usage

```bash
python enhanced_zillow_extractor.py
```

This will:

- Process all properties from your `data/items.json` file
- Extract image URLs per property (matching the Zillow webp pattern)
- Add an `images` array to each property object
- Skip properties that already have images
- Show progress and summary statistics

### Process a Range of Properties

To process only a specific range of items (by index):

```bash
python enhanced_zillow_extractor.py data/items.json 100 200
```

This will process items 100 to 200 (inclusive) in your JSON file.

### Filter Properties by Image Count

To remove all properties with fewer than 8 images:

```bash
python filter_items_by_images.py
```

This will overwrite `data/items.json` with only those properties that have at least 8 images in their `images` array.

### Resume or Parallel Processing

- You can run multiple instances of the script on different, non-overlapping index ranges for faster processing.
- Do not run two processes on the same file and overlapping ranges at the same time (risk of data loss).

## Output Structure

```
zillow_images/
├── download.log                          # Detailed log file
├── 245_N_Sylmar_Ave_Fresno_CA_93727/   # Property folder
│   ├── 01_original_filename.jpg
│   ├── 02_another_image.webp
│   └── ...
├── 1884_N_Apricot_Ave_Fresno_CA_93727/
│   ├── 01_image.jpg
│   └── ...
└── ...
```

## Performance Recommendations

### Conservative Settings (Recommended Start)

```python
'max_workers': 2,
'delay_between_requests': 2.0,
'delay_between_sites': 5.0,
```

### Moderate Settings

```python
'max_workers': 3,
'delay_between_requests': 1.5,
'delay_between_sites': 3.0,
```

### Aggressive Settings (Risk of Rate Limiting)

```python
'max_workers': 5,
'delay_between_requests': 0.5,
'delay_between_sites': 1.0,
```

## Monitoring Progress

The script provides multiple ways to track progress:

1. **Console Progress Bar:** Shows real-time progress with success/failure counts
2. **Console Logging:** INFO level shows key events, DEBUG shows detailed activity
3. **Log File:** Complete detailed log saved to `zillow_images/download.log`
4. **Final Statistics:** Summary report at completion

## Troubleshooting

### Getting Rate Limited or 403 Errors?

⚠️ **This is expected!** Zillow has anti-bot protection that may block automated requests.

- Reduce `max_workers` to 1 or 2
- Increase `delay_between_sites` to 5+ seconds
- Try running during off-peak hours
- Consider using residential proxies for large-scale extraction
- Some URLs may be expired or private listings

### Extractions Failing?

- Check internet connection
- Increase `request_timeout` to 30+ seconds
- Set `log_level` to `'DEBUG'` for detailed error info
- Enable `validate_image_urls` to verify each URL (slower)

### Performance Issues?

- Adjust `max_images_per_property` to limit extraction per property
- Properties that already have images will be skipped automatically
- Monitor memory usage with large JSON files

### Resuming After Interruption?

- Set `start_index` to where you want to resume
- Enable `skip_existing: True` to avoid re-downloading
- Check the log file for the last processed URL

## Safety Features

- **Automatic Backup:** Creates `.backup` file before modifying your JSON
- **Graceful Shutdown:** Ctrl+C will cleanly stop and show statistics
- **Rate Limiting:** Built-in delays prevent server overload
- **Error Recovery:** Automatic retries with exponential backoff
- **Skip Processed:** Automatically skips properties that already have images
- **Resume Capability:** Can restart from any property index

## Output Format

After processing, each property in your JSON file will have an `images` array added:

```json
{
  "address": {
    "streetAddress": "245 N Sylmar Ave",
    "city": "Fresno",
    "state": "CA",
    "zipcode": "93727"
  },
  "bedrooms": 2,
  "bathrooms": 2,
  "price": 351000,
  "addressOrUrlFromInput": "https://www.zillow.com/homedetails/245-N-Sylmar-Ave-Fresno-CA-93727/18759893_zpid/",
  "images": [
    "https://photos.zillowstatic.com/fp/abc123-uncropped_scaled_within_1536_1152.webp",
    "https://photos.zillowstatic.com/fp/def456-uncropped_scaled_within_1536_1152.webp"
  ]
}
```

## Expected Runtime

For your items.json with ~128K URLs:

- **URL extraction only:** 6-12 hours continuous running
- **With URL validation:** 12-24 hours continuous running
- **Storage requirement:** Minimal (just adds text URLs to JSON file)

## Legal and Ethical Considerations

⚠️ **Important:**

- This script is for personal/research use only
- Respect Zillow's robots.txt and terms of service
- Don't overwhelm servers with aggressive settings
- Consider the legal implications of bulk downloading
- Images may be copyrighted by photographers/agents

Start with conservative settings and gradually increase speed if no issues arise.

---

# homeguessr
