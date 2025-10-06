from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import io
import json
import jwt
from passlib.context import CryptContext
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT and Password Setup
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-here')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Industrial Analytics Platform", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ML Model Storage
ml_models = {}
model_dir = ROOT_DIR / "ml_models"
model_dir.mkdir(exist_ok=True)

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    hashed_password: str
    role: str = "operator"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "operator"

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Machine(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    site: str
    status: str = "operational"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MachineCreate(BaseModel):
    name: str
    type: str
    site: str
    status: str = "operational"

class ProductionData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    machine_id: str
    date: str
    output: float
    downtime: float
    efficiency: float
    oee: float = 0.0
    quality_rate: float = 1.0
    availability: float = 1.0
    performance: float = 1.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductionDataCreate(BaseModel):
    machine_id: str
    date: str
    output: float
    downtime: float
    efficiency: float
    quality_rate: float = 1.0

class MaintenanceLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    machine_id: str
    type: str
    duration: float
    technician: str
    notes: str = ""
    date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MaintenanceLogCreate(BaseModel):
    machine_id: str
    type: str
    duration: float
    technician: str
    notes: str = ""
    date: str

class Prediction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    machine_id: str
    date: str
    predicted_efficiency: float
    predicted_oee: float
    confidence: float
    model_version: str = "1.0"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DashboardKPIs(BaseModel):
    total_machines: int
    average_oee: float
    total_downtime: float
    average_efficiency: float
    production_output: float
    mtbf: float
    maintenance_alerts: int

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

def calculate_oee(output: float, downtime: float, efficiency: float, quality_rate: float = 1.0, planned_production_time: float = 480.0):
    """Calculate OEE (Overall Equipment Effectiveness)"""
    availability = max(0, (planned_production_time - downtime) / planned_production_time)
    performance = min(1.0, efficiency / 100.0)  # Assuming efficiency is a percentage
    quality = quality_rate
    oee = availability * performance * quality
    return {
        'oee': round(oee * 100, 2),
        'availability': round(availability * 100, 2),
        'performance': round(performance * 100, 2),
        'quality': round(quality * 100, 2)
    }

async def generate_sample_data():
    """Generate sample data for demonstration"""
    # Create sample machines
    machines = [
        {"name": "Conveyor Line A", "type": "Conveyor", "site": "Factory 1"},
        {"name": "Assembly Robot B", "type": "Robot", "site": "Factory 1"},
        {"name": "Packaging Unit C", "type": "Packaging", "site": "Factory 2"},
        {"name": "Quality Checker D", "type": "Inspection", "site": "Factory 2"},
    ]
    
    machine_ids = []
    for machine_data in machines:
        existing = await db.machines.find_one({"name": machine_data["name"]})
        if not existing:
            machine = Machine(**machine_data)
            await db.machines.insert_one(machine.dict())
            machine_ids.append(machine.id)
        else:
            machine_ids.append(existing["id"])
    
    # Generate production data for the last 30 days
    for machine_id in machine_ids:
        for i in range(30):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            existing = await db.production_data.find_one({"machine_id": machine_id, "date": date})
            if not existing:
                # Simulate realistic production data
                base_output = random.uniform(800, 1200)
                base_downtime = random.uniform(10, 60)
                base_efficiency = random.uniform(75, 95)
                quality_rate = random.uniform(0.92, 0.99)
                
                oee_data = calculate_oee(base_output, base_downtime, base_efficiency, quality_rate)
                
                production = ProductionDataCreate(
                    machine_id=machine_id,
                    date=date,
                    output=base_output,
                    downtime=base_downtime,
                    efficiency=base_efficiency,
                    quality_rate=quality_rate
                )
                
                production_dict = production.dict()
                production_dict.update(oee_data)
                production_dict['id'] = str(uuid.uuid4())
                production_dict['created_at'] = datetime.now(timezone.utc)
                
                await db.production_data.insert_one(production_dict)

# Authentication Routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )
    
    await db.users.insert_one(user.dict())
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Machine Routes
@api_router.get("/machines", response_model=List[Machine])
async def get_machines(current_user: User = Depends(get_current_user)):
    machines = await db.machines.find().to_list(1000)
    return [Machine(**machine) for machine in machines]

@api_router.post("/machines", response_model=Machine)
async def create_machine(machine_data: MachineCreate, current_user: User = Depends(get_current_user)):
    machine = Machine(**machine_data.dict())
    await db.machines.insert_one(machine.dict())
    return machine

@api_router.get("/machines/{machine_id}", response_model=Machine)
async def get_machine(machine_id: str, current_user: User = Depends(get_current_user)):
    machine = await db.machines.find_one({"id": machine_id})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return Machine(**machine)

# Production Data Routes
@api_router.get("/production", response_model=List[ProductionData])
async def get_production_data(
    machine_id: Optional[str] = None, 
    days: int = 30, 
    current_user: User = Depends(get_current_user)
):
    query = {}
    if machine_id:
        query["machine_id"] = machine_id
    
    # Get data from the last N days
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    query["date"] = {"$gte": start_date}
    
    production_data = await db.production_data.find(query).to_list(1000)
    return [ProductionData(**data) for data in production_data]

@api_router.post("/production", response_model=ProductionData)
async def create_production_data(
    data: ProductionDataCreate, 
    current_user: User = Depends(get_current_user)
):
    # Calculate OEE
    oee_data = calculate_oee(data.output, data.downtime, data.efficiency, data.quality_rate)
    
    production_dict = data.dict()
    production_dict.update(oee_data)
    production_dict['id'] = str(uuid.uuid4())
    production_dict['created_at'] = datetime.now(timezone.utc)
    
    production = ProductionData(**production_dict)
    await db.production_data.insert_one(production.dict())
    return production

# CSV Upload Route
@api_router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        required_columns = ['machine_id', 'date', 'output', 'downtime', 'efficiency']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing_columns}")
        
        uploaded_count = 0
        for _, row in df.iterrows():
            # Calculate OEE
            quality_rate = row.get('quality_rate', 1.0)
            oee_data = calculate_oee(row['output'], row['downtime'], row['efficiency'], quality_rate)
            
            production_dict = {
                'id': str(uuid.uuid4()),
                'machine_id': str(row['machine_id']),
                'date': str(row['date']),
                'output': float(row['output']),
                'downtime': float(row['downtime']),
                'efficiency': float(row['efficiency']),
                'quality_rate': quality_rate,
                'created_at': datetime.now(timezone.utc)
            }
            production_dict.update(oee_data)
            
            # Check if data already exists
            existing = await db.production_data.find_one({
                "machine_id": production_dict['machine_id'],
                "date": production_dict['date']
            })
            
            if not existing:
                await db.production_data.insert_one(production_dict)
                uploaded_count += 1
        
        return {"message": f"Successfully uploaded {uploaded_count} records", "total_rows": len(df)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

# ML Prediction Routes
@api_router.post("/ml/train")
async def train_model(current_user: User = Depends(get_current_user)):
    try:
        # Get production data for training
        production_data = await db.production_data.find().to_list(1000)
        
        if len(production_data) < 10:
            raise HTTPException(status_code=400, detail="Not enough data to train model. Need at least 10 records.")
        
        # Prepare data for training
        df = pd.DataFrame(production_data)
        
        # Feature engineering
        df['date'] = pd.to_datetime(df['date'])
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        
        # Features and target
        features = ['output', 'downtime', 'day_of_week', 'month']
        X = df[features]
        y_efficiency = df['efficiency']
        y_oee = df['oee']
        
        # Train efficiency model
        X_train, X_test, y_train, y_test = train_test_split(X, y_efficiency, test_size=0.2, random_state=42)
        
        efficiency_model = RandomForestRegressor(n_estimators=100, random_state=42)
        efficiency_model.fit(X_train, y_train)
        
        # Train OEE model
        oee_model = RandomForestRegressor(n_estimators=100, random_state=42)
        oee_model.fit(X_train, y_oee)
        
        # Calculate metrics
        efficiency_pred = efficiency_model.predict(X_test)
        efficiency_r2 = r2_score(y_test, efficiency_pred)
        efficiency_mse = mean_squared_error(y_test, efficiency_pred)
        
        oee_pred = oee_model.predict(X_test)
        oee_r2 = r2_score(df['oee'].iloc[X_test.index], oee_pred)
        
        # Save models
        model_path_efficiency = model_dir / "efficiency_model.joblib"
        model_path_oee = model_dir / "oee_model.joblib"
        
        joblib.dump(efficiency_model, model_path_efficiency)
        joblib.dump(oee_model, model_path_oee)
        
        # Store in memory for quick access
        ml_models['efficiency'] = efficiency_model
        ml_models['oee'] = oee_model
        
        return {
            "message": "Model trained successfully",
            "efficiency_r2_score": efficiency_r2,
            "efficiency_mse": efficiency_mse,
            "oee_r2_score": oee_r2,
            "training_samples": len(df)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")

@api_router.post("/ml/predict/{machine_id}")
async def predict_performance(
    machine_id: str, 
    days_ahead: int = 7, 
    current_user: User = Depends(get_current_user)
):
    try:
        # Load models if not in memory
        if 'efficiency' not in ml_models:
            model_path_efficiency = model_dir / "efficiency_model.joblib"
            model_path_oee = model_dir / "oee_model.joblib"
            
            if model_path_efficiency.exists() and model_path_oee.exists():
                ml_models['efficiency'] = joblib.load(model_path_efficiency)
                ml_models['oee'] = joblib.load(model_path_oee)
            else:
                raise HTTPException(status_code=400, detail="No trained model found. Train a model first.")
        
        # Get recent data for the machine
        recent_data = await db.production_data.find(
            {"machine_id": machine_id}
        ).sort("date", -1).limit(5).to_list(5)
        
        if not recent_data:
            raise HTTPException(status_code=404, detail="No production data found for this machine")
        
        predictions = []
        
        # Generate predictions for the next N days
        for i in range(1, days_ahead + 1):
            future_date = (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d")
            future_datetime = datetime.now() + timedelta(days=i)
            
            # Use average of recent data as baseline
            avg_output = np.mean([d['output'] for d in recent_data])
            avg_downtime = np.mean([d['downtime'] for d in recent_data])
            
            # Feature vector
            features = [
                avg_output,
                avg_downtime,
                future_datetime.weekday(),
                future_datetime.month
            ]
            
            # Make predictions
            efficiency_pred = ml_models['efficiency'].predict([features])[0]
            oee_pred = ml_models['oee'].predict([features])[0]
            
            # Calculate confidence (simplified)
            confidence = min(0.95, max(0.5, 1.0 - (i * 0.05)))  # Decreasing confidence over time
            
            prediction = Prediction(
                machine_id=machine_id,
                date=future_date,
                predicted_efficiency=round(efficiency_pred, 2),
                predicted_oee=round(oee_pred, 2),
                confidence=round(confidence, 2)
            )
            
            # Store prediction
            await db.predictions.insert_one(prediction.dict())
            predictions.append(prediction)
        
        return predictions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making predictions: {str(e)}")

@api_router.get("/predictions/{machine_id}", response_model=List[Prediction])
async def get_predictions(machine_id: str, current_user: User = Depends(get_current_user)):
    predictions = await db.predictions.find({"machine_id": machine_id}).sort("date", 1).to_list(100)
    return [Prediction(**pred) for pred in predictions]

# Dashboard Routes
@api_router.get("/dashboard", response_model=DashboardKPIs)
async def get_dashboard_kpis(current_user: User = Depends(get_current_user)):
    try:
        # Get all machines
        machines_count = await db.machines.count_documents({})
        
        # Get recent production data (last 7 days)
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        recent_production = await db.production_data.find(
            {"date": {"$gte": start_date}}
        ).to_list(1000)
        
        if not recent_production:
            # Return default values if no data
            return DashboardKPIs(
                total_machines=machines_count,
                average_oee=0.0,
                total_downtime=0.0,
                average_efficiency=0.0,
                production_output=0.0,
                mtbf=0.0,
                maintenance_alerts=0
            )
        
        # Calculate KPIs
        df = pd.DataFrame(recent_production)
        
        avg_oee = df['oee'].mean()
        total_downtime = df['downtime'].sum()
        avg_efficiency = df['efficiency'].mean()
        total_output = df['output'].sum()
        
        # MTBF calculation (simplified)
        total_operating_time = len(recent_production) * 24  # hours
        mtbf = total_operating_time / max(1, len(recent_production))
        
        # Maintenance alerts (machines with high downtime)
        maintenance_alerts = len(df[df['downtime'] > 50])
        
        return DashboardKPIs(
            total_machines=machines_count,
            average_oee=round(avg_oee, 2),
            total_downtime=round(total_downtime, 2),
            average_efficiency=round(avg_efficiency, 2),
            production_output=round(total_output, 2),
            mtbf=round(mtbf, 2),
            maintenance_alerts=maintenance_alerts
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating KPIs: {str(e)}")

@api_router.get("/analytics/trends")
async def get_trends(
    machine_id: Optional[str] = None, 
    days: int = 30, 
    current_user: User = Depends(get_current_user)
):
    try:
        query = {}
        if machine_id:
            query["machine_id"] = machine_id
        
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        query["date"] = {"$gte": start_date}
        
        production_data = await db.production_data.find(query).sort("date", 1).to_list(1000)
        
        if not production_data:
            return {"data": [], "message": "No data available"}
        
        # Process data for trends
        df = pd.DataFrame(production_data)
        
        # Group by date and calculate averages
        daily_trends = df.groupby('date').agg({
            'oee': 'mean',
            'efficiency': 'mean',
            'output': 'sum',
            'downtime': 'sum'
        }).reset_index()
        
        trends_data = daily_trends.to_dict('records')
        
        return {
            "data": trends_data,
            "summary": {
                "total_records": len(production_data),
                "date_range": f"{start_date} to {datetime.now().strftime('%Y-%m-%d')}",
                "machines_count": len(df['machine_id'].unique())
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting trends: {str(e)}")

# Maintenance Routes
@api_router.get("/maintenance", response_model=List[MaintenanceLog])
async def get_maintenance_logs(current_user: User = Depends(get_current_user)):
    logs = await db.maintenance_logs.find().sort("date", -1).to_list(100)
    return [MaintenanceLog(**log) for log in logs]

@api_router.post("/maintenance", response_model=MaintenanceLog)
async def create_maintenance_log(
    log_data: MaintenanceLogCreate, 
    current_user: User = Depends(get_current_user)
):
    log = MaintenanceLog(**log_data.dict())
    await db.maintenance_logs.insert_one(log.dict())
    return log

# Real-time Data Simulation
@api_router.post("/simulate-data")
async def simulate_real_time_data(current_user: User = Depends(get_current_user)):
    """Generate real-time simulation data"""
    try:
        machines = await db.machines.find().to_list(1000)
        if not machines:
            raise HTTPException(status_code=400, detail="No machines found. Create machines first.")
        
        today = datetime.now().strftime("%Y-%m-%d")
        simulated_count = 0
        
        for machine in machines:
            # Check if data already exists for today
            existing = await db.production_data.find_one({
                "machine_id": machine["id"],
                "date": today
            })
            
            if not existing:
                # Generate realistic data
                base_output = random.uniform(800, 1200)
                base_downtime = random.uniform(5, 45)
                base_efficiency = random.uniform(80, 95)
                quality_rate = random.uniform(0.92, 0.99)
                
                oee_data = calculate_oee(base_output, base_downtime, base_efficiency, quality_rate)
                
                production_dict = {
                    'id': str(uuid.uuid4()),
                    'machine_id': machine["id"],
                    'date': today,
                    'output': base_output,
                    'downtime': base_downtime,
                    'efficiency': base_efficiency,
                    'quality_rate': quality_rate,
                    'created_at': datetime.now(timezone.utc)
                }
                production_dict.update(oee_data)
                
                await db.production_data.insert_one(production_dict)
                simulated_count += 1
        
        return {
            "message": f"Generated real-time data for {simulated_count} machines",
            "date": today
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error simulating data: {str(e)}")

# Initialize sample data on startup
@api_router.post("/init-sample-data")
async def initialize_sample_data(current_user: User = Depends(get_current_user)):
    """Initialize the platform with sample data"""
    await generate_sample_data()
    return {"message": "Sample data initialized successfully"}

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "Industrial Analytics Platform API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()