import os
import sys
import webbrowser

def main():
    print("==========================================================================")
    print(" STARTING STUDENT PERFORMANCE PREDICTION SYSTEM")
    print("==========================================================================")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)
    
    metadata_path = os.path.join(base_dir, 'models', 'metadata.json')
    if not os.path.exists(metadata_path):
        print("[1/2] Initializing Student Performance Analytics Engine...")
        try:
            from train_model import train_and_save_models
            train_and_save_models()
        except Exception as e:
            print(f"Notice during training setup: {e}")
    else:
        print("[1/2] Student Performance Checkpoint Metadata Loaded OK.")
        
    print("[2/2] Launching Web Application & API Server on Port 5000...")
    
    try:
        from app import run_server
        webbrowser.open("http://localhost:5000")
        run_server(5000)
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Error starting server: {e}")

if __name__ == '__main__':
    main()
