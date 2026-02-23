# CrabOptimize Developer Documentation

CrabOptimize is built to be highly extensible. Below is a comprehensive list of available actions and filters you can use to customize the plugin's behavior, integrate it with other tools, or modify its core functionality.

## Developer API

### Actions

#### `dm_crab_optimize_loaded`
Fires when the CrabOptimize plugin has fully loaded and initialized its classes.
```php
add_action( 'dm_crab_optimize_loaded', function() {
    // Your custom code here
} );
```

#### `dm_crab_optimize_admin_assets_enqueued`
Fires after the plugin's admin assets (scripts and styles) have been enqueued.
- **`$hook`** *(string)*: The current admin page hook suffix.

#### `dm_crab_optimize_meta_saved`
Fires after optimization metadata is saved for an attachment. Useful for triggering third-party cache clearing or logging.
- **`$post_id`** *(int)*: The attachment ID.
- **`$mime_type`** *(string)*: The mime type of the attachment.

#### `dm_crab_optimize_migration_linked`
Fires when an unoptimized image is successfully linked to its new optimized counterpart during migration.
- **`$original_id`** *(int)*: The original attachment ID.
- **`$optimized_id`** *(int)*: The optimized attachment ID.
- **`$format`** *(string)*: The optimization format (e.g., 'avif', 'webp').

#### `dm_crab_optimize_settings_registered`
Fires after all CrabOptimize settings have been registered with WordPress.

#### `dm_crab_optimize_settings_form_bottom`
Fires at the bottom of the settings form table, allowing you to inject custom settings rows.
```php
add_action( 'dm_crab_optimize_settings_form_bottom', function() {
    echo '<tr valign="top"><th scope="row">Custom Setting</th><td>...</td></tr>';
} );
```

### Filters

#### `dm_crab_optimize_localized_settings`
Filters the localized settings array passed to the frontend JavaScript (`window.dmCrabSettingsMain`).
- **`$settings`** *(array)*: The settings array.

#### `dm_crab_optimize_column_title`
Filters the title of the "Crab Optimized" column in the Media Library.
- **`$title`** *(string)*: The column title.

#### `dm_crab_optimize_js_meta`
Filters the metadata exposed to the WordPress JS Media models.
- **`$response`** *(array)*: Array of prepared attachment data.
- **`$attachment`** *(WP_Post)*: The attachment object.

#### `dm_crab_optimize_disable_thumbnails`
Filters the image sizes to be generated for an attachment. By default, CrabOptimize disables thumbnail generation for AVIF/WebP if configured to do so.
- **`$sizes`** *(array)*: Array of image sizes that would be generated.
- **`$metadata`** *(array)*: Attachment metadata array.
- **`$attachment_id`** *(int)*: Attachment post ID.

#### `dm_crab_optimize_discovery_query_args`
Filters the `WP_Query` arguments used to discover unoptimized images during the bulk migration process.
- **`$query_args`** *(array)*: The query arguments.

#### `dm_crab_optimize_replacement_query_args`
Filters the `WP_Query` arguments used to find posts for content replacement during migration.
- **`$query_args`** *(array)*: The query arguments.

#### `dm_crab_optimize_allowed_formats`
Filters the allowed image formats for optimization in the settings.
- **`$allowed_formats`** *(array)*: Array of allowed formats (default: `['avif', 'webp']`).

#### `dm_crab_optimize_migration_replacement_post_types`
Filters the post types that are scanned and updated during the content replacement phase of migration.
- **`$post_types`** *(array)*: Array of post types (default: `['post', 'page']`).

#### `dm_crab_optimize_migration_replacement_rules`
Filters the regex rules used for replacing old image IDs and URLs with optimized ones in post content.
- **`$rules`** *(array)*: Array of replacement rules containing `pattern` and `callback`.
- **`$optimization_map`** *(array)*: Associative array mapping old attachment IDs to new optimized attachment IDs.