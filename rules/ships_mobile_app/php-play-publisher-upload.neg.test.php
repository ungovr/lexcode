<?php
// lexcode-expect: 0
// The Play Developer API used for things other than releasing a build: a server checking a
// subscription purchase and acknowledging a product, answering a review, and reading which
// release a track holds before throwing the edit away. None of it puts an app in the store.
// The look-alike is an app's own AndroidPublisher in another namespace whose asset store also
// has bundles and tracks.
namespace App\Billing;

use Google\Service\AndroidPublisher;
use Google\Service\AndroidPublisher\ProductPurchasesAcknowledgeRequest;
use Google\Service\AndroidPublisher\ReviewsReplyRequest;

class PlayChecks
{
    public function __construct(private AndroidPublisher $publisher, private string $packageName)
    {
    }

    public function subscriptionIsActive(string $subscriptionId, string $token): bool
    {
        $purchase = $this->publisher->purchases_subscriptions->get($this->packageName, $subscriptionId, $token);

        return $purchase->getExpiryTimeMillis() > time() * 1000;
    }

    public function acknowledge(string $productId, string $token): void
    {
        $this->publisher->purchases_products->acknowledge($this->packageName, $productId, $token, new ProductPurchasesAcknowledgeRequest());
    }

    public function thank(string $reviewId): void
    {
        $reply = new ReviewsReplyRequest();
        $reply->setReplyText('Thank you for the feedback.');
        $this->publisher->reviews->reply($this->packageName, $reviewId, $reply);
    }

    public function liveRelease(): string
    {
        $edit = $this->publisher->edits->insert($this->packageName, null);
        $track = $this->publisher->edits_tracks->get($this->packageName, $edit->id, 'production');
        $this->publisher->edits->delete($this->packageName, $edit->id);

        return $track->getReleases()[0]->getName();
    }
}
