// lexcode-expect: 0
using Shop.Backoffice.Net;

namespace Shop.Backoffice;

// The app's own WebClient and WebRequest classes in its own namespace, with the same short names and
// method names as System.Net's. They read the operator's own back-office endpoints from its own
// service registry, so none of these calls is taken for fetching a list of other sites' addresses.
public class EndpointWarmup(WebClient backoffice)
{
    public void Warm(IEnumerable<string> endpointUrls)
    {
        foreach (var url in endpointUrls)
        {
            backoffice.DownloadString(url);
            WebClient local = new();
            local.DownloadData(url);
            var request = WebRequest.Create(url);
        }
    }
}
