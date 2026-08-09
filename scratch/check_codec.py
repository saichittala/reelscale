import struct

def check_mp4_codecs(file_path):
    print(f"Inspecting file: {file_path}")
    try:
        with open(file_path, 'rb') as f:
            data = f.read(1024 * 1024) # Read first MB
            
            # Simple signature check
            if b'ftyp' not in data:
                print("Not a valid MP4/ISO file (no ftyp box found)")
                return
                
            # Search for codec indicators like 'avc1' (H.264), 'hev1'/'hvc1' (H.265), 'mp4v'
            codecs = []
            if b'avc1' in data:
                codecs.append("H.264 (AVC)")
            if b'hev1' in data or b'hvc1' in data:
                codecs.append("H.265 (HEVC)")
            if b'vp09' in data:
                codecs.append("VP9")
            if b'av01' in data:
                codecs.append("AV1")
                
            if codecs:
                print(f"Detected codec signatures: {', '.join(codecs)}")
            else:
                print("No standard video codec signature found in first MB.")
    except Exception as e:
        print(f"Error: {e}")

check_mp4_codecs("public/assets/clients/mk-fashions.mp4")
check_mp4_codecs("public/assets/clients/maitrova.mp4")
