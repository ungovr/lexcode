<?php
// lexcode-expect: 1
/**
 * Plugin Name:       Course Reminders
 * Plugin URI:        https://example.com/course-reminders
 * Description:       Emails learners a reminder before each course session.
 * Version:           1.4.0
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            Acme
 * License:           GPL-2.0-or-later
 * Text Domain:       course-reminders
 */

namespace Acme\CourseReminders;

defined('ABSPATH') || exit;

final class Plugin
{
    public static function boot(): void
    {
        add_action('init', [self::class, 'register']);
    }

    public static function register(): void
    {
        load_plugin_textdomain('course-reminders');
    }
}

Plugin::boot();
