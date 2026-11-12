<?php
// lexcode-expect: 2
// Estimators written fully qualified in a file that imports nothing from either library.
namespace App\Console\Commands;

use Illuminate\Console\Command;

class RetrainRiskModel extends Command
{
    protected $signature = 'risk:retrain';

    public function handle(): int
    {
        $tree = new \Rubix\ML\Classifiers\ClassificationTree(10);
        $tree->train(new \Rubix\ML\Datasets\Labeled($this->samples(), $this->labels()));

        $regression = new \Phpml\Regression\LeastSquares();
        $regression->train($this->samples(), $this->scores());

        return self::SUCCESS;
    }
}
