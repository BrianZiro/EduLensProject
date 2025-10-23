import os
import joblib
from django.conf import settings

# Initialize model as None
model = None

def load_model():
    """Load the XGBoost model lazily"""
    global model
    if model is None:
        try:
            MODEL_PATH = os.path.join(settings.ML_MODELS_PATH, "xgboost_tuned.pkl")
            print(f"Attempting to load model from: {MODEL_PATH}")
            
            # Check if file exists
            if not os.path.exists(MODEL_PATH):
                print(f"ERROR: Model file does not exist at {MODEL_PATH}")
                return None
                
            model = joblib.load(MODEL_PATH)
            print(f"Model loaded successfully. Model type: {type(model)}")
            
            # Print model info if available
            if hasattr(model, 'feature_importances_'):
                print(f"Model has {len(model.feature_importances_)} features")
            elif hasattr(model, 'n_features_in_'):
                print(f"Model expects {model.n_features_in_} features")
                
        except Exception as e:
            print(f"ERROR: Could not load XGBoost model: {e}")
            print(f"Model path: {MODEL_PATH}")
            print(f"Settings ML_MODELS_PATH: {settings.ML_MODELS_PATH}")
            model = None
    return model

def reload_model():
    """Force reload the model"""
    global model
    model = None
    return load_model()


def predict_student_outcome(attendance, test_score, parental_involvement, discipline_count):
    """
    Takes student features and returns prediction using uniform classification.
    """
    try:
        # PROPER FEATURE SCALING
        attendance_pct = (attendance / 31) * 100
        test_score_pct = test_score
        parental_norm = (parental_involvement - 1) / 2
        discipline_norm = min(discipline_count / 10, 1)
        
        features = [[attendance_pct, test_score_pct, parental_norm, discipline_norm]]
        print(f"SCALED features: attendance_pct={attendance_pct:.1f}%, test_score_pct={test_score_pct}%, parental_norm={parental_norm:.2f}, discipline_norm={discipline_norm:.2f}")
        
        # HIGH RISK (≥70% dropout probability)
        if (attendance_pct <= 60 or test_score_pct <= 50 or discipline_count >= 4):
            print("HIGH RISK: Student meets high risk criteria")
            return 0.75  # 75% dropout risk
        
        # MEDIUM RISK (40-69% dropout probability)  
        elif (attendance_pct <= 80 or test_score_pct <= 70 or discipline_count >= 2):
            print("MEDIUM RISK: Student meets medium risk criteria")
            return 0.55  # 55% dropout risk
        
        # LOW RISK (<40% dropout probability)
        else:
            print("LOW RISK: Student meets low risk criteria")
            return 0.25  # 25% dropout risk
                
    except Exception as e:
        print(f"ERROR in prediction: {e}")
        return 0.5
