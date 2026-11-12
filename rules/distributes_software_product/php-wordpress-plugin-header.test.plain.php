<?php
// lexcode-expect: 1
/*
plugin name: Quiet Comments
Description: Holds comments with links for moderation.
Version: 0.9
*/

namespace Acme\QuietComments;

final class Moderation
{
    public function hold(int $commentId): void
    {
        wp_set_comment_status($commentId, 'hold');
    }
}
