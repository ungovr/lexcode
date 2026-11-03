# lexcode-expect: 3
import lightgbm as lgb
import xgboost as xgb


def train_xgb(X_train, y_train, X_val, y_val):
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dval = xgb.DMatrix(X_val, label=y_val)
    params = {"objective": "binary:logistic", "max_depth": 5, "eta": 0.1}
    return xgb.train(params, dtrain, num_boost_round=200, evals=[(dval, "val")], early_stopping_rounds=20)


def train_lgb(X_train, y_train):
    data = lgb.Dataset(X_train, label=y_train)
    return lgb.train({"objective": "regression", "learning_rate": 0.05}, data, num_boost_round=300)


def train_lgb_cv_then_final(X, y):
    data = lgb.Dataset(X, label=y)
    params = {"objective": "binary", "num_leaves": 31}
    booster = lightgbm_train(params, data)
    return booster


def lightgbm_train(params, data):
    import lightgbm

    return lightgbm.train(params, data, num_boost_round=100)
