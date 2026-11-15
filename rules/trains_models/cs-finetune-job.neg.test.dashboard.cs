// lexcode-expect: 0
// A dashboard that only reads the fine-tuning jobs of an OpenAI account: it takes a fine-tuning
// client, lists the jobs and their events, reads one and cancels a stuck one. It starts no training.
using OpenAI;
using OpenAI.FineTuning;

namespace Contoso.Admin;

public sealed class JobBoard(OpenAIClient openAI, FineTuningClient injected)
{
    public async Task ShowAsync(string stuckJobId)
    {
        var ft = openAI.GetFineTuningClient();
        await foreach (var job in ft.GetJobsAsync())
        {
            Console.WriteLine(job.Status);
        }

        FineTuningClient typed = openAI.GetFineTuningClient();
        var one = await typed.GetJobAsync(stuckJobId);
        await injected.GetJobsAsync().GetAsyncEnumerator().DisposeAsync();
        await openAI.GetFineTuningClient().GetJobAsync(stuckJobId);
        Console.WriteLine(one.Value.Status);
    }
}
