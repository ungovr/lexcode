// lexcode-expect: 0
// What the rule does not count, each sent straight back as the response: a client's or
// request's metadata, a null check, and the calls on the same object that generate nothing.
// Generated with the rule's sanitizers (#13012 fix round 1): removing any one of them makes
// its case match. The is-not-null check goes to ViewBag: inside Ok(...) the engine carries
// no taint through an is pattern, so that shape would pin nothing.
using Google.Cloud.AIPlatform.V1;
using Microsoft.AspNetCore.Mvc;
using Mscc.GenerativeAI;

namespace Demo.Generated;

public class MetadataController : Controller
{
    // $C.Model
    public async Task<IActionResult> Case1(GoogleAI googleAI, string q)
    {
        var request = new GenerateContentRequest { Model = "gemini-2.5-pro" };
        return Ok(request.Model);
    }

    // $C.Name
    public async Task<IActionResult> Case2(GoogleAI googleAI, string q)
    {
        var model = new GenerativeModel("key");
        return Ok(model.Name);
    }

    // $C is not null
    public async Task<IActionResult> Case3(GoogleAI googleAI, string q)
    {
        var model = googleAI.GenerativeModel("gemini-2.5-flash");
        ViewBag.Ready = model is not null;
        return Ok();
    }

    // $C != null
    public async Task<IActionResult> Case4(GoogleAI googleAI, string q)
    {
        var model = googleAI.GenerativeModel("gemini-2.5-flash");
        return Ok(model != null);
    }

    // $M.CountTokens(...)
    public async Task<IActionResult> Case5(GoogleAI googleAI, string q)
    {
        var model = googleAI.GenerativeModel("gemini-2.5-flash");
        return Ok(await model.CountTokens(q));
    }

    // $M.EmbedContent(...)
    public async Task<IActionResult> Case6(GoogleAI googleAI, string q)
    {
        var model = googleAI.GenerativeModel("text-embedding-004");
        return Ok(await model.EmbedContent(q));
    }

    // $M.BatchEmbedContent(...)
    public async Task<IActionResult> Case7(GoogleAI googleAI, string q)
    {
        var model = googleAI.GenerativeModel("text-embedding-004");
        return Ok(await model.BatchEmbedContent(new[] { q }));
    }
}
