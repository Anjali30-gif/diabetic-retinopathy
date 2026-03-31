import os
import shutil
import glob
import pandas as pd
import kagglehub
from sklearn.model_selection import train_test_split
from src.config import DATASET_DIR, TRAIN_DIR, VAL_DIR, TEST_DIR

def parse_dataset_structure(dataset_name, dataset_path):
    # Specialized logic for eye-diseases dataset
    if "eye-diseases-classification" in dataset_path or "gunavenkatdoddi" in dataset_name:
        class_folders = ['Normal', 'diabetic_retinopathy']
        data = []
        for root, dirs, files in os.walk(dataset_path):
            folder_name = os.path.basename(root)
            if folder_name in class_folders:
                level_str = 'No_DR' if folder_name == 'Normal' else 'Moderate'
                for file in files:
                    if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                        data.append({'image_path': os.path.join(root, file), 'class_name': level_str, 'dataset': dataset_name})
        return pd.DataFrame(data) if data else pd.DataFrame()

    # General logic for the 5-class DR datasets
    # Case 1: Pre-sorted into folders
    class_folders = ['No_DR', 'Mild', 'Moderate', 'Severe', 'Proliferate_DR', 'Proliferative_DR']
    data = []
    
    for root, dirs, files in os.walk(dataset_path):
        folder_name = os.path.basename(root)
        if folder_name in class_folders:
            level_str = 'Proliferative' if 'Proliferat' in folder_name else folder_name
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    data.append({'image_path': os.path.join(root, file), 'class_name': level_str, 'dataset': dataset_name})
                    
    if data:
        return pd.DataFrame(data)

    # Case 2: Flat folder with CSV
    csv_files = glob.glob(os.path.join(dataset_path, '**/*.csv'), recursive=True)
    if not csv_files:
        return pd.DataFrame()
        
    df = pd.read_csv(csv_files[0])
    
    img_col = next((col for col in ['image', 'id_code', 'image_id', 'filename'] if col in df.columns), None)
    label_col = next((col for col in ['level', 'diagnosis', 'class', 'label'] if col in df.columns), None)
            
    if not img_col or not label_col:
        return pd.DataFrame()
    
    level_to_class = {0: 'No_DR', 1: 'Mild', 2: 'Moderate', 3: 'Severe', 4: 'Proliferative'}
    
    img_files = glob.glob(os.path.join(dataset_path, '**/*.jpeg'), recursive=True) + \
                glob.glob(os.path.join(dataset_path, '**/*.png'), recursive=True) + \
                glob.glob(os.path.join(dataset_path, '**/*.jpg'), recursive=True)
                
    img_dir_map = {os.path.basename(f).split('.')[0]: f for f in img_files}
    
    data = []
    for idx, row in df.iterrows():
        try:
            img_id = str(row[img_col]).split('.')[0]
            if img_id in img_dir_map:
                data.append({
                    'image_path': img_dir_map[img_id],
                    'class_name': level_to_class[int(row[label_col])],
                    'dataset': dataset_name
                })
        except:
            continue
            
    return pd.DataFrame(data)

def setup_all_datasets():
    datasets_to_download = [
        "tanlikesmath/diabetic-retinopathy-resized",
        "sovitrath/diabetic-retinopathy-224x224-gaussian-filtered",
        "sovitrath/diabetic-retinopathy-224x224-2019-data",
        "gunavenkatdoddi/eye-diseases-classification"
    ]
    
    all_dataframes = []
    
    for ds in datasets_to_download:
        print(f"\n--- Processing: {ds} ---")
        try:
            dataset_path = kagglehub.dataset_download(ds)
            print(f"Downloaded to {dataset_path}")
            df = parse_dataset_structure(ds, dataset_path)
            
            if df is not None and not df.empty:
                print(f"Successfully mapped {len(df)} images from {ds}")
                all_dataframes.append(df)
            else:
                print(f"Failed to map files for {ds}. Please check dataset structure manually.")
        except Exception as e:
            print(f"Failed to download or process {ds}: {e}")

    if not all_dataframes:
        print("\nError: No images were mapped from any dataset.")
        return
        
    combined_df = pd.concat(all_dataframes, ignore_index=True)
    print(f"\nTotal highly-robust aggregated images across all datasets: {len(combined_df)}")
    
    print("\nCreating stratified splits (80/10/10) over combined super-dataset...")
    train_df, temp_df = train_test_split(combined_df, test_size=0.2, stratify=combined_df['class_name'], random_state=42)
    val_df, test_df = train_test_split(temp_df, test_size=0.5, stratify=temp_df['class_name'], random_state=42)
    
    splits = {
        'train': (train_df, TRAIN_DIR),
        'val': (val_df, VAL_DIR),
        'test': (test_df, TEST_DIR)
    }
    
    for split_name, (split_df, target_base_dir) in splits.items():
        print(f"Copying {split_name} split ({len(split_df)} images) to local project directories...")
        for idx, row in split_df.iterrows():
            src_path = row['image_path']
            class_name = row['class_name']
            
            # Use unique filename to avoid collision across different datasets that might share names like "1.png"
            ds_prefix = row['dataset'].split('/')[-1]
            img_name = f"{ds_prefix}_{os.path.basename(src_path)}"
            
            dest_dir = os.path.join(target_base_dir, class_name)
            os.makedirs(dest_dir, exist_ok=True)
            
            dest_path = os.path.join(dest_dir, img_name)
            
            if not os.path.exists(dest_path):
                shutil.copy2(src_path, dest_path)
                
    print("\nDataset amalgamation completely automated and finished!")

if __name__ == "__main__":
    os.makedirs(DATASET_DIR, exist_ok=True)
    setup_all_datasets()
