# lexcode-expect: 7
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from xgboost import XGBClassifier


def train_churn_model(path: str):
    # A model built from the customer rows this app collects.
    df = pd.read_csv(path)
    X, y = df.drop(columns=["churned"]), df["churned"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)
    clf = RandomForestClassifier(n_estimators=200, random_state=0)
    clf.fit(X_train, y_train)
    return clf, clf.score(X_test, y_test)


def train_price_model(X, y):
    return GradientBoostingRegressor().fit(X, y)


def train_with_search(X, y):
    grid = GridSearchCV(SVC(), {"C": [0.1, 1, 10]}, cv=5)
    grid.fit(X, y)
    return grid.best_estimator_


def train_pipeline(X, y):
    # A scaler followed by a classifier: the pipeline as a whole is trained.
    pipe = Pipeline([("scale", StandardScaler()), ("clf", LogisticRegression(max_iter=500))])
    pipe.fit(X, y)
    return pipe


def train_online(batches):
    model = SGDClassifier(loss="log_loss")
    for X, y in batches:
        model.partial_fit(X, y, classes=[0, 1])
    return model


def train_boosted(X, y):
    model = XGBClassifier(n_estimators=300, max_depth=4)
    model.fit(X, y, eval_set=[(X, y)])
    return model


def retrain_from_feedback(rows):
    X = [r["features"] for r in rows]
    y = [r["label"] for r in rows]
    return LogisticRegression().fit(X, y)
