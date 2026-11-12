<?php
// lexcode-expect: 0
// Using a model without training it: a saved Rubix model loaded and asked for predictions, and a
// feature transformer fitted to rescale data (a transformer is not a model, as the JVM rules
// rule for Spark). The look-alikes are an app's own KNearestNeighbors in another namespace and a
// coaching plan whose train() schedules a workout.
namespace App\Coaching;

use App\Matching\Classifiers\KNearestNeighbors;
use Rubix\ML\Datasets\Unlabeled;
use Rubix\ML\Persisters\Filesystem;
use Rubix\ML\Transformers\ZScaleStandardizer;

class WorkoutPlanner
{
    public function __construct(private Plan $plan)
    {
    }

    public function suggest(array $samples): array
    {
        $model = \Rubix\ML\PersistentModel::load(new Filesystem('storage/recommender.rbx'));

        return $model->predict(new Unlabeled($samples));
    }

    public function rescale(Unlabeled $dataset): void
    {
        $scaler = new ZScaleStandardizer();
        $scaler->fit($dataset);
        $dataset->apply($scaler);
    }

    public function schedule(string $athlete): void
    {
        $matcher = new KNearestNeighbors();
        $matcher->train([$athlete]);
        $this->plan->train($athlete, 'tempo run');
    }
}
