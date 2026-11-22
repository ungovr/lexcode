// lexcode-expect: 0
// A request message with a GET method for a generation address, which makes nothing: the stored chat completions listed.
// Each method is HttpMethod.Get, new HttpMethod("GET") or its fully qualified form, and each
// address is written in the message, held in an interpolated local or held in a local const.
using System.Net.Http;

namespace Demo.Generated;

public class TextGet(HttpClient http)
{
    public async Task<string> GetLiteral(string n)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.openai.com/v1/chat/completions");
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> GetLocal(string n)
    {
        var url = $"https://api.openai.com/v1/chat/completions?limit={n}";
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> GetConst(string n)
    {
        const string address = "https://api.openai.com/v1/chat/completions";
        var request = new HttpRequestMessage(HttpMethod.Get, address);
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> GetNamedLiteral(string n)
    {
        var request = new HttpRequestMessage(new HttpMethod("GET"), "https://api.openai.com/v1/chat/completions");
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> GetNamedLocal(string n)
    {
        var url = $"https://api.openai.com/v1/chat/completions?limit={n}";
        var request = new HttpRequestMessage(new HttpMethod("GET"), url);
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> GetNamedConst(string n)
    {
        const string address = "https://api.openai.com/v1/chat/completions";
        var request = new HttpRequestMessage(new HttpMethod("GET"), address);
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> GetQualifiedLiteral(string n)
    {
        var request = new HttpRequestMessage(new System.Net.Http.HttpMethod("GET"), "https://api.openai.com/v1/chat/completions");
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> GetQualifiedLocal(string n)
    {
        var url = $"https://api.openai.com/v1/chat/completions?limit={n}";
        var request = new HttpRequestMessage(new System.Net.Http.HttpMethod("GET"), url);
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }

    public async Task<string> GetQualifiedConst(string n)
    {
        const string address = "https://api.openai.com/v1/chat/completions";
        var request = new HttpRequestMessage(new System.Net.Http.HttpMethod("GET"), address);
        var r = await http.SendAsync(request);
        return await r.Content.ReadAsStringAsync();
    }
}
