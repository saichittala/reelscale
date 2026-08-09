import subprocess

def check_video_info(file_path):
    print(f"\nChecking: {file_path}")
    try:
        # Use python's subprocess to run 'file' command or read binary header info
        # Let's check if the file size is correct.
        with open(file_path, 'rb') as f:
            data = f.read(1024 * 1024)
            # Let's inspect codec details or search for specific profile strings
            # AVC profile_idc is inside the avcC box. Let's do a search for avcC box.
            avcc_idx = data.find(b'avcC')
            if avcc_idx != -1:
                print("Found 'avcC' box at index:", avcc_idx)
                # avcC box header is 4 bytes box size, 4 bytes box type ('avcC')
                # The configuration data starts right after 'avcC'.
                # byte 0: configurationVersion (usually 1)
                # byte 1: AVCProfileIndication
                # byte 2: profile_compatibility
                # byte 3: AVCLevelIndication
                avcc_data = data[avcc_idx + 4 : avcc_idx + 20]
                print(f"avcC raw data: {avcc_data.hex()}")
                profile_idc = avcc_data[1]
                profile_compat = avcc_data[2]
                level_idc = avcc_data[3]
                print(f"AVC Profile Indication: {profile_idc} (hex: {hex(profile_idc)})")
                print(f"AVC Level Indication: {level_idc} (hex: {hex(level_idc)})")
                
                # Profile indications:
                # 66: Baseline
                # 77: Main
                # 100 (0x64): High
                # 110 (0x6e): High 10 (often 10-bit or 4:2:2 / 4:4:4)
                # 122 (0x7a): High 4:2:2
                # 244 (0xf4): High 4:4:4
                if profile_idc == 66:
                    print("Profile: Baseline (YUV 4:2:0) -> Supported")
                elif profile_idc == 77:
                    print("Profile: Main (YUV 4:2:0) -> Supported")
                elif profile_idc == 100:
                    print("Profile: High (YUV 4:2:0) -> Supported")
                elif profile_idc == 110:
                    print("Profile: High 10 (usually 10-bit YUV 4:2:0, sometimes not supported in older browsers)")
                elif profile_idc == 122:
                    print("Profile: High 4:2:2 (NOT SUPPORTED in most browsers!)")
                elif profile_idc == 244:
                    print("Profile: High 4:4:4 (NOT SUPPORTED in most browsers!)")
                else:
                    print(f"Profile: Unknown profile_idc {profile_idc}")
            else:
                print("No 'avcC' box found in first MB. The file might use H.265 (hev1/hvc1) or another codec.")
    except Exception as e:
        print(f"Error checking: {e}")

check_video_info("public/assets/clients/mk-fashions.mp4")
check_video_info("public/assets/clients/mk-fashion.mp4")
