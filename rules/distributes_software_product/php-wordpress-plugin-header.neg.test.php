<?php
// lexcode-expect: 0
// A site's own code that reads plugin headers, as an admin screen listing installed plugins
// does, and a docblock that talks about the header without being one. A theme's functions.php
// is not a plugin. None of it declares a plugin.
namespace Acme\SiteTools;

/**
 * Lists installed plugins. The Plugin Name: line of each plugin's main file is read by WordPress.
 */
final class PluginReport
{
    public function rows(string $pluginFile): array
    {
        $data = get_file_data($pluginFile, [
            'Name' => 'Plugin Name',
            'Version' => 'Version',
        ]);

        return [sprintf('Plugin Name: %s', $data['Name']), $data['Version']];
    }
}

add_action('after_setup_theme', static function (): void {
    add_theme_support('title-tag');
});
