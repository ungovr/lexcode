// lexcode-expect: 0
// Request models that validate other things, email words that are not an address field, a
// display hint that validates nothing, and the app's own EmailAddress attribute (a mail-merge
// placeholder marker), which shares the library's short name.
using FluentValidation;

namespace Demo.Templates;

public class ContactTopicForm
{
    [System.ComponentModel.DataAnnotations.Required]
    public string Subject { get; set; } = "";

    [System.ComponentModel.DataAnnotations.StringLength(2000)]
    public string EmailBody { get; set; } = "";

    // A rendering hint for a template preview; it checks nothing.
    [System.ComponentModel.DataAnnotations.DataType(System.ComponentModel.DataAnnotations.DataType.EmailAddress)]
    public string PreviewAddress { get; set; } = "";
}

public class TopicValidator : AbstractValidator<ContactTopicForm>
{
    public TopicValidator()
    {
        RuleFor(f => f.Subject).NotEmpty().MaximumLength(200);
        RuleFor(f => f.EmailBody).NotEmpty();
    }
}

// The app's own attribute of the same short name: marks where a merge field goes.
[AttributeUsage(AttributeTargets.Property)]
public sealed class EmailAddressAttribute : Attribute
{
}

public class MergeTemplate
{
    [EmailAddress]
    public string RecipientSlot { get; set; } = "{{to}}";
}

public class Formatter
{
    // A method named for the word, with no validation at all.
    public string EmailAddress(string local, string domain) => local + "@" + domain;

    public string Show() => EmailAddress("info", "example.org");
}
