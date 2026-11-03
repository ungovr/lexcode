# lexcode-expect: 0
from django.apps import AppConfig


class BillingConfig(AppConfig):
    name = "billing"


def approve_invoice(invoice, approver):
    invoice.status = "approved"
    invoice.approver = approver
    invoice.save()


def review_pull_request(pr, reviewer):
    pr.reviews.create(reviewer=reviewer, state="approved")


def approve_expense_report(report, manager):
    report.approved_by = manager
    report.save()
