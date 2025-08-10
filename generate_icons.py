#!/usr/bin/env python3
"""
Generate modern icons for Quick AI Desktop app
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_menubar_icon(theme='light', retina=False):
    """Create a minimalist AI-themed menubar icon"""
    # Menubar icons are typically 22x22 pixels on macOS
    # For retina displays, we need 44x44 (@2x)
    base_size = 22
    size = (base_size * 2, base_size * 2) if retina else (base_size, base_size)
    scale = 8  # Create at higher resolution then scale down for better quality
    img_size = (base_size * scale, base_size * scale)
    
    # Create transparent background
    img = Image.new('RGBA', img_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Color based on theme
    if theme == 'light':
        color = (0, 0, 0, 200)  # Dark icon for light menubar
    else:
        color = (255, 255, 255, 200)  # Light icon for dark menubar
    
    # Draw a modern AI brain/circuit design
    center_x, center_y = img_size[0] // 2, img_size[1] // 2
    
    # Draw hexagon shape (represents AI/tech)
    import math
    radius = img_size[0] // 3
    angles = [i * 60 for i in range(6)]
    points = []
    for angle in angles:
        x = center_x + radius * math.cos(math.radians(angle - 30))
        y = center_y + radius * math.sin(math.radians(angle - 30))
        points.append((x, y))
    
    # Draw hexagon outline
    for i in range(len(points)):
        start = points[i]
        end = points[(i + 1) % len(points)]
        draw.line([start, end], fill=color, width=scale * 2)
    
    # Draw inner circuit pattern
    # Center dot
    dot_radius = scale * 2
    draw.ellipse([center_x - dot_radius, center_y - dot_radius, 
                  center_x + dot_radius, center_y + dot_radius], 
                 fill=color)
    
    # Draw lines from center to vertices
    for point in points[::2]:  # Every other point for cleaner look
        draw.line([center_x, center_y, point[0], point[1]], 
                 fill=color, width=scale)
    
    # Scale down to actual size with antialiasing
    img = img.resize(size, Image.Resampling.LANCZOS)
    
    return img

def create_app_icon():
    """Create main app icon with gradient and modern design"""
    sizes = [16, 32, 64, 128, 256, 512, 1024]
    
    # Create the largest size first
    max_size = 1024
    img = Image.new('RGBA', (max_size, max_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Create gradient background (purple to blue)
    for y in range(max_size):
        # Gradient from purple to blue
        r = int(130 - (y / max_size) * 50)
        g = int(70 + (y / max_size) * 30)
        b = int(180 + (y / max_size) * 75)
        draw.rectangle([(0, y), (max_size, y + 1)], fill=(r, g, b, 255))
    
    # Round the corners
    # Create mask for rounded corners
    mask = Image.new('L', (max_size, max_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    corner_radius = max_size // 5
    mask_draw.rounded_rectangle([(0, 0), (max_size, max_size)], 
                                radius=corner_radius, fill=255)
    
    # Apply mask
    output = Image.new('RGBA', (max_size, max_size), (0, 0, 0, 0))
    output.paste(img, (0, 0))
    output.putalpha(mask)
    img = output
    draw = ImageDraw.Draw(img)
    
    # Draw AI symbol - stylized neural network nodes
    center_x, center_y = max_size // 2, max_size // 2
    
    # Draw hexagon network
    radius = max_size // 3
    import math
    
    # Outer hexagon points
    angles = [i * 60 for i in range(6)]
    outer_points = []
    for angle in angles:
        x = center_x + radius * math.cos(math.radians(angle - 30))
        y = center_y + radius * math.sin(math.radians(angle - 30))
        outer_points.append((x, y))
    
    # Draw connections between nodes
    for i, point1 in enumerate(outer_points):
        for j, point2 in enumerate(outer_points):
            if i < j:
                draw.line([point1, point2], fill=(255, 255, 255, 50), width=4)
    
    # Draw outer nodes
    node_radius = max_size // 20
    for point in outer_points:
        # White glow
        for i in range(3):
            glow_radius = node_radius + (i * 10)
            alpha = 30 - (i * 10)
            draw.ellipse([point[0] - glow_radius, point[1] - glow_radius,
                         point[0] + glow_radius, point[1] + glow_radius],
                        fill=(255, 255, 255, alpha))
        # Solid white node
        draw.ellipse([point[0] - node_radius, point[1] - node_radius,
                     point[0] + node_radius, point[1] + node_radius],
                    fill=(255, 255, 255, 255))
    
    # Draw center node (larger)
    center_radius = node_radius * 2
    # Glow effect
    for i in range(3):
        glow_radius = center_radius + (i * 15)
        alpha = 40 - (i * 12)
        draw.ellipse([center_x - glow_radius, center_y - glow_radius,
                     center_x + glow_radius, center_y + glow_radius],
                    fill=(255, 255, 255, alpha))
    # Solid center
    draw.ellipse([center_x - center_radius, center_y - center_radius,
                 center_x + center_radius, center_y + center_radius],
                fill=(255, 255, 255, 255))
    
    # Create icons in different sizes
    icons = {}
    for size in sizes:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        icons[size] = resized
    
    return icons

# Generate menubar icons (both regular and retina)
print("Generating menubar icons...")

# Regular resolution (22x22)
light_icon = create_menubar_icon('light', retina=False)
light_icon.save('menubar-icon-light.png', 'PNG')
print("✓ Created menubar-icon-light.png (22x22)")

dark_icon = create_menubar_icon('dark', retina=False)
dark_icon.save('menubar-icon-dark.png', 'PNG')
print("✓ Created menubar-icon-dark.png (22x22)")

# Retina resolution (44x44)
light_icon_2x = create_menubar_icon('light', retina=True)
light_icon_2x.save('menubar-icon-light@2x.png', 'PNG')
print("✓ Created menubar-icon-light@2x.png (44x44)")

dark_icon_2x = create_menubar_icon('dark', retina=True)
dark_icon_2x.save('menubar-icon-dark@2x.png', 'PNG')
print("✓ Created menubar-icon-dark@2x.png (44x44)")

# Generate app icon
print("\nGenerating app icon...")
app_icons = create_app_icon()

# Save main icon
app_icons[512].save('icon.png', 'PNG')
print("✓ Created icon.png (512x512)")

# Create ico file for Windows (multiple sizes)
if len(app_icons) > 0:
    # Windows ico can contain multiple sizes
    ico_sizes = [16, 32, 48, 64, 128, 256]
    ico_images = [app_icons[s] for s in ico_sizes if s in app_icons]
    if ico_images:
        ico_images[0].save('icon.ico', format='ICO', sizes=[(s, s) for s in ico_sizes])
        print("✓ Created icon.ico (Windows)")

print("\n✅ All icons generated successfully!")