// lexcode-expect: 0
// What the rule does not count, each sent straight back as the response: a client's or
// request's metadata, a null check, and the calls on the same object that generate nothing.
// Generated with the rule's sanitizers (#13012 fix round 1): removing any one of them makes
// its case match. The is-not-null check goes to ViewBag: inside Ok(...) the engine carries
// no taint through an is pattern, so that shape would pin nothing.
using Microsoft.AspNetCore.Mvc;
using OpenAI;

namespace Demo.Generated;

public class MetadataController : Controller
{
    // $C.Model
    public async Task<IActionResult> Case1(OpenAIClient openAi)
    {
        var images = openAi.GetImageClient("dall-e-3");
        return Ok(images.Model);
    }

    // $C is not null
    public async Task<IActionResult> Case2(OpenAIClient openAi)
    {
        var images = openAi.GetImageClient("dall-e-3");
        ViewBag.Ready = images is not null;
        return Ok();
    }

    // $C != null
    public async Task<IActionResult> Case3(OpenAIClient openAi)
    {
        var images = openAi.GetImageClient("dall-e-3");
        return Ok(images != null);
    }
}
