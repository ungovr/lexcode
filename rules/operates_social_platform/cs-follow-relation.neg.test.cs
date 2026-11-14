// lexcode-expect: 0
// Not a follow or friendship between accounts: a support ticket's follow-up, a subscription to a
// product's price, a friend-referral code, a user who follows a forum topic (a notice
// subscription with no followed account) and the query for a user's watched topics, a query keyed
// on the follow-up date, and a class named for following a shipment.
using System;
using System.Collections.Generic;
using System.Linq;

namespace Demo.Shop;

public class TicketFollowUp
{
    public int TicketId { get; set; }
    public DateTime FollowUpOn { get; set; }
    public string AssignedTo { get; set; }
}

public class PriceSubscription
{
    public int ProductId { get; set; }
    public string SubscriberId { get; set; }
}

public class FriendReferralCode
{
    public string Code { get; set; }
    public string ReferrerId { get; set; }
}

public class TopicWatch
{
    public string FollowerId { get; set; }
    public int TopicId { get; set; }
}

public class FollowShipment
{
    public string TrackingNumber { get; set; }
}

public class TicketQueries
{
    public IEnumerable<TicketFollowUp> Due(IQueryable<TicketFollowUp> items, DateTime now) =>
        items.Where(t => t.FollowUpOn <= now).ToList();

    public List<TopicWatch> Watching(IQueryable<TopicWatch> watches, string me) =>
        watches.Where(w => w.FollowerId == me).ToList();
}
