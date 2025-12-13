import json
from pathlib import Path

def generate_projects_from_standards():
    """Generate comprehensive projects.json based on all 240 OHAS standards"""
    
    # Load standards
    standards_path = Path(__file__).parent.parent / 'src' / 'data' / 'standards.json'
    with open(standards_path, 'r', encoding='utf-8') as f:
        standards = json.load(f)
    
    # Group standards by chapter
    chapters_map = {}
    for std in standards:
        chapter = std['chapter']
        if chapter not in chapters_map:
            chapters_map[chapter] = []
        chapters_map[chapter].append(std)
    
    # Chapter metadata
    chapter_info = {
        "Chapter 1": {"code": "GAL", "name": "Governance & Leadership Implementation"},
        "Chapter 2": {"code": "HRM", "name": "Human Resources Management Implementation"},
        "Chapter 3": {"code": "CSS", "name": "Compulsory Safety Standards Implementation"},
        "Chapter 4": {"code": "SMCS", "name": "Specialized Medical Care Services Implementation"},
        "Chapter 5": {"code": "QRM", "name": "Quality & Risk Management Implementation"},
        "Chapter 6": {"code": "IPC", "name": "Infection Prevention & Control Implementation"},
        "Chapter 7": {"code": "MMU", "name": "Medication Management & Use Implementation"},
        "Chapter 8": {"code": "PRE", "name": "Patient Rights & Education Implementation"},
        "Chapter 9": {"code": "IMS", "name": "Information Management System Implementation"},
        "Chapter 10": {"code": "FMS", "name": "Facility Management System Implementation"}
    }
    
    projects = []
    
    for chapter_num in sorted(chapters_map.keys(), key=lambda x: int(x.split()[1])):
        chapter_standards = chapters_map[chapter_num]
        info = chapter_info[chapter_num]
        
        # Create checklist items for all standards in this chapter
        checklist = []
        for idx, std in enumerate(chapter_standards, 1):
            # Add main standard checklist item
            checklist.append({
                "id": f"cl-{info['code'].lower()}-{idx}",
                "standardId": std['standardId'],
                "item": std['description'],
                "status": "Not Started",
                "assignedTo": "user-1",
                "notes": "",
                "evidenceFiles": [],
                "actionPlan": None,
                "comments": []
            })
            
            # Add sub-standards as checklist items
            for sub_idx, sub_std in enumerate(std.get('subStandards', []), 1):
                checklist.append({
                    "id": f"cl-{info['code'].lower()}-{idx}-{chr(96+sub_idx)}",
                    "standardId": sub_std['id'],
                    "item": sub_std['description'],
                    "status": "Not Started",
                    "assignedTo": "user-1",
                    "notes": "",
                    "evidenceFiles": [],
                    "actionPlan": None,
                    "comments": []
                })
        
        # Create project
        project = {
            "id": f"proj-ch{chapter_num.split()[1]}-{info['code'].lower()}",
            "name": f"{chapter_num}: {info['name']}",
            "programId": "prog-ohap",
            "chapter": chapter_num,
            "chapterCode": info['code'],
            "status": "Not Started",
            "startDate": None,
            "endDate": None,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z",
            "progress": 0,
            "projectLead": {
                "id": "user-1",
                "name": "Mr. Ashraf Musa",
                "email": "excellencequestconsultancy@gmail.com",
                "role": "Admin"
            },
            "activityLog": [],
            "mockSurveys": [],
            "capaReports": [],
            "designControls": [],
            "pdcaCycles": [],
            "checklist": checklist
        }
        
        projects.append(project)
        print(f"✅ Generated project for {chapter_num} - {info['code']}: {len(checklist)} checklist items")
    
    return projects

def generate_departments_from_standards():
    """Generate comprehensive departments.json based on OHAS chapters"""
    
    departments = [
        # Clinical Departments (SMCS Chapter 4)
        {
            "id": "dep-nursing",
            "name": {"en": "Nursing Services", "ar": "خدمات التمريض"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-bls", "comp-acls", "comp-pals"]
        },
        {
            "id": "dep-or",
            "name": {"en": "Operation Theatre", "ar": "غرفة العمليات"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-bls", "comp-acls", "comp-surgical-tech"]
        },
        {
            "id": "dep-anesthesia",
            "name": {"en": "Anaesthesia Care", "ar": "رعاية التخدير"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-bls", "comp-acls", "comp-anesthesia"]
        },
        {
            "id": "dep-icu",
            "name": {"en": "Critical Care (ICU)", "ar": "الرعاية الحرجة (وحدة العناية المركزة)"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-bls", "comp-acls", "comp-critical-care"]
        },
        {
            "id": "dep-nicu",
            "name": {"en": "Neonatal Intensive Care Unit (NICU)", "ar": "وحدة العناية المركزة لحديثي الولادة"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-bls", "comp-nrp", "comp-pals"]
        },
        {
            "id": "dep-burn",
            "name": {"en": "Burn Care Unit", "ar": "وحدة رعاية الحروق"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-bls", "comp-acls", "comp-burn-care"]
        },
        {
            "id": "dep-obgyn",
            "name": {"en": "Obstetrics & Gynecology", "ar": "التوليد وأمراض النساء"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-bls", "comp-acls", "comp-also"]
        },
        {
            "id": "dep-respiratory",
            "name": {"en": "Respiratory Therapy", "ar": "العلاج التنفسي"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-bls", "comp-rrt"]
        },
        {
            "id": "dep-rehab",
            "name": {"en": "Rehabilitation Services", "ar": "خدمات التأهيل"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-bls", "comp-pt"]
        },
        {
            "id": "dep-nutrition",
            "name": {"en": "Nutrition & Dietetics", "ar": "التغذية والحميات"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-nutrition"]
        },
        {
            "id": "dep-lab",
            "name": {"en": "Diagnostic Laboratory Services", "ar": "خدمات المختبر التشخيصي"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-lab-tech"]
        },
        {
            "id": "dep-radiology",
            "name": {"en": "Diagnostic Imaging & Radiology", "ar": "التصوير التشخيصي والأشعة"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-radiology"]
        },
        {
            "id": "dep-ed",
            "name": {"en": "Emergency Department", "ar": "قسم الطوارئ"},
            "chapterCode": "SMCS",
            "requiredCompetencyIds": ["comp-bls", "comp-acls", "comp-pals", "comp-atls"]
        },
        {
            "id": "dep-pharmacy",
            "name": {"en": "Pharmacy Services", "ar": "خدمات الصيدلية"},
            "chapterCode": "MMU",
            "requiredCompetencyIds": ["comp-pharmacy"]
        },
        # Administrative & Support Departments
        {
            "id": "dep-governance",
            "name": {"en": "Governance & Leadership", "ar": "الحوكمة والقيادة"},
            "chapterCode": "GAL",
            "requiredCompetencyIds": ["comp-leadership"]
        },
        {
            "id": "dep-hr",
            "name": {"en": "Human Resources", "ar": "الموارد البشرية"},
            "chapterCode": "HRM",
            "requiredCompetencyIds": ["comp-hr-mgmt"]
        },
        {
            "id": "dep-quality",
            "name": {"en": "Quality & Risk Management", "ar": "إدارة الجودة والمخاطر"},
            "chapterCode": "QRM",
            "requiredCompetencyIds": ["comp-cphq", "comp-risk-mgmt"]
        },
        {
            "id": "dep-infection-control",
            "name": {"en": "Infection Prevention & Control", "ar": "الوقاية من العدوى ومكافحتها"},
            "chapterCode": "IPC",
            "requiredCompetencyIds": ["comp-cic"]
        },
        {
            "id": "dep-patient-relations",
            "name": {"en": "Patient Rights & Relations", "ar": "حقوق المرضى والعلاقات"},
            "chapterCode": "PRE",
            "requiredCompetencyIds": ["comp-patient-advocacy"]
        },
        {
            "id": "dep-it",
            "name": {"en": "Information Management & IT", "ar": "إدارة المعلومات وتقنية المعلومات"},
            "chapterCode": "IMS",
            "requiredCompetencyIds": ["comp-his", "comp-data-security"]
        },
        {
            "id": "dep-facilities",
            "name": {"en": "Facility Management", "ar": "إدارة المرافق"},
            "chapterCode": "FMS",
            "requiredCompetencyIds": ["comp-facility-mgmt"]
        },
        {
            "id": "dep-safety",
            "name": {"en": "Safety & Security", "ar": "السلامة والأمن"},
            "chapterCode": "CSS",
            "requiredCompetencyIds": ["comp-safety-officer"]
        }
    ]
    
    return departments

def generate_competencies_from_standards():
    """Generate comprehensive competencies.json based on OHAS requirements"""
    
    competencies = [
        # Clinical Competencies
        {
            "id": "comp-bls",
            "name": {"en": "Basic Life Support (BLS)", "ar": "دعم الحياة الأساسي"},
            "description": {
                "en": "Certification in providing basic life support, including CPR and AED usage.",
                "ar": "شهادة في تقديم دعم الحياة الأساسي، بما في ذلك الإنعاش القلبي الرئوي واستخدام جهاز الصدمات الكهربائية."
            },
            "category": "Clinical",
            "validityYears": 2
        },
        {
            "id": "comp-acls",
            "name": {"en": "Advanced Cardiovascular Life Support (ACLS)", "ar": "دعم الحياة القلبي الوعائي المتقدم"},
            "description": {
                "en": "Certification for managing cardiovascular emergencies.",
                "ar": "شهادة لإدارة طوارئ القلب والأوعية الدموية."
            },
            "category": "Clinical",
            "validityYears": 2
        },
        {
            "id": "comp-pals",
            "name": {"en": "Pediatric Advanced Life Support (PALS)", "ar": "دعم الحياة المتقدم للأطفال"},
            "description": {
                "en": "Certification for managing pediatric emergencies.",
                "ar": "شهادة لإدارة حالات الطوارئ للأطفال."
            },
            "category": "Clinical",
            "validityYears": 2
        },
        {
            "id": "comp-nrp",
            "name": {"en": "Neonatal Resuscitation Program (NRP)", "ar": "برنامج الإنعاش لحديثي الولادة"},
            "description": {
                "en": "Certification for neonatal resuscitation and emergency care.",
                "ar": "شهادة للإنعاش ورعاية الطوارئ لحديثي الولادة."
            },
            "category": "Clinical",
            "validityYears": 2
        },
        {
            "id": "comp-atls",
            "name": {"en": "Advanced Trauma Life Support (ATLS)", "ar": "دعم الحياة المتقدم للإصابات"},
            "description": {
                "en": "Certification for managing trauma patients.",
                "ar": "شهادة لإدارة مرضى الإصابات."
            },
            "category": "Clinical",
            "validityYears": 4
        },
        {
            "id": "comp-also",
            "name": {"en": "Advanced Life Support in Obstetrics (ALSO)", "ar": "دعم الحياة المتقدم في التوليد"},
            "description": {
                "en": "Certification for managing obstetric emergencies.",
                "ar": "شهادة لإدارة حالات الطوارئ التوليدية."
            },
            "category": "Clinical",
            "validityYears": 5
        },
        {
            "id": "comp-critical-care",
            "name": {"en": "Critical Care Nursing Certification", "ar": "شهادة التمريض في الرعاية الحرجة"},
            "description": {
                "en": "Specialized certification for intensive care unit nursing.",
                "ar": "شهادة متخصصة للتمريض في وحدة العناية المركزة."
            },
            "category": "Clinical",
            "validityYears": 3
        },
        {
            "id": "comp-anesthesia",
            "name": {"en": "Anesthesia Certification", "ar": "شهادة التخدير"},
            "description": {
                "en": "Certification for anesthesia professionals.",
                "ar": "شهادة لمتخصصي التخدير."
            },
            "category": "Clinical",
            "validityYears": 5
        },
        {
            "id": "comp-surgical-tech",
            "name": {"en": "Surgical Technology Certification", "ar": "شهادة تقنية الجراحة"},
            "description": {
                "en": "Certification for surgical technologists and OR staff.",
                "ar": "شهادة لتقنيي الجراحة وموظفي غرفة العمليات."
            },
            "category": "Clinical",
            "validityYears": 4
        },
        {
            "id": "comp-burn-care",
            "name": {"en": "Burn Care Specialist", "ar": "أخصائي رعاية الحروق"},
            "description": {
                "en": "Specialized training in burn care management.",
                "ar": "تدريب متخصص في إدارة رعاية الحروق."
            },
            "category": "Clinical",
            "validityYears": 3
        },
        {
            "id": "comp-rrt",
            "name": {"en": "Registered Respiratory Therapist (RRT)", "ar": "أخصائي علاج تنفسي مسجل"},
            "description": {
                "en": "Certification for respiratory therapy professionals.",
                "ar": "شهادة لمتخصصي العلاج التنفسي."
            },
            "category": "Clinical",
            "validityYears": 5
        },
        {
            "id": "comp-pt",
            "name": {"en": "Physical Therapy License", "ar": "ترخيص العلاج الطبيعي"},
            "description": {
                "en": "Professional license for physical therapists.",
                "ar": "ترخيص مهني لأخصائيي العلاج الطبيعي."
            },
            "category": "Clinical",
            "validityYears": 5
        },
        {
            "id": "comp-nutrition",
            "name": {"en": "Clinical Nutrition Specialist", "ar": "أخصائي التغذية السريرية"},
            "description": {
                "en": "Certification for clinical nutrition and dietetics.",
                "ar": "شهادة في التغذية السريرية والحميات."
            },
            "category": "Clinical",
            "validityYears": 5
        },
        {
            "id": "comp-lab-tech",
            "name": {"en": "Medical Laboratory Technologist", "ar": "تقني مختبر طبي"},
            "description": {
                "en": "Certification for medical laboratory professionals.",
                "ar": "شهادة لمتخصصي المختبرات الطبية."
            },
            "category": "Clinical",
            "validityYears": 5
        },
        {
            "id": "comp-radiology",
            "name": {"en": "Radiologic Technologist", "ar": "تقني أشعة"},
            "description": {
                "en": "Certification for radiology and imaging professionals.",
                "ar": "شهادة لمتخصصي الأشعة والتصوير."
            },
            "category": "Clinical",
            "validityYears": 5
        },
        {
            "id": "comp-pharmacy",
            "name": {"en": "Licensed Pharmacist", "ar": "صيدلي مرخص"},
            "description": {
                "en": "Professional pharmacy license and certification.",
                "ar": "ترخيص وشهادة الصيدلة المهنية."
            },
            "category": "Clinical",
            "validityYears": 5
        },
        # Quality & Safety Competencies
        {
            "id": "comp-cphq",
            "name": {"en": "Certified Professional in Healthcare Quality (CPHQ)", "ar": "محترف معتمد في جودة الرعاية الصحية"},
            "description": {
                "en": "Professional certification for healthcare quality management professionals.",
                "ar": "شهادة مهنية لمتخصصي إدارة جودة الرعاية الصحية."
            },
            "category": "Quality & Safety",
            "validityYears": 3
        },
        {
            "id": "comp-cic",
            "name": {"en": "Certification in Infection Control (CIC)", "ar": "شهادة في مكافحة العدوى"},
            "description": {
                "en": "Certification for professionals in infection prevention and control.",
                "ar": "شهادة للمهنيين في مجال الوقاية من العدوى ومكافحتها."
            },
            "category": "Quality & Safety",
            "validityYears": 5
        },
        {
            "id": "comp-risk-mgmt",
            "name": {"en": "Healthcare Risk Management Certification", "ar": "شهادة إدارة المخاطر الصحية"},
            "description": {
                "en": "Certification in healthcare risk management and patient safety.",
                "ar": "شهادة في إدارة المخاطر الصحية وسلامة المرضى."
            },
            "category": "Quality & Safety",
            "validityYears": 3
        },
        {
            "id": "comp-safety-officer",
            "name": {"en": "Healthcare Safety Officer", "ar": "ضابط السلامة الصحية"},
            "description": {
                "en": "Certification for hospital safety and security management.",
                "ar": "شهادة لإدارة سلامة وأمن المستشفى."
            },
            "category": "Quality & Safety",
            "validityYears": 3
        },
        # Administrative Competencies
        {
            "id": "comp-leadership",
            "name": {"en": "Healthcare Leadership Certification", "ar": "شهادة القيادة الصحية"},
            "description": {
                "en": "Professional certification in healthcare leadership and governance.",
                "ar": "شهادة مهنية في القيادة والحوكمة الصحية."
            },
            "category": "Administrative",
            "validityYears": 5
        },
        {
            "id": "comp-hr-mgmt",
            "name": {"en": "Human Resources Management Certification", "ar": "شهادة إدارة الموارد البشرية"},
            "description": {
                "en": "Certification in healthcare human resources management.",
                "ar": "شهادة في إدارة الموارد البشرية الصحية."
            },
            "category": "Administrative",
            "validityYears": 3
        },
        {
            "id": "comp-patient-advocacy",
            "name": {"en": "Patient Advocacy Certification", "ar": "شهادة المناصرة للمرضى"},
            "description": {
                "en": "Certification in patient rights and advocacy.",
                "ar": "شهادة في حقوق المرضى والمناصرة."
            },
            "category": "Administrative",
            "validityYears": 3
        },
        {
            "id": "comp-his",
            "name": {"en": "Healthcare Information Systems", "ar": "نظم المعلومات الصحية"},
            "description": {
                "en": "Certification in healthcare information systems and EMR management.",
                "ar": "شهادة في نظم المعلومات الصحية وإدارة السجلات الطبية الإلكترونية."
            },
            "category": "IT",
            "validityYears": 3
        },
        {
            "id": "comp-data-security",
            "name": {"en": "Healthcare Data Security Certification", "ar": "شهادة أمن البيانات الصحية"},
            "description": {
                "en": "Certification in healthcare data security and HIPAA compliance.",
                "ar": "شهادة في أمن البيانات الصحية والامتثال للخصوصية."
            },
            "category": "IT",
            "validityYears": 2
        },
        {
            "id": "comp-facility-mgmt",
            "name": {"en": "Healthcare Facility Management", "ar": "إدارة المرافق الصحية"},
            "description": {
                "en": "Certification in healthcare facility and infrastructure management.",
                "ar": "شهادة في إدارة المرافق والبنية التحتية الصحية."
            },
            "category": "Facilities",
            "validityYears": 5
        }
    ]
    
    return competencies

def main():
    """Generate all three files"""
    
    print("\n" + "="*80)
    print("🚀 GENERATING COMPREHENSIVE DATA FILES FROM OHAS STANDARDS")
    print("="*80)
    
    # Generate projects
    print("\n📋 Step 1: Generating projects.json...")
    projects = generate_projects_from_standards()
    projects_path = Path(__file__).parent.parent / 'src' / 'data' / 'projects.json'
    
    # Backup old file
    if projects_path.exists():
        backup_path = projects_path.with_suffix('.backup.json')
        import shutil
        shutil.copy(projects_path, backup_path)
        print(f"   💾 Backup saved: {backup_path.name}")
    
    with open(projects_path, 'w', encoding='utf-8') as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)
    
    total_checklist_items = sum(len(p['checklist']) for p in projects)
    print(f"   ✅ Generated {len(projects)} projects with {total_checklist_items} total checklist items")
    
    # Generate departments
    print("\n🏥 Step 2: Generating departments.json...")
    departments = generate_departments_from_standards()
    departments_path = Path(__file__).parent.parent / 'src' / 'data' / 'departments.json'
    
    # Backup old file
    if departments_path.exists():
        backup_path = departments_path.with_suffix('.backup.json')
        shutil.copy(departments_path, backup_path)
        print(f"   💾 Backup saved: {backup_path.name}")
    
    with open(departments_path, 'w', encoding='utf-8') as f:
        json.dump(departments, f, indent=2, ensure_ascii=False)
    
    print(f"   ✅ Generated {len(departments)} departments")
    
    # Generate competencies
    print("\n🎓 Step 3: Generating competencies.json...")
    competencies = generate_competencies_from_standards()
    competencies_path = Path(__file__).parent.parent / 'src' / 'data' / 'competencies.json'
    
    # Backup old file
    if competencies_path.exists():
        backup_path = competencies_path.with_suffix('.backup.json')
        shutil.copy(competencies_path, backup_path)
        print(f"   💾 Backup saved: {backup_path.name}")
    
    with open(competencies_path, 'w', encoding='utf-8') as f:
        json.dump(competencies, f, indent=2, ensure_ascii=False)
    
    print(f"   ✅ Generated {len(competencies)} competencies")
    
    # Summary
    print("\n" + "="*80)
    print("✅ SUCCESS: All files generated!")
    print("="*80)
    print(f"\n📊 SUMMARY:")
    print(f"   Projects:      {len(projects)} (covering all 10 OHAS chapters)")
    print(f"   Checklist:     {total_checklist_items} items (240 standards + 1,043 measures)")
    print(f"   Departments:   {len(departments)} (clinical + administrative)")
    print(f"   Competencies:  {len(competencies)} (clinical, quality, admin, IT, facilities)")
    print(f"\n✅ Files ready to use in your application!")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
