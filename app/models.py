from mongoengine import Document, StringField, IntField, FloatField, DateTimeField, ReferenceField
from datetime import datetime

class User(Document):
    """System user model for authentication and role-based access."""
    meta = {'collection': 'users'}
    name = StringField(max_length=100, required=True)
    email = StringField(max_length=120, unique=True, required=True)
    password_hash = StringField(max_length=256, required=True)
    role = StringField(max_length=50, default='Doctor') # Admin, Doctor, Patient
    phone = StringField(max_length=20)
    hospital = StringField(max_length=100)
    specialty = StringField(max_length=100)
    created_at = DateTimeField(default=datetime.utcnow)

class Patient(Document):
    meta = {'collection': 'patients'}
    user_id = ReferenceField(User, required=True) # The doctor who registered the patient
    name = StringField(max_length=100, required=True)
    external_id = StringField(max_length=50, unique=True, required=True) # e.g. DX-89241
    age = IntField()
    gender = StringField(max_length=20)
    diabetes_history = IntField() # Years since diagnosis
    created_at = DateTimeField(default=datetime.utcnow)

class ScanRecord(Document):
    meta = {'collection': 'scan_records'}
    patient_id = ReferenceField(Patient, required=True)
    doctor_id = ReferenceField(User, required=True)
    image_path = StringField(max_length=300, required=True)
    prediction_label = StringField(max_length=50, required=True)
    confidence = FloatField(required=True)
    severity_level = IntField(required=True) # 0, 25, 50, etc.
    scan_date = DateTimeField(default=datetime.utcnow)
