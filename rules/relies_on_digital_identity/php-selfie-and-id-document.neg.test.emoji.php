<?php
// lexcode-expect: 0
// Emoji tables keyed by name, and a list of emoji names: a selfie and an identification card sit
// beside each other as emoji, and no image is held.

namespace App\Support;

final class Emoji
{
    public const BY_SHORT_NAME = [
        'grinning' => '1F600',
        'smiley' => '1F603',
        'selfie' => '1F933',
        'identification_card' => '1FAAA',
        'passport_control' => '1F6C2',
    ];

    public static function picker(): array
    {
        return [
            'grinning_face' => ['unified' => '1F600', 'name' => 'Grinning Face'],
            'selfie' => ['unified' => '1F933', 'name' => 'Selfie'],
            'identification_card' => ['unified' => '1FAAA', 'name' => 'Identification Card'],
        ];
    }

    public static function recent(): array
    {
        return ['grinning', 'selfie', 'identification_card'];
    }
}
