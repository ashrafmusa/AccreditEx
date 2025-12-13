import firebase_admin
from firebase_admin import credentials, firestore
import json
from pathlib import Path

def upload_all_data_to_firebase():
    """Upload projects, departments, and competencies to Firebase Firestore"""
    
    print("="*80)
    print("🚀 UPLOADING ALL DATA FILES TO FIREBASE")
    print("="*80)
    
    # Initialize Firebase Admin SDK
    try:
        app = firebase_admin.get_app()
        print("✅ Using existing Firebase app")
    except ValueError:
        cred = credentials.Certificate(r"D:\_Projects\accreditex\accreditex-79c08-firebase-adminsdk-fbsvc-0c19a890a8.json")
        app = firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialized")
    
    db = firestore.client()
    
    # Define collections to upload
    collections = [
        {
            'name': 'projects',
            'file': 'projects.json',
            'id_field': 'id',
            'description': '10 OHAS Chapter Projects'
        },
        {
            'name': 'departments',
            'file': 'departments.json',
            'id_field': 'id',
            'description': '22 Healthcare Departments'
        },
        {
            'name': 'competencies',
            'file': 'competencies.json',
            'id_field': 'id',
            'description': '26 Professional Competencies'
        }
    ]
    
    total_uploaded = 0
    
    for collection_config in collections:
        print(f"\n📤 Uploading {collection_config['description']}...")
        print("-"*80)
        
        # Load data
        data_path = Path(__file__).parent.parent / 'src' / 'data' / collection_config['file']
        with open(data_path, 'r', encoding='utf-8') as f:
            documents = json.load(f)
        
        print(f"   📊 Loaded {len(documents)} documents from {collection_config['file']}")
        
        # Upload in batches
        batch = db.batch()
        batch_count = 0
        uploaded = 0
        
        collection_ref = db.collection(collection_config['name'])
        
        for doc in documents:
            doc_id = doc[collection_config['id_field']]
            doc_ref = collection_ref.document(doc_id)
            batch.set(doc_ref, doc)
            batch_count += 1
            
            # Commit batch every 500 operations (Firestore limit)
            if batch_count >= 500:
                batch.commit()
                uploaded += batch_count
                print(f"   ✅ Uploaded batch: {uploaded}/{len(documents)} documents")
                batch = db.batch()
                batch_count = 0
        
        # Commit remaining documents
        if batch_count > 0:
            batch.commit()
            uploaded += batch_count
        
        print(f"   ✅ Completed: {uploaded} documents uploaded to '{collection_config['name']}'")
        total_uploaded += uploaded
    
    print("\n" + "="*80)
    print(f"✅ SUCCESS: All {total_uploaded} documents uploaded to Firebase!")
    print("="*80)
    print("\n📊 SUMMARY:")
    print("   Collections: 3")
    print("   Total Documents: " + str(total_uploaded))
    print("\n✅ Your application data is now complete!")
    print("="*80 + "\n")

if __name__ == "__main__":
    upload_all_data_to_firebase()
