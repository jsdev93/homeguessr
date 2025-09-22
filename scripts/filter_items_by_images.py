import json

INPUT = '../data/items.json'
OUTPUT = '../data/items.json'  # Overwrite in place

with open(INPUT, 'r', encoding='utf-8') as f:
    items = json.load(f)

# Remove objects where images is a list with 1 to 11 elements (keep only 0 or >=12)
filtered = [item for item in items if not ('images' in item and isinstance(item['images'], list) and len(item['images']) == 0)]

print(f"Filtered: {len(items) - len(filtered)} removed, {len(filtered)} remain.")

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(filtered, f, indent=2, ensure_ascii=False)
