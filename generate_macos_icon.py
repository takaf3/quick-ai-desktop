#!/usr/bin/env python3
"""
Generate macOS-compliant app icon with proper padding and .icns file
"""

from PIL import Image, ImageDraw
import os
import subprocess
import shutil

def create_macos_app_icon():
    """Create app icon following macOS design guidelines"""
    # macOS icon sizes needed for .icns
    sizes = [16, 32, 64, 128, 256, 512, 1024]
    
    # Create the largest size first (1024x1024)
    max_size = 1024
    img = Image.new('RGBA', (max_size, max_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # macOS icons should have about 10-15% padding
    padding = int(max_size * 0.12)
    icon_size = max_size - (padding * 2)
    
    # Create rounded rectangle background with gradient
    # Using a more subtle gradient that fits macOS aesthetics
    corner_radius = int(icon_size * 0.22)  # macOS uses ~22% corner radius
    
    # Create gradient background
    gradient = Image.new('RGBA', (icon_size, icon_size), (0, 0, 0, 0))
    gradient_draw = ImageDraw.Draw(gradient)
    
    # Modern gradient - purple to blue (more subtle for macOS)
    for y in range(icon_size):
        # Smoother gradient
        progress = y / icon_size
        r = int(120 - progress * 40)  # 120 to 80
        g = int(70 + progress * 50)   # 70 to 120
        b = int(180 + progress * 40)  # 180 to 220
        gradient_draw.rectangle([(0, y), (icon_size, y + 1)], fill=(r, g, b, 255))
    
    # Create mask for rounded corners
    mask = Image.new('L', (icon_size, icon_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (icon_size, icon_size)], 
                                radius=corner_radius, fill=255)
    
    # Apply mask to gradient
    rounded_bg = Image.new('RGBA', (icon_size, icon_size), (0, 0, 0, 0))
    rounded_bg.paste(gradient, (0, 0))
    rounded_bg.putalpha(mask)
    
    # Paste rounded background onto main image with padding
    img.paste(rounded_bg, (padding, padding), rounded_bg)
    
    # Draw the AI symbol - cleaner, simpler design for macOS
    draw = ImageDraw.Draw(img)
    center_x = max_size // 2
    center_y = max_size // 2
    
    # Scale elements relative to icon size
    element_scale = icon_size / 800  # Base scale factor
    
    # Draw a stylized AI brain/network symbol
    import math
    
    # Create hexagon points (6 outer nodes)
    hex_radius = int(icon_size * 0.28)  # Smaller for better proportion
    angles = [i * 60 for i in range(6)]
    hex_points = []
    for angle in angles:
        x = center_x + hex_radius * math.cos(math.radians(angle - 30))
        y = center_y + hex_radius * math.sin(math.radians(angle - 30))
        hex_points.append((x, y))
    
    # Draw connections with varying opacity for depth
    for i, p1 in enumerate(hex_points):
        for j, p2 in enumerate(hex_points):
            if i < j:
                # Distance-based opacity
                distance = math.sqrt((p2[0]-p1[0])**2 + (p2[1]-p1[1])**2)
                max_distance = hex_radius * 2
                opacity = int(80 - (distance/max_distance * 40))
                draw.line([p1, p2], fill=(255, 255, 255, opacity), width=int(3 * element_scale))
    
    # Draw nodes with subtle shadows
    node_radius = int(icon_size * 0.04)
    
    # Outer nodes
    for point in hex_points:
        # Shadow
        shadow_offset = int(2 * element_scale)
        draw.ellipse([point[0] - node_radius - shadow_offset, 
                     point[1] - node_radius + shadow_offset,
                     point[0] + node_radius - shadow_offset, 
                     point[1] + node_radius + shadow_offset],
                    fill=(0, 0, 0, 30))
        # Node
        draw.ellipse([point[0] - node_radius, point[1] - node_radius,
                     point[0] + node_radius, point[1] + node_radius],
                    fill=(255, 255, 255, 255))
    
    # Center node (larger)
    center_radius = int(node_radius * 1.8)
    # Shadow
    shadow_offset = int(3 * element_scale)
    draw.ellipse([center_x - center_radius - shadow_offset, 
                 center_y - center_radius + shadow_offset,
                 center_x + center_radius - shadow_offset, 
                 center_y + center_radius + shadow_offset],
                fill=(0, 0, 0, 40))
    # Center node with glow
    for i in range(2):
        glow_radius = center_radius + (i * int(8 * element_scale))
        alpha = 30 - (i * 15)
        draw.ellipse([center_x - glow_radius, center_y - glow_radius,
                     center_x + glow_radius, center_y + glow_radius],
                    fill=(255, 255, 255, alpha))
    draw.ellipse([center_x - center_radius, center_y - center_radius,
                 center_x + center_radius, center_y + center_radius],
                fill=(255, 255, 255, 255))
    
    # Generate all sizes
    icons = {}
    for size in sizes:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        icons[size] = resized
    
    return icons

def create_icns_file(icons):
    """Create .icns file for macOS"""
    # Create temporary iconset directory
    iconset_dir = 'icon.iconset'
    if os.path.exists(iconset_dir):
        shutil.rmtree(iconset_dir)
    os.makedirs(iconset_dir)
    
    # Save each size with proper naming
    size_names = {
        16: 'icon_16x16.png',
        32: 'icon_16x16@2x.png',
        32: 'icon_32x32.png',
        64: 'icon_32x32@2x.png',
        128: 'icon_128x128.png',
        256: 'icon_128x128@2x.png',
        256: 'icon_256x256.png',
        512: 'icon_256x256@2x.png',
        512: 'icon_512x512.png',
        1024: 'icon_512x512@2x.png',
    }
    
    # Save standard sizes
    icons[16].save(os.path.join(iconset_dir, 'icon_16x16.png'))
    icons[32].save(os.path.join(iconset_dir, 'icon_16x16@2x.png'))
    icons[32].save(os.path.join(iconset_dir, 'icon_32x32.png'))
    icons[64].save(os.path.join(iconset_dir, 'icon_32x32@2x.png'))
    icons[128].save(os.path.join(iconset_dir, 'icon_128x128.png'))
    icons[256].save(os.path.join(iconset_dir, 'icon_128x128@2x.png'))
    icons[256].save(os.path.join(iconset_dir, 'icon_256x256.png'))
    icons[512].save(os.path.join(iconset_dir, 'icon_256x256@2x.png'))
    icons[512].save(os.path.join(iconset_dir, 'icon_512x512.png'))
    icons[1024].save(os.path.join(iconset_dir, 'icon_512x512@2x.png'))
    
    # Use iconutil to create .icns file
    try:
        subprocess.run(['iconutil', '-c', 'icns', iconset_dir], check=True)
        print("✓ Created icon.icns")
        # Clean up iconset directory
        shutil.rmtree(iconset_dir)
    except subprocess.CalledProcessError as e:
        print(f"Failed to create .icns file: {e}")
    except FileNotFoundError:
        print("iconutil not found - .icns file not created (macOS only)")

# Generate macOS app icon
print("Generating macOS-compliant app icon...")
app_icons = create_macos_app_icon()

# Save main PNG versions
app_icons[512].save('icon.png', 'PNG')
print("✓ Created icon.png (512x512)")

app_icons[1024].save('icon@2x.png', 'PNG')
print("✓ Created icon@2x.png (1024x1024)")

# Create .icns file for macOS
create_icns_file(app_icons)

# Also update Windows .ico
ico_sizes = [16, 32, 48, 64, 128, 256]
ico_images = [app_icons[s] for s in ico_sizes if s in app_icons]
if ico_images:
    ico_images[0].save('icon.ico', format='ICO', sizes=[(s, s) for s in ico_sizes])
    print("✓ Updated icon.ico (Windows)")

print("\n✅ macOS-compliant icons generated successfully!")
print("The icon now follows macOS design guidelines with proper padding and proportions.")