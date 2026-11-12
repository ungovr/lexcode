// lexcode-expect: 7
// Training ML.NET models on the app's own data: a Model Builder style pipeline on a context it is
// given, a recommendation model and a demand forecast on a context the class builds, a classifier on
// a context reached through an alias, an AutoML experiment, and AutoML's newer experiment type
// built with target-typed new.
using Microsoft.ML;
using Microsoft.ML.AutoML;
using Microsoft.ML.Trainers;
using Ml = Microsoft.ML;

namespace Contoso.Insights;

public sealed class ChurnModel(MLContext mlContext)
{
    private readonly MLContext _ml = new(seed: 0);

    public ITransformer Train(IDataView trainData)
    {
        var pipeline = mlContext.Transforms.Concatenate("Features", "Visits", "Spend")
            .Append(mlContext.BinaryClassification.Trainers.FastTree(labelColumnName: "Churned"));
        return pipeline.Fit(trainData);
    }

    public ITransformer TrainRecommender(IDataView ratings)
    {
        var options = new MatrixFactorizationTrainer.Options { MatrixColumnIndexColumnName = "UserId", MatrixRowIndexColumnName = "ProductId", LabelColumnName = "Rating" };
        return _ml.Recommendation().Trainers.MatrixFactorization(options).Fit(ratings);
    }

    public ITransformer TrainForecast(IDataView sales)
    {
        var forecaster = _ml.Forecasting.ForecastBySsa("Forecast", "Units", windowSize: 7, seriesLength: 30, trainSize: 365, horizon: 7);
        return forecaster.Fit(sales);
    }

    public ITransformer TrainTopics(IDataView tickets)
    {
        var aliased = new Ml.MLContext();
        return aliased.MulticlassClassification.Trainers.SdcaMaximumEntropy().Fit(tickets);
    }

    public void Search(IDataView data)
    {
        var experiment = _ml.Auto().CreateRegressionExperiment(maxExperimentTimeInSeconds: 60);
        experiment.Execute(data, labelColumnName: "Spend");

        AutoMLExperiment sweep = new(_ml, new AutoMLExperiment.AutoMLExperimentSettings());
        var classic = new Microsoft.ML.AutoML.AutoMLExperiment(_ml, new AutoMLExperiment.AutoMLExperimentSettings());
    }
}
