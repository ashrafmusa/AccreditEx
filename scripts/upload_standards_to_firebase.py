import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
from pathlib import Path

# Project root is one level up from scripts/
PROJECT_ROOT = Path(__file__).resolve().parent.parent

def upload_standards_to_firebase():
    """Upload complete OHAS standards to Firebase Firestore"""
    
    print("="*80)
    print("🚀 UPLOADING OHAS STANDARDS TO FIREBASE")
    print("="*80)
    
    # Initialize Firebase Admin SDK
    try:
        # Try to get existing app
        app = firebase_admin.get_app()
        print("✅ Using existing Firebase app")
    except ValueError:
        # Initialize new app — uses GOOGLE_APPLICATION_CREDENTIALS env var or local key
        sa_key = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if not sa_key:
            sa_key = str(PROJECT_ROOT / "serviceAccountKey.json")
        cred = credentials.Certificate(sa_key)
        app = firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK initialized")
    
    db = firestore.client()
    
    # Load standards from JSON
    standards_path = str(PROJECT_ROOT / "src" / "data" / "standards.json")
    with open(standards_path, 'r', encoding='utf-8') as f:
        standards = json.load(f)
    
    print(f"\n📊 Loaded {len(standards)} standards from file")
    
    # Upload to Firestore
    batch = db.batch()
    batch_count = 0
    total_uploaded = 0
    
    standards_ref = db.collection('standards')
    
    print("\n📤 Uploading to Firestore...")
    print("-"*80)
    
    for idx, standard in enumerate(standards, 1):
        # Use standardId as document ID
        doc_ref = standards_ref.document(standard['standardId'])
        batch.set(doc_ref, standard)
        batch_count += 1
        
        # Firestore batch limit is 500 operations
        if batch_count >= 500:
            batch.commit()
            total_uploaded += batch_count
            print(f"✅ Uploaded batch: {total_uploaded} standards")
            batch = db.batch()
            batch_count = 0
    
    # Commit remaining documents
    if batch_count > 0:
        batch.commit()
        total_uploaded += batch_count
        print(f"✅ Uploaded final batch: {total_uploaded} standards")
    
    print("-"*80)
    print(f"\n✅ SUCCESS: {total_uploaded} standards uploaded to Firebase!")
    
    # Verify upload
    print("\n🔍 Verifying upload...")
    docs = standards_ref.limit(5).stream()
    sample_docs = [doc.to_dict()['standardId'] for doc in docs]
    print(f"✅ Sample standards in Firestore: {', '.join(sample_docs)}")
    
    print("\n" + "="*80)
    print("🎉 UPLOAD COMPLETE!")
    print("="*80)
    print(f"\n📊 Statistics:")
    print(f"   Collection: standards")
    print(f"   Total Documents: {total_uploaded}")
    print(f"   Chapters: 10 (GAL, HRM, CSS, SMCS, QRM, IPC, MMU, PRE, IMS, FMS)")
    print(f"   Total Measures: 1,043")
    print("\n✅ Standards are now available in your Firebase database!")

if __name__ == "__main__":
    try:
        upload_standards_to_firebase()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
