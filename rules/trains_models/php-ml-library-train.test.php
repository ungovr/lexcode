<?php
// lexcode-expect: 6
// Fitting a model to the app's own data in process with Rubix ML or PHP-ML: an estimator held
// in a property and one in a local, a persistent model, a class imported under an alias, one
// written fully qualified with no import, online learning in batches, and a PHP-ML classifier.
namespace App\Recommendations;

use Rubix\ML\Classifiers\KNearestNeighbors;
use Rubix\ML\Regressors\Ridge as RidgeRegressor;
use Rubix\ML\PersistentModel;
use Rubix\ML\Persisters\Filesystem;
use Rubix\ML\Datasets\Labeled;
use Phpml\Classification\SVC;

class CourseRecommender
{
    private KNearestNeighbors $estimator;

    public function __construct()
    {
        $this->estimator = new KNearestNeighbors(5);
    }

    public function fit(array $samples, array $labels): void
    {
        $dataset = new Labeled($samples, $labels);
        $this->estimator->train($dataset);

        $model = new PersistentModel(new KNearestNeighbors(3), new Filesystem('storage/recommender.rbx'));
        $model->train($dataset);
        $model->save();

        $grades = new RidgeRegressor(1.0);
        $grades->train($dataset);
    }

    public function fitOnline(array $batches): void
    {
        $bayes = new \Rubix\ML\Classifiers\GaussianNB();
        $bayes->train(array_shift($batches));
        foreach ($batches as $batch) {
            $bayes->partial($batch);
        }
    }

    public function fitPhpMl(array $samples, array $labels): void
    {
        $classifier = new SVC();
        $classifier->train($samples, $labels);
    }
}
