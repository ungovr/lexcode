<?php
// lexcode-expect: 9
// Starting a hosted job that adapts a model to the app's own data: OpenAI fine-tuning through the
// openai-php client, its Laravel facade (through an aliased import and fully qualified), the
// legacy fine-tunes endpoint and the orhanerday client; an Amazon SageMaker training job and a
// Bedrock model customization job through the AWS SDK; and a Vertex AI training pipeline.
namespace App\Jobs;

use OpenAI\Laravel\Facades\OpenAI as Ai;
use Aws\SageMaker\SageMakerClient;
use Aws\Bedrock\BedrockClient;
use Google\Cloud\AIPlatform\V1\Client\PipelineServiceClient;

class TrainSupportModel
{
    public function __construct(
        private \OpenAI\Client $client,
        private SageMakerClient $sageMaker,
        private BedrockClient $bedrock,
        private PipelineServiceClient $pipelines,
        private \Orhanerday\OpenAi\OpenAi $legacy,
    ) {
    }

    public function handle(string $fileId): void
    {
        $this->client->fineTuning()->createJob([
            'training_file' => $fileId,
            'model' => 'gpt-4o-mini-2024-07-18',
        ]);
        Ai::fineTuning()->createJob(['training_file' => $fileId, 'model' => 'gpt-4o-mini-2024-07-18']);
        \OpenAI\Laravel\Facades\OpenAI::fineTuning()->createJob(['training_file' => $fileId, 'model' => 'gpt-4o-mini-2024-07-18']);
        $this->client->fineTunes()->create(['training_file' => $fileId]);
        $this->legacy->createFineTune(['model' => 'davinci', 'training_file' => $fileId]);
    }

    public function onAws(string $bucket): void
    {
        $this->sageMaker->createTrainingJob([
            'TrainingJobName' => 'churn-' . date('YmdHis'),
            'AlgorithmSpecification' => ['TrainingImage' => 'xgboost:1', 'TrainingInputMode' => 'File'],
            'InputDataConfig' => [['ChannelName' => 'train', 'DataSource' => ['S3DataSource' => ['S3Uri' => "s3://$bucket/train"]]]],
        ]);
        $this->sageMaker->createTrainingJobAsync(['TrainingJobName' => 'churn-nightly', 'RoleArn' => 'arn:aws:iam::1:role/x']);
        $this->bedrock->createModelCustomizationJob([
            'jobName' => 'support-tone',
            'baseModelIdentifier' => 'amazon.titan-text-express-v1',
            'trainingDataConfig' => ['s3Uri' => "s3://$bucket/tone.jsonl"],
        ]);
    }

    public function onVertex(string $parent, $pipeline): void
    {
        $this->pipelines->createTrainingPipeline($parent, $pipeline);
    }
}
