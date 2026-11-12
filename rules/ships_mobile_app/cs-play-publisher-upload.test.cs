// lexcode-expect: 5
// A release tool that puts an Android build on Google Play through the Google APIs client library:
// it uploads an app bundle and an APK into an edit and moves the production and beta tracks, on a
// service it is given (primary constructor), on one it builds with target-typed new, and on one
// reached through an alias.
using Google.Apis.AndroidPublisher.v3;
using Google.Apis.AndroidPublisher.v3.Data;
using Google.Apis.Services;
using Gp = Google.Apis.AndroidPublisher.v3;

namespace Contoso.Release;

public sealed class PlayRelease(AndroidPublisherService play)
{
    public async Task PublishAsync(string packageName, Stream aab, Stream apk)
    {
        var edit = await play.Edits.Insert(null, packageName).ExecuteAsync();
        var bundle = play.Edits.Bundles.Upload(packageName, edit.Id, aab, "application/octet-stream");
        await bundle.UploadAsync();
        await play.Edits.Apks.Upload(packageName, edit.Id, apk, "application/vnd.android.package-archive").UploadAsync();

        var track = new Track { Releases = [new TrackRelease { Status = "completed", VersionCodes = [bundle.ResponseBody.VersionCode] }] };
        await play.Edits.Tracks.Update(track, packageName, edit.Id, "production").ExecuteAsync();
        await play.Edits.Commit(packageName, edit.Id).ExecuteAsync();
    }

    public async Task PromoteAsync(BaseClientService.Initializer init, string packageName, string editId, Track track)
    {
        AndroidPublisherService built = new(init);
        await built.Edits.Tracks.Patch(track, packageName, editId, "beta").ExecuteAsync();

        var aliased = new Gp.AndroidPublisherService(init);
        await aliased.Edits.Tracks.Update(track, packageName, editId, "internal").ExecuteAsync();
    }
}
