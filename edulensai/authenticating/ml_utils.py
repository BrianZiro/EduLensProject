import os
import joblib
from django.conf import settings

# Load the XGBoost model
MODEL_PATH = os.path.join(settings.ML_MODELS_PATH, "xgboost_tuned.pkl")
model = joblib.load(MODEL_PATH)

def predict_student_outcome(attendance, test_score, parental_involvement, discipline_count):
    """
    Takes student features and returns prediction.
    """
    features = [[attendance, test_score, parental_involvement, discipline_count]]
    prediction = model.predict(features)
    return prediction[0]
