import os
import struct
import zlib

def create_hd_png(width, height, base_color_rgb, text_label="SY"):
    # Generate true HD PNG with gradient, rounded container, and icon details
    raw_data = bytearray()
    r0, g0, b0 = base_color_rgb
    
    center_x, center_y = width / 2, height / 2
    radius = min(width, height) * 0.44

    for y in range(height):
        raw_data.append(0) # Filter type 0
        for x in range(width):
            dx = x - center_x
            dy = y - center_y
            dist = (dx*dx + dy*dy) ** 0.5
            
            # Gradient shading
            factor = 1.0 - (y / height) * 0.3
            r = int(min(255, max(0, r0 * factor)))
            g = int(min(255, max(0, g0 * factor)))
            b = int(min(255, max(0, b0 * factor)))
            
            # Outer circular squircle / badge
            if dist <= radius:
                # Inner emblem pattern
                if abs(dx) < radius * 0.5 and abs(dy) < radius * 0.5:
                    # White / Bright Gold Emblem
                    if (abs(dx) < 6 or abs(dy) < 6) or (abs(dx - dy) < 4):
                        raw_data.extend([255, 255, 255, 255])
                    else:
                        raw_data.extend([r + 20, g + 20, b + 20, 255])
                else:
                    raw_data.extend([r, g, b, 255])
            elif dist <= radius + 4:
                # Anti-aliased border ring
                raw_data.extend([255, 255, 255, 180])
            else:
                # Transparent outside
                raw_data.extend([0, 0, 0, 0])
                
    # PNG format compilation with RGBA (color type 6)
    png = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    compressed = zlib.compress(bytes(raw_data), 6)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    iend_crc = zlib.crc32(b'IEND')
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    return png

parent_icons_dir = r"g:\project\TEST\1\apps\parent-pwa\public\icons"
driver_icons_dir = r"g:\project\TEST\1\apps\driver-pwa\public\icons"

os.makedirs(parent_icons_dir, exist_ok=True)
os.makedirs(driver_icons_dir, exist_ok=True)

# Generate 192 and 512 for Parent (Emerald #059669)
p192 = create_hd_png(192, 192, (5, 150, 105))
p512 = create_hd_png(512, 512, (5, 150, 105))

with open(os.path.join(parent_icons_dir, "icon-192x192.png"), "wb") as f:
    f.write(p192)
with open(os.path.join(parent_icons_dir, "icon-512x512.png"), "wb") as f:
    f.write(p512)

# Generate 192 and 512 for Driver (Indigo #4f46e5)
d192 = create_hd_png(192, 192, (79, 70, 229))
d512 = create_hd_png(512, 512, (79, 70, 229))

with open(os.path.join(driver_icons_dir, "icon-192x192.png"), "wb") as f:
    f.write(d192)
with open(os.path.join(driver_icons_dir, "icon-512x512.png"), "wb") as f:
    f.write(d512)

print(f"[+] Generated HD RGBA Icons: Parent 192={len(p192)}B, 512={len(p512)}B | Driver 192={len(d192)}B, 512={len(d512)}B")
