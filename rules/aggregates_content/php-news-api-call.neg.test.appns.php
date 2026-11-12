<?php
// lexcode-expect: 0

namespace App\Newsroom;

use App\Newsroom\Local\jcobhams\NewsApi;

// The app's own NewsApi in a namespace that ends in the library's namespace, which reads the
// newsroom's own stories. The file-text guard must not take the namespace suffix for the
// library's namespace.
class OwnStories
{
    public function __construct(private NewsApi $news)
    {
    }

    public function front(): array
    {
        return $this->news->getTopHeadlines('local');
    }
}
