import joblib

m = joblib.load("nlp-service/models/classifier.joblib")
joblib.dump(m, "nlp-service/models/classifier_resaved.joblib")