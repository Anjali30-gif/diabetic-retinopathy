# Product Design Review (PDR): DR Detect AI Platform

## 1. Executive Summary
DR Detect AI is a production-grade clinical screening platform designed for the early detection and grading of Diabetic Retinopathy (DR). Using a hybrid deep learning architecture fused with a high-performance clinical dashboard, the system provides real-time diagnostic support for medical professionals and clear health records for patients.

## 2. Technical Architecture

### 2.1 Technology Stack
- **Frontend**: React (Vite) with Vanilla CSS (Anti-Gravity Premium Design System).
- **Backend**: Flask (Python 3.x) with JWT-based authentication.
- **Database**: MongoDB (Cloud Hosted) via MongoEngine ODM.
- **Real-Time**: Socket.IO for live dashboard synchronization and scan notifications.
- **AI/ML**: TensorFlow 2.15+, Keras, NumPy, OpenCV.

### 2.2 AI Model Specifications
- **Architecture**: Hybrid Convolutional Neural Network (CNN).
  - **Base 1**: EfficientNet-B0 (optimal feature scaling).
  - **Base 2**: ResNet50 (residual identity mapping).
- **Inference Strategy**: Feature concatenation followed by a custom Dense classification head.
- **Grading Scale**: ETDRS-compatible 5-class grading (No DR, Mild, Moderate, Severe, Proliferative).
- **Loss Function**: Focal Loss (to handle class imbalance in medical datasets).

## 3. Product Features

### 3.1 Multi-Role Clinical Workflows
| Role | Primary Functions |
|---|---|
| **Admin** | Staff management, system-wide scan volume analytics, severity distribution oversight. |
| **Doctor** | Patient registration, retinal image upload, AI-assisted segmented analysis, report generation. |
| **Patient** | Secure access to history records, AI analysis reports (Downloadable), and clinical status tracking. |

### 3.2 Key System Innovations
- **Anti-Gravity UI**: A premium, high-contrast clinical interface with holographic glassmorphism effects.
- **Segmented Deep Analysis**: Visual breakdown of retinal scans into specific anatomical sectors (Exudates, Microaneurysms, Macular zones).
- **Refresh Persistence**: Robust session management ensuring clinical workflows are not interrupted by page reloads.
- **Live Status Monitoring**: Real-time accuracy and training status banner visible across all portals.

## 4. System Requirements

### 4.1 Development Environment
- **Python**: 3.10+
- **Node.js**: 18.x+
- **RAM**: 8GB Minimum (16GB recommended for model training).
- **Storage**: SSD-backed storage for low-latency image processing.

### 4.2 Deployment (Production)
- **WSGI Server**: Gunicorn/Uvicorn for Flask.
- **Reverse Proxy**: Nginx with SSL termination.
- **Static Hosting**: Vercel/Netlify for the Vite frontend.
- **Database**: MongoDB Atlas (M10+ tier recommended for clinical volume).

## 5. Roadmap & Future Enhancements
- [ ] Integration with External HIE (Health Information Exchange) protocols.
- [ ] Mobile App for on-the-go patient record access.
- [ ] Multi-GPU support for high-throughput batch training.
- [ ] AI-driven longitudinal analysis (tracking disease progression over time).
