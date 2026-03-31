from flask import Blueprint, request, jsonify
from app.models import User, Patient
import random

from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.socket_instance import socketio

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user (Doctor or Patient)."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'Doctor')

    if not name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    # Check if user exists
    if User.objects(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(name=name, email=email, password_hash=hashed_password, role=role)
    new_user.save()

    # If role is Patient, create a Patient record for them so they can see their dashboard
    if role == 'Patient':
        ext_id = f"DX-{random.randint(10000, 99999)}"
        new_patient = Patient(
            user_id=new_user, 
            name=name, 
            external_id=ext_id,
            age=data.get('age'),
            gender=data.get('gender')
        )
        new_patient.save()

    # Emit new user registration (mainly for Admins to see new Staff or Patients)
    socketio.emit('new_user', {
        "id": str(new_user.id),
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role,
        "status": "Active",
        "scans": 0
    })

    return jsonify({"message": "User registered successfully", "user": {"id": str(new_user.id), "name": new_user.name, "role": new_user.role}}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user and return a JWT token."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = User.objects(email=email).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        # Create JWT token containing user id as string (identity MUST be a string)
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "message": "Login successful",
            "token": access_token,
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        }), 200

    return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/profile', methods=['GET', 'PUT'], strict_slashes=False)
@jwt_required()
def profile():
    """Retrieve or update the user profile."""
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()
    if not user:
         return jsonify({"error": "User not found"}), 404
         
    if request.method == 'PUT':
        data = request.get_json()
        if 'name' in data: user.name = data['name']
        if 'phone' in data: user.phone = data['phone']
        if 'hospital' in data: user.hospital = data['hospital']
        if 'specialty' in data: user.specialty = data['specialty']
        user.save()
    
    return jsonify({
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone or "",
        "hospital": user.hospital or "",
        "specialty": user.specialty or "",
        "created_at": user.created_at
    }), 200
