// lexcode-expect: 0
// Reading from Google Play without shipping anything: a review dashboard lists reviews and reads the
// production track of an edit it then deletes. Beside it, a game studio's own AndroidPublisherService
// in another namespace uploads texture bundles to its asset store.
using Google.Apis.AndroidPublisher.v3;
using Contoso.Assets.Publishing;

namespace Contoso.Insights;

public sealed class ReviewDashboard(Google.Apis.AndroidPublisher.v3.AndroidPublisherService play)
{
    public async Task<int> CountAsync(string packageName)
    {
        var reviews = await play.Reviews.List(packageName).ExecuteAsync();
        var edit = await play.Edits.Insert(null, packageName).ExecuteAsync();
        var track = await play.Edits.Tracks.Get(packageName, edit.Id, "production").ExecuteAsync();
        await play.Edits.Delete(packageName, edit.Id).ExecuteAsync();
        return reviews.Reviews.Count + track.Releases.Count;
    }
}

public sealed class TexturePacker
{
    public void Pack(Contoso.Assets.Publishing.AndroidPublisherService store, Stream textures)
    {
        store.Edits.Bundles.Upload("textures", "level-1", textures, "application/octet-stream");
        store.Edits.Tracks.Update(null, "textures", "level-1", "beta");
    }
}
