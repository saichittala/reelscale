from PIL import Image

def main():
    # 1. Open original logo
    logo_path = 'public/assets/logo.png'
    logo = Image.open(logo_path).convert("RGBA")
    
    # 2. Define canvas size (1200x630 for open graph)
    canvas_w, canvas_h = 1200, 630
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 255))
    
    # 3. Calculate new logo size (scale it to fit nicely with breathing room)
    # We want the logo to be 800px wide
    target_w = 800
    w_ratio = target_w / float(logo.size[0])
    target_h = int(logo.size[1] * w_ratio)
    
    # Resize logo using high-quality resampling
    resized_logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # 4. Calculate coordinates to center the logo
    x = (canvas_w - target_w) // 2
    y = (canvas_h - target_h) // 2
    
    # 5. Paste logo on canvas (use alpha channel as mask for transparency)
    canvas.paste(resized_logo, (x, y), resized_logo)
    
    # 6. Save the final image as PNG
    canvas.convert("RGB").save('public/assets/logo.png', "PNG")
    print("Successfully created black OG image with exact logo centered!")

if __name__ == '__main__':
    main()
