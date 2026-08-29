import os
import struct
import zlib

def create_png(width, height, color_rgb):
    # Standard PNG header
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk (raw pixel data)
    raw_data = bytearray()
    r, g, b = color_rgb
    for y in range(height):
        raw_data.append(0) # Filter type 0 (None)
        for x in range(width):
            # Draw a nice rounded box / border pattern
            is_border = (x < 12 or x >= width - 12 or y < 12 or y >= height - 12)
            if is_border:
                raw_data.extend([255, 255, 255])
            else:
                raw_data.extend([r, g, b])
                
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png

parent_icons_dir = r"g:\project\TEST\1\apps\parent-pwa\public\icons"
driver_icons_dir = r"g:\project\TEST\1\apps\driver-pwa\public\icons"

os.makedirs(parent_icons_dir, exist_ok=True)
os.makedirs(driver_icons_dir, exist_ok=True)

# Parent: Emerald #059669 -> RGB (5, 150, 105)
parent_192 = create_png(192, 192, (5, 150, 105))
parent_512 = create_png(512, 512, (5, 150, 105))

with open(os.path.join(parent_icons_dir, "icon-192x192.png"), "wb") as f:
    f.write(parent_192)
with open(os.path.join(parent_icons_dir, "icon-512x512.png"), "wb") as f:
    f.write(parent_512)

# Driver: Indigo #4f46e5 -> RGB (79, 70, 229)
driver_192 = create_png(192, 192, (79, 70, 229))
driver_512 = create_png(512, 512, (79, 70, 229))

with open(os.path.join(driver_icons_dir, "icon-192x192.png"), "wb") as f:
    f.write(driver_192)
with open(os.path.join(driver_icons_dir, "icon-512x512.png"), "wb") as f:
    f.write(driver_512)

print("[+] Generated real 192x192 and 512x512 PNG icons for Parent and Driver PWAs!")
